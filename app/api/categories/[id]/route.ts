import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.category.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const cat = await prisma.category.update({ where: { id: parseInt(params.id) }, data: body });
  return NextResponse.json(cat);
}
