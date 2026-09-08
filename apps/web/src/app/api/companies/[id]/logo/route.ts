// apps/web/src/app/api/companies/[id]/logo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { checkCompanyAccess } from '@/lib/access';
import { prisma } from '@/lib/db';
import { processLogo } from '@/lib/logo-processing';
import { UTApi } from 'uploadthing/server';
import { clear } from 'console';

const utapi = new UTApi();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;
  const access = await checkCompanyAccess(companyId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPG, SVG' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let processed: { buffer: Buffer; hasTransparency: boolean; dominantColors: string[] };
  try {
    // For SVG, convert to PNG first because sharp can't process SVG without extra deps
    if (file.type === 'image/svg+xml') {
      const pngBuffer = await sharp(buffer).png().toBuffer();
      processed = await processLogo(pngBuffer, 'image/png');
    } else {
      processed = await processLogo(buffer, file.type);
    }
  } catch (error) {
    console.error('Logo processing failed:', error);
    return NextResponse.json({ error: 'Logo processing failed' }, { status: 500 });
  }

  // Upload processed logo to Uploadthing
  const filename = `logo-${companyId}.png`;
  const fileEsque = new File([new Uint8Array(processed.buffer)], filename, { type: 'image/png' });
  const uploadResult = await utapi.uploadFiles(fileEsque);
  if (!uploadResult.data) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const logoUrl = uploadResult.data.ufsUrl || uploadResult.data.url;

  // Create or update Media record
  const existingLogoMedia = await prisma.media.findFirst({
    where: { companyId, tags: { has: 'logo' } },
  });

  let mediaId: string;
  if (existingLogoMedia) {
    await prisma.media.update({
      where: { id: existingLogoMedia.id },
      data: {
        url: logoUrl,
        filename,
        mimeType: 'image/png',
        size: processed.buffer.length,
        tags: ['logo', 'permanent'],
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      },
    });
    mediaId = existingLogoMedia.id;
  } else {
    const media = await prisma.media.create({
      data: {
        companyId,
        filename,
        url: logoUrl,
        type: 'IMAGE',
        mimeType: 'image/png',
        size: processed.buffer.length,
        tags: ['logo', 'permanent'],
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      },
    });
    mediaId = media.id;
  }

  // Update special dates config with logo info
  await prisma.companySpecialDatesConfig.upsert({
    where: { companyId },
    update: {
      logoMediaId: mediaId,
      logoHasTransparency: processed.hasTransparency,
    },
    create: {
      companyId,
      logoMediaId: mediaId,
      logoHasTransparency: processed.hasTransparency,
    },
  });

  // Update company brand colors with extracted colors
  if (processed.dominantColors.length > 0) {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        brandColors: {
          primary: processed.dominantColors[0],
          secondary: processed.dominantColors[1] || processed.dominantColors[0],
          accent: processed.dominantColors[2] || processed.dominantColors[0],
        },
      },
    });
  }

  return NextResponse.json({
    mediaId,
    url: logoUrl,
    hasTransparency: processed.hasTransparency,
    dominantColors: processed.dominantColors,
  });
}