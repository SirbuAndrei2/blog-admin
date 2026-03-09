import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/articles/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: parseInt(params.id) },
    include: { category: true, author: true, meta: true },
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

// PATCH /api/articles/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const {
      title,
      slug,
      image,
      content,
      blocks,
      language,
      category_id,
      author_id,
      site_id,
      status,
      meta,
      published_at
    } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (image !== undefined) data.image = image;
    if (content !== undefined) data.content = content;
    if (blocks !== undefined) data.blocks = blocks;
    if (language !== undefined) data.language = language;
    if (category_id !== undefined) data.category_id = category_id;
    if (author_id !== undefined) data.author_id = author_id;
    if (site_id !== undefined) data.site_id = site_id;

    if (status) {
      data.status = status;
      if (status === "published") data.published_at = published_at ? new Date(published_at) : new Date();
      if (status === "draft") data.published_at = null;
    }

    let metaUpdate = undefined;
    if (meta) {
      const { id: _mId, article_id: _aId, ...metaData } = meta;
      metaUpdate = {
        upsert: {
          create: {
            page_title: metaData.page_title ?? title ?? "",
            meta_title: metaData.meta_title ?? title ?? "",
            meta_keywords: metaData.meta_keywords ?? "",
            meta_description: metaData.meta_description ?? "",
          },
          update: metaData,
        },
      };
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...data,
        ...(metaUpdate ? { meta: metaUpdate } : {}),
      },
      include: { category: true, author: true, meta: true },
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 ARTICLE UPDATED");
    console.log("   ID:", article.id);
    console.log("   Title:", article.title);
    console.log("   Status:", article.status);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return NextResponse.json(article);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/articles/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.article.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ ok: true });
}
