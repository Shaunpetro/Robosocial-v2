// apps/web/src/lib/logo-processing.ts
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal';
import * as VibrantModule from 'node-vibrant';

// node-vibrant v4 may not expose named export properly; use fallback
const Vibrant = (VibrantModule as any).Vibrant || (VibrantModule as any).default;

export interface ProcessedLogo {
  buffer: Buffer;
  hasTransparency: boolean;
  dominantColors: string[];
}

export async function processLogo(fileBuffer: Buffer, contentType: string): Promise<ProcessedLogo> {
  let imageBuffer = fileBuffer;
  let hasTransparency = false;

  // Analyze original image
  const metadata = await sharp(fileBuffer).metadata();
  const isPngWithAlpha = metadata.format === 'png' && metadata.hasAlpha;

  if (!isPngWithAlpha) {
    // Remove background using imgly
    const blob = await removeBackground(fileBuffer);
    imageBuffer = Buffer.from(await blob.arrayBuffer());
    const newMetadata = await sharp(imageBuffer).metadata();
    hasTransparency = newMetadata.hasAlpha || false;
  } else {
    hasTransparency = true;
  }

  // Extract dominant colors using node-vibrant
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