import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/articles/[slug]
// Requires headers: { "Authorization": "Bearer <API_KEY>" }
export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
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

        // Fetch the specific article belonging to this site
        const article = await prisma.article.findFirst({
            where: {
                site_id: site.id,
                slug: params.slug
            },
            include: {
                category: true,
                author: true,
                meta: true,
            },
        });

        // Fetch banners for this site
        const banners = await prisma.banner.findMany({
            where: { site_id: site.id, status: "active" },
        });

        if (!article) {
            return NextResponse.json({ error: "Article not found or not associated with this site" }, { status: 404 });
        }

        return NextResponse.json({
            site: { id: site.id, name: site.name, domain: site.domain },
            data: article,
            banners: banners,
        });

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Internal Server Error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
