import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/articles
// Requires headers: { "Authorization": "Bearer <API_KEY>" }
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized. Missing or invalid Authorization header." }, { status: 401 });
        }

        const apiKey = authHeader.split(" ")[1];

        // Find the site associated with this API key
        const site = await prisma.site.findUnique({
            where: { api_key: apiKey },
        });

        if (!site) {
            return NextResponse.json({ error: "Forbidden. Invalid API Key." }, { status: 403 });
        }

        // Parse URL parameters for pagination (optional)
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const page = parseInt(searchParams.get("page") || "1");
        const status = searchParams.get("status") || "published"; // default to only published

        // Fetch articles only belonging to this site
        const articles = await prisma.article.findMany({
            where: {
                site_id: site.id,
                ...(status ? { status } : {}) // if status is passed as empty, fetch all (for draft previews if needed)
            },
            include: {
                category: true,
                author: true,
                meta: true,
            },
            orderBy: { created_at: "desc" },
            take: limit,
            skip: (page - 1) * limit,
        });

        // Fetch banners for this site
        const banners = await prisma.banner.findMany({
            where: {
                site_id: site.id,
                status: "active"
            }
        });

        return NextResponse.json({
            site: { id: site.id, name: site.name, domain: site.domain },
            data: articles,
            banners: banners,
            meta: { page, limit, count: articles.length }
        });

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Internal Server Error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
