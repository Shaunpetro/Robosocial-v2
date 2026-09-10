// apps/web/src/lib/logo-processing.ts
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';
import * as VibrantModule from 'node-vibrant';

const Vibrant = (VibrantModule as any).Vibrant || (VibrantModule as any).default;

export interface ProcessedLogo {
  buffer: Buffer;
  hasTransparency: boolean;
  dominantColors: string[];
}

export async function processLogo(fileBuffer: Buffer): Promise<ProcessedLogo> {
  let imageBuffer = fileBuffer;
  let hasTransparency = false;

  const metadata = await sharp(fileBuffer).metadata();
  const isPngWithAlpha = metadata.format === 'png' && metadata.hasAlpha;

  if (!isPngWithAlpha) {
    const inputBlob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/png' });
    const outputBlob = await removeBackground(inputBlob);
    imageBuffer = Buffer.from(await outputBlob.arrayBuffer());
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