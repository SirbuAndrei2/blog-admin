import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { image_base64, image_name = "preview.jpg" } = data;

        if (!image_base64) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const localDir = path.join(process.cwd(), "public", "uploads", "banners");
        if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

        const buffer = Buffer.from(image_base64, "base64");
        const safeName = image_name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
        const finalName = `${Date.now()}-${safeName}`;
        const localFilePath = path.join(localDir, finalName);

        fs.writeFileSync(localFilePath, buffer);

        return NextResponse.json({
            success: true,
            path: `/uploads/banners/${finalName}`
        });

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error local upload";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
