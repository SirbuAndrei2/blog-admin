import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const authors = await prisma.author.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(authors);
}

export async function POST(req: NextRequest) {
  const { name, bio, image } = await req.json();
  const author = await prisma.author.create({ data: { name, bio: bio ?? null, image: image ?? null } });
  return NextResponse.json(author, { status: 201 });
}
