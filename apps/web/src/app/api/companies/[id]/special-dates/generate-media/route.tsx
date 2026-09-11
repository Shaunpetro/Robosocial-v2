// apps/web/src/app/api/companies/[id]/special-dates/generate-media/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { checkCompanyAccess } from '@/lib/access';
import { prisma } from '@/lib/db';
import { renderBrandedImage } from '@/lib/templates/renderer';
import { getFontForHoliday } from '@/lib/templates/fonts';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export const runtime = 'nodejs';

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const access = await checkCompanyAccess(companyId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json().catch(() => ({}));
  const holidayName: string | undefined = body.holidayName;
  const holidayDate: string | undefined = body.holidayDate;
  const holidayMessage: string | undefined = body.holidayMessage;

  try {
    const config = await prisma.companySpecialDatesConfig.findUnique({
      where: { companyId },
      include: { logoMedia: true },
    });

    if (!config || !config.logoMedia) {
      return NextResponse.json({ error: 'Please upload a company logo first' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { platforms: { where: { isConnected: true } } },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const socialLinks = company.platforms.map(
      (p) => `${p.type}: @${p.username || p.name}`
    );

    // WhatsApp from socialLinks data if it was scraped
    const socialJson = (company.socialLinks as Record<string, string> | null) || {};
    const contactWhatsapp = socialJson.whatsapp
      ? socialJson.whatsapp.replace(/^https?:\/\/wa\.me\//, '')
      : null;

    const { fontData, fontName } = getFontForHoliday(holidayName);

    const imageBuffer = await renderBrandedImage({
      templateId: config.templateId || 'clean-corporate',
      companyName: company.name,
      logoUrl: config.logoMedia.url,
      logoHasTransparency: config.logoHasTransparency ?? true,
      website: company.website || '',
      socialLinks,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      contactWhatsapp,
      brandColors: (company.brandColors as Record<string, string>) || {},
      logoPosition: (config.logoPosition as 'top' | 'center' | 'bottom') || 'top',
      showWebsite: config.showWebsite,
      showHandles: config.showHandles,
      holidayName,
      holidayDate,
      holidayMessage,
      fontData,
      fontName,
    });

    const baseFilename = holidayName
      ? `special-dates-${slugify(holidayName)}-${companyId}.png`
      : `special-dates-base-${companyId}.png`;

    const fileEsque = new File([new Uint8Array(imageBuffer)], baseFilename, {
      type: 'image/png',
    });
    const uploadResult = await utapi.uploadFiles(fileEsque);
    if (!uploadResult.data) {
      return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }

    const imageUrl = uploadResult.data.ufsUrl || uploadResult.data.url;

    const tags = holidayName
      ? ['special-dates', 'holiday', `holiday:${slugify(holidayName)}`]
      : ['special-dates', 'base'];

    const existing = await prisma.media.findFirst({
      where: {
        companyId,
        tags: { has: holidayName ? `holiday:${slugify(holidayName)}` : 'base' },
      },
    });

    let mediaId: string;
    if (existing) {
      await prisma.media.update({
        where: { id: existing.id },
        data: {
          url: imageUrl,
          filename: baseFilename,
          mimeType: 'image/png',
          size: imageBuffer.length,
          tags,
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        },
      });
      mediaId = existing.id;
    } else {
      const media = await prisma.media.create({
        data: {
          companyId,
          filename: baseFilename,
          url: imageUrl,
          type: 'IMAGE',
          mimeType: 'image/png',
          size: imageBuffer.length,
          tags,
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        },
      });
      mediaId = media.id;
    }

    if (!holidayName) {
      await prisma.companySpecialDatesConfig.update({
        where: { companyId },
        data: { generatedMediaId: mediaId },
      });
    }

    return NextResponse.json({ mediaId, url: imageUrl, fontName, holidayName });
  } catch (error) {
    console.error('Media generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Media generation failed' },
      { status: 500 }
    );
  }
}