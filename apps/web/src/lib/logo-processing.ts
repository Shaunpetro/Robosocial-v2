// apps/web/src/lib/logo-processing.ts
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal';
import { Vibrant } from 'node-vibrant/node';

export interface ProcessedLogo {
  buffer: Buffer;
  hasTransparency: boolean;
  dominantColors: string[];
}

export async function processLogo(fileBuffer: Buffer, contentType: string): Promise<ProcessedLogo> {
  let imageBuffer = fileBuffer;
  let hasTransparency = false;

  const metadata = await sharp(fileBuffer).metadata();
  const isPngWithAlpha = metadata.format === 'png' && metadata.hasAlpha;

  if (!isPngWithAlpha) {
    const blob = await removeBackground(fileBuffer);
    imageBuffer = Buffer.from(await blob.arrayBuffer());
    const newMetadata = await sharp(imageBuffer).metadata();
    hasTransparency = newMetadata.hasAlpha || false;
  } else {
    hasTransparency = true;
  }

  const palette = await Vibrant.from(imageBuffer).getPalette();
  const colors = [
    palette.Vibrant?.hex,
    palette.Muted?.hex,
    palette.DarkMuted?.hex,
  ].filter(Boolean) as string[];

  return {
    buffer: imageBuffer,
    hasTransparency,
    dominantColors: colors,
  };
}