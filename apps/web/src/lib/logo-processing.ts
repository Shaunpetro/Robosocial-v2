// apps/web/src/lib/logo-processing.ts
import sharp from 'sharp';

export interface ProcessedLogo {
  buffer: Buffer;
  hasTransparency: boolean;
  dominantColors: string[];
}

/**
 * Processes an uploaded logo:
 *  - Detects PNG transparency
 *  - Optionally removes opaque backgrounds (only if ENABLE_BG_REMOVAL=true)
 *  - Extracts an average dominant color via sharp stats
 */
export async function processLogo(fileBuffer: Buffer): Promise<ProcessedLogo> {
  let imageBuffer = fileBuffer;
  let hasTransparency = false;

  const metadata = await sharp(fileBuffer).metadata();
  const isPngWithAlpha = metadata.format === 'png' && metadata.hasAlpha;

  if (isPngWithAlpha) {
    hasTransparency = true;
  } else if (process.env.ENABLE_BG_REMOVAL === 'true') {
    try {
      const { removeBackground } = await import('@imgly/background-removal-node');
      const inputBlob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/png' });
      const outputBlob = await removeBackground(inputBlob);
      imageBuffer = Buffer.from(await outputBlob.arrayBuffer());
      const newMetadata = await sharp(imageBuffer).metadata();
      hasTransparency = newMetadata.hasAlpha || false;
    } catch (error) {
      console.error('Background removal failed, using original image:', error);
    }
  }

  // Extract dominant color using sharp's channel statistics
  const dominantColors: string[] = [];
  try {
    const stats = await sharp(imageBuffer).stats();
    const channels = stats.channels.slice(0, 3);
    if (channels.length === 3) {
      const hex =
        '#' +
        channels
          .map((c) => Math.round(c.mean).toString(16).padStart(2, '0'))
          .join('');
      dominantColors.push(hex);
    }
  } catch (error) {
    console.error('Color extraction failed:', error);
  }

  return {
    buffer: imageBuffer,
    hasTransparency,
    dominantColors,
  };
}