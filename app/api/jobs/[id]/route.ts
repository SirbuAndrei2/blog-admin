import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/jobs/[id] - Update job (status, etc.)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { status, scheduled_at } = body;

    const data: any = {};
    if (status) data.status = status;
    if (scheduled_at) data.scheduled_at = new Date(scheduled_at);

    const job = await prisma.automationJob.update({
      where: { id },
      data,
    });

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    await prisma.automationJob.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
