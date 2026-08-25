// apps/web/src/lib/ai/media-analysis.ts
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export interface AutoTagsResult {
  tags: string[];
  altText: string;
  contentType: string;
}

/**
 * Analyse an uploaded media file and return suggested tags,
 * alt‑text, and a general content type.
 */
export async function analyseMedia(
  filename: string,
  mimeType: string,
  companyName: string,
  companyIndustry?: string,
  additionalContext?: string
): Promise<AutoTagsResult> {
  const prompt = `You are a social media asset analyst. For the uploaded file:
- Filename: ${filename}
- MIME type: ${mimeType}
- Company: ${companyName}${companyIndustry ? ` (${companyIndustry})` : ""}
${additionalContext ? `- Additional context: ${additionalContext}` : ""}

Provide a JSON object with:
- "tags": an array of 3‑8 relevant lowercase hashtag‑style tags (without #).
- "altText": a short, descriptive alt‑text for accessibility and SEO (max 125 characters).
- "contentType": one of "educational", "promotional", "behindTheScenes", "testimonial", "engagement", "socialProof", "tips", "news", "motivational", "community".

Return ONLY valid JSON, no markdown code fences. Example:
{"tags":["socialmedia","branding"],"altText":"Photo of a laptop with social media dashboard","contentType":"educational"}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    // Remove possible code fences
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      altText: typeof parsed.altText === "string" ? parsed.altText.substring(0, 125) : "",
      contentType: typeof parsed.contentType === "string" ? parsed.contentType : "educational",
    };
  } catch (error) {
    console.error("Media analysis AI error:", error);
    // Fallback: use filename as alt‑text and empty tags
    return {
      tags: [],
      altText: filename.replace(/\.[^/.]+$/, ""),
      contentType: "educational",
    };
  }
}

export interface MediaHealthReport {
  companyId: string;
  companyName: string;
  totalMedia: number;
  unusedMedia: number;
  expiringSoon: number;
  recommendations: string[];
  suggestedTypes: string[];
}

/**
 * Generate a health report for a company's media library.
 * Returns actionable insights and recommended content types.
 */
export async function generateMediaHealthReport(
  companyName: string,
  companyIndustry: string | undefined,
  totalMedia: number,
  unusedCount: number,
  expiringCount: number,
  recentTags: string[]
): Promise<Pick<MediaHealthReport, "recommendations" | "suggestedTypes">> {
  const prompt = `You are a content strategist reviewing a social media asset library.
Company: ${companyName}${companyIndustry ? ` (${companyIndustry})` : ""}
- Total media files: ${totalMedia}
- Unused / not attached to posts: ${unusedCount}
- Expiring within 7 days: ${expiringCount}
- Recent tag examples: ${recentTags.join(", ") || "none"}

Provide a short JSON object with:
- "recommendations": array of 2‑4 concise, actionable pieces of advice (e.g., "Add more testimonial-style images", "Create short product demo videos").
- "suggestedTypes": array of 2‑4 content types to focus on next (from: educational, promotional, behindTheScenes, testimonial, engagement, socialProof, tips, news, motivational, community).

Return ONLY valid JSON, no markdown fences. Example:
{"recommendations":["Increase behind-the-scenes photos","Create carousel posts"],"suggestedTypes":["behindTheScenes","educational"]}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 200,
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      suggestedTypes: Array.isArray(parsed.suggestedTypes) ? parsed.suggestedTypes : [],
    };
  } catch (error) {
    console.error("Media health report AI error:", error);
    return { recommendations: [], suggestedTypes: [] };
  }
}