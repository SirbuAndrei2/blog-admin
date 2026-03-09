import { NextRequest, NextResponse } from "next/server";
import { regenerateBlock } from "@/lib/ai-pipeline";

export async function POST(req: NextRequest) {
  try {
    const { sectionTitle, articleTitle, opts, feedback } = await req.json();
    const block = await regenerateBlock(sectionTitle, articleTitle, opts, feedback);
    return NextResponse.json({ block });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
