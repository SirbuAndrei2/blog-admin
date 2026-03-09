import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");

// Ensure /public/images exists
function ensureDir() {
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
}

// POST /api/upload/url
// Body: { url: string, slug?: string }
export async function POST(req: NextRequest) {
    try {
        const { url, slug = "uploaded-image" } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        ensureDir();

        // Fetch the image from the provided URL
        const response = await fetch(url, { redirect: "follow" });
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        // Determine extension from content-type or default to jpg
        const contentType = response.headers.get("content-type") || "";
        let ext = "jpg";
        if (contentType.includes("png")) ext = "png";
        if (contentType.includes("webp")) ext = "webp";
        if (contentType.includes("gif")) ext = "gif";

        const filename = `${slug.replace(/[^a-z0-9-]/gi, "").toLowerCase()}-${Date.now()}.${ext}`;
        const filePath = path.join(IMAGES_DIR, filename);
        const localPath = `/images/${filename}`;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        return NextResponse.json({
            success: true,
            localPath: localPath,
            publicUrl: `${appUrl}${localPath}`,
        });

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to download and save image";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
