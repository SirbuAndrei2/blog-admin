import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        // site_id is required now to know WHICH frontend gets the image
        const { image_base64, image_name = "uploaded-image.jpg", site_id } = data;

        if (!image_base64) {
            return NextResponse.json({ error: "No image_base64 provided" }, { status: 400 });
        }
        if (!site_id) {
            return NextResponse.json({ error: "site_id is required to upload images" }, { status: 400 });
        }

        const site = await prisma.site.findUnique({ where: { id: Number(site_id) } });
        if (!site) {
            return NextResponse.json({ error: "Site not found" }, { status: 404 });
        }

        const domain = site.domain.replace(/\/$/, "");
        const uploadUrl = `${domain}/api/upload`;

        console.log(`[manual-upload] Pushing image to Satellite: ${uploadUrl}`);

        const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${site.api_key}`
            },
            body: JSON.stringify({
                image_base64,
                image_name
            })
        });

        if (!uploadRes.ok) {
            const errBody = await uploadRes.text();
            throw new Error(`Satellite Upload Error (${uploadRes.status}): ${errBody}`);
        }

        const responseData = await uploadRes.json();

        // -- NEW: Save a local copy on Admin for preview/edit! --
        const fs = require("fs");
        const path = require("path");
        const localDir = path.join(process.cwd(), "public", "uploads", "articles");
        if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

        const buffer = Buffer.from(image_base64, "base64");
        const safeName = image_name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
        const finalName = `${Date.now()}-${safeName}`;
        const localFilePath = path.join(localDir, finalName);

        fs.writeFileSync(localFilePath, buffer);
        console.log(`[manual-upload] Saved local admin copy: ${localFilePath}`);

        return NextResponse.json({
            success: true,
            path: responseData.path, // This is the relative path ON THE FRONTEND (e.g., /data/images/xyz.jpg)
            publicUrl: `${domain}${responseData.path}`,
            localAdminPath: `/uploads/articles/${finalName}`
        });

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error uploading image";
        return NextResponse.json({ error: msg, message: msg }, { status: 500 });
    }
}

