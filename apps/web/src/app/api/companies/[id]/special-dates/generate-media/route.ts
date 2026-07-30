// apps/web/src/app/api/companies/[id]/special-dates/generate-media/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og";
import { prisma } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  // 1. Fetch config with logo media
  const config = await prisma.companySpecialDatesConfig.findUnique({
    where: { companyId },
    include: { logoMedia: true },
  });
  if (!config || !config.enabled) {
    return NextResponse.json({ error: "Feature not enabled" }, { status: 400 });
  }
  if (!config.logoMedia) {
    return NextResponse.json(
      { error: "Please upload a company logo first" },
      { status: 400 }
    );
  }

  // 2. Fetch company details
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      platforms: { where: { isConnected: true } },
    },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const logoUrl = config.logoMedia.url;
  const website = company.website || "";
  const platformHandles = company.platforms.map(
    (p) => `${p.type}: @${p.username || p.name}`
  );

  // 3. Generate image with @vercel/og
  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          color: "white",
          fontFamily: "Arial, sans-serif",
          padding: 40,
        }}
      >
        <img
          src={logoUrl}
          alt="Logo"
          style={{ width: 200, height: 200, objectFit: "contain", marginBottom: 20 }}
        />
        <h1 style={{ fontSize: 48, fontWeight: "bold", margin: "0 0 10px 0" }}>
          {company.name}
        </h1>
        {website && (
          <p style={{ fontSize: 28, margin: "0 0 10px 0" }}>{website}</p>
        )}
        <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
          {platformHandles.map((handle, i) => (
            <span key={i} style={{ fontSize: 22 }}>
              {handle}
            </span>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );

  // 4. Get the image buffer
  const imageBuffer = await imageResponse.arrayBuffer();

  // 5. Upload to Vercel Blob
  const blob = await utapi.uploadFiles(
    new File([imageBuffer], `special-dates-${companyId}.png`, {
      type: "image/png",
    })
  );

  if (!blob.data) {
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }

  const imageUrl = blob.data.ufsUrl || blob.data.url;

  // 6. Create permanent Media record
  const expiresAt = new Date("2099-01-01T00:00:00.000Z");
  const media = await prisma.media.create({
    data: {
      companyId,
      filename: `special-dates-${companyId}.png`,
      url: imageUrl,
      type: "IMAGE",
      mimeType: "image/png",
      size: blob.data.size,
      expiresAt,
      tags: ["special-dates", "permanent"],
      isUsed: false,
      autoSelect: false,
      priority: 10,
    },
  });

  // 7. Update config with generated media ID
  await prisma.companySpecialDatesConfig.update({
    where: { companyId },
    data: { generatedMediaId: media.id },
  });

  return NextResponse.json({ mediaId: media.id, url: imageUrl });
}