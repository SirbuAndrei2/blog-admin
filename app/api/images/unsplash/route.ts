import { NextRequest, NextResponse } from "next/server";
import { downloadUnsplashImage } from "@/lib/unsplash";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/images/unsplash
// body: { topic: string, slug: string, site_id: number }
// returns: { localPath, publicUrl, unsplashUrl }
export async function POST(req: NextRequest) {
  try {
    const { topic, slug, site_id } = await req.json();
    if (!topic || !slug || !site_id) {
      return NextResponse.json({ error: "topic, slug and site_id are required" }, { status: 400 });
    }

    const site = await prisma.site.findUnique({ where: { id: Number(site_id) } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const image = await downloadUnsplashImage(topic, slug, site.domain, site.api_key);
    return NextResponse.json(image);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to download image";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
