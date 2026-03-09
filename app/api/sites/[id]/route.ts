import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH /api/sites/[id]
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const siteId = parseInt(params.id);
        const { name, domain, ai_persona } = await req.json();

        if (isNaN(siteId)) {
            return NextResponse.json({ error: "Invalid Site ID" }, { status: 400 });
        }

        const site = await prisma.site.update({
            where: { id: siteId },
            data: {
                name: name || undefined,
                domain: domain || undefined,
                ai_persona: ai_persona === undefined ? undefined : ai_persona,
            },
        });

        return NextResponse.json(site);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error updating site";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// DELETE /api/sites/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const siteId = parseInt(params.id);
        if (isNaN(siteId)) {
            return NextResponse.json({ error: "Invalid Site ID" }, { status: 400 });
        }
        await prisma.site.delete({ where: { id: siteId } });
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error deleting site";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
