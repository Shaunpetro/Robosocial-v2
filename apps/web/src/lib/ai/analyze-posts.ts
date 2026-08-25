// apps/web/src/lib/ai/analyze-posts.ts
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export interface PlatformPost {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares?: number;
  impressions?: number;
}

export interface AggregatedInsights {
  bestDays: string[];
  bestTimes: string[];
  bestTopics: string[];
  bestHashtags: string[];
  topContentTypes: Record<string, number>;
  avgEngagementRate: number;
}

/**
 * Analyse a batch of platform posts using Groq to extract content type, topic, tone.
 * Then aggregate into insights suitable for CompanyIntelligence.
 */
export async function analysePlatformPosts(posts: PlatformPost[]): Promise<AggregatedInsights> {
  if (posts.length === 0) {
    return {
      bestDays: [],
      bestTimes: [],
      bestTopics: [],
      bestHashtags: [],
      topContentTypes: {},
      avgEngagementRate: 0,
    };
  }

  // Build compact prompt for classification
  const postsSummary = posts
    .slice(0, 30)
    .map((p) => `ID:${p.id}\nTEXT:${p.text.substring(0, 300)}\nLIKES:${p.likes}\nCOMMENTS:${p.comments}\nCREATED:${p.createdAt}`)
    .join("\n---\n");

  const prompt = `You are a social media analyst. Given these posts, classify each into content type, main topic, tone, and list hashtags. Then aggregate the best days, best times, best topics, best hashtags, and top content types based on engagement (likes+comments). Ignore posts with less than 5 likes and less than 5 comments as non-engaging. Return ONLY JSON with keys: bestDays (array), bestTimes (array of 24h times like "08:00"), bestTopics (array), bestHashtags (array), topContentTypes (object), avgEngagementRate (number).\n\n${postsSummary}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 500,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      bestDays: parsed.bestDays || [],
      bestTimes: parsed.bestTimes || [],
      bestTopics: parsed.bestTopics || [],
      bestHashtags: parsed.bestHashtags || [],
      topContentTypes: parsed.topContentTypes || {},
      avgEngagementRate: parsed.avgEngagementRate || 0,
    };
  } catch (error) {
    console.error("Failed to parse AI analysis:", error);
    return {
      bestDays: [],
      bestTimes: [],
      bestTopics: [],
      bestHashtags: [],
      topContentTypes: {},
      avgEngagementRate: 0,
    };
  }
}