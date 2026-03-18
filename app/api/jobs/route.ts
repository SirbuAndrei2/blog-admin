import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/jobs - List all automation jobs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const site_id = searchParams.get("site_id");
    const status = searchParams.get("status");

    const where: any = {};
    if (site_id) where.site_id = Number(site_id);
    if (status) where.status = status;

    const jobs = await prisma.automationJob.findMany({
      where,
      include: {
        site: { select: { name: true } },
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/jobs - Create a new automation job
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      instructions,
      keywords,
      backlinks,
      tone,
      length,
      language,
      frequency,
      scheduled_at,
      config,
      site_id,
      category_id,
      author_id,
    } = body;

    if (!topic || !site_id || !scheduled_at || !frequency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[API] Creating new job for topic: ${topic}`);
    const job = await prisma.automationJob.create({
      data: {
        topic,
        instructions,
        keywords,
        backlinks,
        tone,
        length,
        language: language || "ro",
        frequency,
        scheduled_at: new Date(scheduled_at),
        config: config || {},
        status: "active",
        site_id: Number(site_id),
        category_id: category_id ? Number(category_id) : null,
        author_id: author_id ? Number(author_id) : null,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error("[API] Failed to create job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
