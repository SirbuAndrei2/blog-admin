import { NextRequest, NextResponse } from "next/server";
import { generateOutline, generateMeta } from "@/lib/ai-pipeline";
import { downloadUnsplashImage } from "@/lib/unsplash";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const opts = await req.json();
    if (!opts.topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    if (!opts.site_id) return NextResponse.json({ error: "Site ID is required" }, { status: 400 });

    const site = await prisma.site.findUnique({ where: { id: Number(opts.site_id) } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    // Include site persona if not already provided in opts
    const siteAny = site as any;
    if (!opts.ai_persona && siteAny.ai_persona) {
      opts.ai_persona = siteAny.ai_persona;
    }

    // Generate outline first (need slug for image filename)
    const outline = await generateOutline(opts);

    // Run meta + image in parallel
    const [meta, image] = await Promise.all([
      generateMeta(outline, opts.language, opts),
      downloadUnsplashImage(opts.topic, outline.slug, site.domain, site.api_key).catch(() => null),
    ]);

    return NextResponse.json({ outline, meta, image });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
