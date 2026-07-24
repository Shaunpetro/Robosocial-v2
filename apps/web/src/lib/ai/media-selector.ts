// apps/web/src/lib/ai/media-selector.ts
import { selectMedia, markMediaAsUsed, type MediaSelectionResult } from "@/lib/media/auto-select";

export interface SelectedMedia {
  id: string;
  url: string;
  type: string;
  filename: string;
}

/**
 * Try to find and attach media to a generated post.
 * Returns null if no suitable media is found or media balance decides against it.
 */
export async function attachMediaToPost(
  companyId: string,
  contentType?: string,
  topic?: string,
  tags?: string[],
  pillarId?: string,
  forceInclude?: boolean
): Promise<SelectedMedia | null> {
  try {
    const result: MediaSelectionResult = await selectMedia({
      companyId,
      contentType,
      topic,
      tags,
      pillarId,
      forceInclude,
    });

    if (!result.includeMedia || !result.selectedMedia) return null;

    // Mark as used so it won't be reused immediately
    await markMediaAsUsed(result.selectedMedia.id);

    return {
      id: result.selectedMedia.id,
      url: result.selectedMedia.url,
      type: result.selectedMedia.type,
      filename: result.selectedMedia.filename,
    };
  } catch (error) {
    console.error("[MediaSelector] Failed to attach media:", error);
    return null; // non-critical – post can still be text‑only
  }
}