// apps/web/src/app/api/companies/[id]/special-dates/generate-media/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UTApi } from "uploadthing/server";
import { renderBrandedImage, type SocialItem } from "@/lib/templates/renderer";
import { getFontForHoliday, getInterFont } from "@/lib/templates/fonts";
import { getDedicationForHoliday } from "@/lib/ai/dedication";
import { getTemplateMood } from "@/lib/templates/colors";
import { getHolidayBackground } from "@/lib/templates/holiday-backgrounds";

const utapi = new UTApi();

export const runtime = "nodejs";

interface GenerateMediaBody {
  holidayName?: string;
  holidayDate?: string;
  holidayMessage?: string;
  holidayDescription?: string;
  holidayTone?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body: GenerateMediaBody = await request.json().catch(() => ({}));

    const {
      holidayName,
      holidayDate,
      holidayMessage,
      holidayDescription,
      holidayTone,
    } = body;

    const config = await prisma.companySpecialDatesConfig.findUnique({
      where: { companyId },
      include: { logoMedia: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Special dates not configured for this company" },
        { status: 400 }
      );
    }
    if (!config.enabled) {
      return NextResponse.json(
        { error: "Special dates feature not enabled" },
        { status: 400 }
      );
    }
    if (!config.logoMedia) {
      return NextResponse.json(
        { error: "Please upload a company logo first" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        platforms: {
          where: { isConnected: true },
        },
        intelligence: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const socialItems: SocialItem[] = [];
    const handles = (company.socialHandles as Record<string, string> | null) || {};

    for (const [platform, handle] of Object.entries(handles)) {
      if (!handle) continue;
      socialItems.push({
        platform: platform.toLowerCase(),
        handle: `@${String(handle).replace(/^@/, "")}`,
      });
    }

    if (socialItems.length === 0) {
      for (const p of company.platforms) {
        const handle = p.username || p.name;
        if (!handle) continue;
        socialItems.push({
          platform: p.type.toLowerCase(),
          handle: `@${handle.replace(/^@/, "")}`,
        });
      }
    }

    let dedication: string | null = null;
    if (config.dedication && config.dedication.trim().length > 0) {
      dedication = config.dedication.trim();
    } else if (holidayName && holidayDescription) {
      const intel = company.intelligence;
      try {
        dedication = await getDedicationForHoliday({
          companyId,
          companyName: company.name,
          industry: company.industry,
          companyDescription: company.description,
          intelligence: intel
            ? {
                brandVoice: intel.brandVoice,
                brandPersonality: intel.brandPersonality,
                uniqueSellingPoints: intel.uniqueSellingPoints,
                targetAudience: intel.targetAudience,
                communityFocus: intel.communityFocus,
                primaryBusinessGoal: intel.primaryBusinessGoal,
                primaryKeywords: intel.primaryKeywords,
                defaultTone: intel.defaultTone,
              }
            : null,
          holidayName,
          holidayDescription,
          holidayTone,
          templateId: config.templateId,
          templateMood: getTemplateMood(config.templateId),
        });
      } catch (err) {
        console.error("Dedication generation failed, continuing without:", err);
        dedication = null;
      }
    }

    let backgroundImageUrl: string | null = null;
    if (config.useStockBackgrounds && holidayName) {
      try {
        backgroundImageUrl = await getHolidayBackground(holidayName, companyId);
      } catch (err) {
        console.error("Stock background fetch failed, continuing without:", err);
        backgroundImageUrl = null;
      }
    }

    const baseFontData = getInterFont();
    const { fontData: holidayFontData, fontName: holidayFontName } =
      getFontForHoliday(holidayName);

    const base64 = await renderBrandedImage({
      templateId: config.templateId || "clean-corporate",
      compositionId: config.compositionId,
      companyName: company.name,
      logoUrl: config.logoMedia.url,
      logoHasTransparency: config.logoHasTransparency,
      tagline: config.tagline,
      dedication,
      website: company.website || undefined,
      socialItems,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      contactWhatsapp: company.contactWhatsapp,
      brandColors:
        (company.brandColors as Record<string, string> | null) || undefined,
      logoPosition: (config.logoPosition as "top" | "center" | "bottom") || "top",
      showWebsite: config.showWebsite,
      showHandles: config.showHandles,
      holidayName,
      holidayDate,
      holidayMessage,
      companyId,
      backgroundImageUrl,
      baseFontData,
      holidayFontData,
      holidayFontName,
    });

    const imageBuffer = Buffer.from(base64, "base64");

    const slug = holidayName
      ? holidayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : "base";
    const safeName = `special-dates-${companyId}-${slug}.png`;

    const blob = await utapi.uploadFiles(
      new File([imageBuffer], safeName, { type: "image/png" })
    );

    if (!blob.data) {
      return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
    }

    const imageUrl = blob.data.ufsUrl || blob.data.url;

    const expiresAt = new Date("2099-01-01T00:00:00.000Z");
    const tags = ["special-dates", "permanent"];
    if (holidayName) tags.push(`holiday:${holidayName}`);
    if (backgroundImageUrl) tags.push("stock-background");
    if (config.compositionId) tags.push(`composition:${config.compositionId}`);

    const media = await prisma.media.create({
      data: {
        companyId,
        filename: safeName,
        url: imageUrl,
        type: "IMAGE",
        mimeType: "image/png",
        size: blob.data.size,
        expiresAt,
        tags,
        isUsed: false,
        autoSelect: false,
        priority: 10,
      },
    });

    if (!holidayName) {
      await prisma.companySpecialDatesConfig.update({
        where: { companyId },
        data: { generatedMediaId: media.id },
      });
    }

    return NextResponse.json({ mediaId: media.id, url: imageUrl });
  } catch (error) {
    console.error("Special dates media generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Media generation failed",
      },
      { status: 500 }
    );
  }
}