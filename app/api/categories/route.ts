import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { name, color } = await req.json();
  const slug = slugify(name, { lower: true, strict: true });
  const cat = await prisma.category.create({ data: { name, slug, color: color ?? "#6366f1" } });
  return NextResponse.json(cat, { status: 201 });
}
