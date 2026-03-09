import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/banners/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        const body = await req.json();
        const { site_id, type, name, image_url, link_url, status } = body;

        const data: any = {};
        if (site_id !== undefined) data.site_id = Number(site_id);
        if (type !== undefined) data.type = type;
        if (name !== undefined) data.name = name;
        if (image_url !== undefined) data.image_url = image_url;
        if (link_url !== undefined) data.link_url = link_url;
        if (status !== undefined) data.status = status;

        const banner = await prisma.banner.update({
            where: { id },
            data,
        });

        return NextResponse.json(banner);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error updating banner";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// DELETE /api/banners/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        await prisma.banner.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error deleting banner";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
