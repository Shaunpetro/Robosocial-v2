// apps/web/src/app/api/media/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MediaType } from "@prisma/client";
import { UTApi } from "uploadthing/server";
import { analyseMedia } from "@/lib/ai/media-analysis";

const utapi = new UTApi();

function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  return MediaType.IMAGE;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const companyId = formData.get("companyId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const validTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "video/mp4", "video/webm", "video/quicktime",
      "application/pdf",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    const uploadResponse = await utapi.uploadFiles(file);
    if (!uploadResponse.data) {
      console.error("Upload failed:", uploadResponse.error);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const fileData = uploadResponse.data;
    const fileUrl = fileData.ufsUrl || fileData.url || fileData.appUrl;
    const fileName = fileData.name || file.name;
    const fileSize = fileData.size || file.size;
    const mediaType = getMediaType(file.type);

    // 14‑day expiry (instead of 2 months)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    // AI auto‑tagging and alt‑text (non‑blocking)
    let aiResult = { tags: [] as string[], altText: fileName, contentType: "educational" };
    try {
      aiResult = await analyseMedia(
        fileName,
        file.type,
        company.name,
        company.industry ?? undefined
      );
    } catch (err) {
      console.warn("AI media analysis skipped:", err);
    }

    const media = await prisma.media.create({
      data: {
        companyId,
        filename: fileName,
        url: fileUrl,
        type: mediaType,
        mimeType: file.type,
        size: fileSize,
        expiresAt,
        isUsed: false,
        usedAt: null,
        usedInPostId: null,
        autoSelect: true,
        priority: 0,
        usageCount: 0,
        lastUsedAt: null,
        pillarIds: [],
        contentTypes: aiResult.contentType ? [aiResult.contentType] : [],
        tags: aiResult.tags,
        altText: aiResult.altText,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}