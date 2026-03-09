import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/banners - list all banners
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const site_id = searchParams.get("site_id");
    const type = searchParams.get("type");

    const where: any = {};
    if (site_id) where.site_id = Number(site_id);
    if (type) where.type = type;

    const banners = await prisma.banner.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: { site: true },
    });

    return NextResponse.json(banners);
}

// POST /api/banners - create new banner
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { site_id, type, name, image_url, link_url, status, image_base64, image_name } = body;

        if (!site_id || !type || (!image_url && !image_base64)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let finalImageUrl = image_url;

        // If we have base64, push it to the satellite
        if (image_base64) {
            const site = await prisma.site.findUnique({ where: { id: Number(site_id) } });
            if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

            const domain = site.domain.replace(/\/$/, "");
            const uploadUrl = `${domain}/api/upload`;

            const uploadRes = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${site.api_key}`
                },
                body: JSON.stringify({
                    image_base64,
                    image_name: image_name || "banner.jpg"
                })
            });

            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                throw new Error(`Satellite upload failed (${uploadRes.status}): ${errText}`);
            }

            const uploadData = await uploadRes.json();
            // Store full URL (Satellite Domain + Path)
            finalImageUrl = `${domain}${uploadData.path}`;
        }

        const banner = await prisma.banner.create({
            data: {
                site_id: Number(site_id),
                type,
                name,
                image_url: finalImageUrl,
                link_url,
                status: status || "active",
            },
        });

        return NextResponse.json(banner, { status: 201 });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error creating banner";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
