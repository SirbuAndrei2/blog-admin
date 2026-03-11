import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// GET /api/sites
export async function GET() {
    try {
        const sites = await prisma.site.findMany({
            orderBy: { created_at: "desc" },
        });
        return NextResponse.json(sites);
    } catch {
        return NextResponse.json([], { status: 200 });
    }
}

// POST /api/sites
export async function POST(req: NextRequest) {
    try {
        const { name, domain, ai_persona } = await req.json();

        if (!name || !domain) {
            return NextResponse.json({ error: "Name and domain are required" }, { status: 400 });
        }

        // Generate a unique API key
        const apiKey = crypto.randomBytes(32).toString('hex');

        const site = await prisma.site.create({
            data: {
                name,
                domain,
                api_key: apiKey,
                ai_persona: ai_persona || null,
            },
        });

        return NextResponse.json(site, { status: 201 });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error creating site";
        // Check for unique constraint violation ( Prisma code P2002 )
        if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2002') {
            return NextResponse.json({ error: "Domain already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
