import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";

// GET /api/articles
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const site_id = searchParams.get("site_id");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (site_id) where.site_id = Number(site_id);
  try {
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { category: true, author: true, meta: true },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);
    return NextResponse.json({ articles, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ articles: [], total: 0, page, pages: 0 }, { status: 200 });
  }
}

// POST /api/articles - create/save article
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, topic, backlinks, image, content, blocks, language, status, category_id, author_id, site_id, meta, published_at } = body;

    let finalSlug = slug || slugify(title, { lower: true, strict: true });

    // Attempt creation with progressive slug modifications to handle uniqueness and potential race conditions
    let article;
    let attempts = 0;
    while (!article && attempts < 10) {
      try {
        let isUnique = false;
        let counter = attempts; // Start with attempt counter if we retried due to race
        let candidateSlug = attempts === 0 ? finalSlug : `${finalSlug}-${attempts}`;

        // Pre-check uniqueness (Standard path)
        while (!isUnique) {
          const existing = await prisma.article.findUnique({
            where: { slug: candidateSlug },
          });

          if (!existing) {
            isUnique = true;
            finalSlug = candidateSlug;
          } else {
            counter++;
            candidateSlug = `${finalSlug}-${counter}`;
          }
        }

        article = await prisma.article.create({
          data: {
            title,
            slug: finalSlug,
            topic: topic ?? null,
            backlinks: backlinks ?? null,
            image: image ?? null,
            content,
            blocks,
            language: language ?? "en",
            status: status ?? "draft",
            published_at: status === "published" ? (published_at ? new Date(published_at) : new Date()) : null,
            category_id: category_id ?? null,
            author_id: author_id ?? null,
            site_id: site_id ?? null,
            meta: meta
              ? {
                create: {
                  page_title: meta.page_title ?? title,
                  meta_title: meta.meta_title ?? title,
                  meta_keywords: meta.meta_keywords ?? "",
                  meta_description: meta.meta_description ?? "",
                },
              }
              : undefined,
          },
          include: { category: true, author: true, meta: true },
        });
      } catch (e: any) {
        // If it's a unique constraint error (P2002), it was a race condition. Increment attempts and try again.
        if (e.code === 'P2002') {
          attempts++;
          console.warn(`[api] Slug race condition detected for "${finalSlug}". Attempt ${attempts}...`);
        } else {
          throw e; // Rethrow other errors
        }
      }
    }

    if (!article) throw new Error("Could not create article after multiple attempts due to slug collisions.");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 ARTICLE CREATED/PUBLISHED");
    console.log("   ID:", article.id);
    console.log("   Title:", article.title);
    console.log("   Status:", article.status);
    console.log("   Site ID:", article.site_id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return NextResponse.json(article, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
