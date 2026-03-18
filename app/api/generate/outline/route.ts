import { NextRequest, NextResponse } from "next/server";
import { generateOutline, generateMeta, logDebug } from "@/lib/ai-pipeline";
import { downloadUnsplashImage } from "@/lib/unsplash";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const opts = await req.json();
    console.log("[api/generate/outline] STARTing for topic:", opts.topic);
    
    if (!opts.topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    if (!opts.site_id) return NextResponse.json({ error: "Site ID is required" }, { status: 400 });

    const site = await prisma.site.findUnique({ where: { id: Number(opts.site_id) } });
    if (!site) {
      console.warn("[api/generate/outline] Site not found:", opts.site_id);
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Include site persona if not already provided in opts
    const siteAny = site as any;
    if (!opts.ai_persona && siteAny.ai_persona) {
      opts.ai_persona = siteAny.ai_persona;
    }

    console.log("[api/generate/outline] Generating outline...");
    const outline = await generateOutline(opts);
    console.log("[api/generate/outline] Outline generated:", outline.title);

    console.log("[api/generate/outline] Generating meta and fetching image...");
    // Run meta + image in parallel
    const [meta, image] = await Promise.all([
      generateMeta(outline, opts.language, opts),
      downloadUnsplashImage(opts.topic, outline.slug, site.domain, site.api_key).catch((ei) => {
        console.error("[api/generate/outline] Image fetch error:", ei.message || ei);
        return null;
      }),
    ]);

    console.log("[api/generate/outline] SUCCESS. Returning response.");
    return NextResponse.json({ outline, meta, image });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const detail = e instanceof Error ? e.stack : "";
    
    console.error("[api/generate/outline] CRITICAL 500 ERROR:", msg);
    logDebug(`ROUTE ERROR (/api/generate/outline): ${msg}\n${detail}`);
    
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
