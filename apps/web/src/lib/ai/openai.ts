// apps/web/src/lib/ai/openai.ts
// Using Groq (free Llama 3.1 8B instant) with Performance Analytics + Content Strategy Integration
// Enhanced with South African social voice engine (Magesi FC style, Nando's cheek, local brevity)
// Now with competitor-aware generation, anti-repetition measures, and media attachment

import Groq from "groq-sdk";
import {
  getPerformanceInsights,
  formatInsightsForPrompt,
  type PerformanceInsights,
} from "./analytics-insights";
import { getCompetitorInsights } from "./competitor-insights";
import { attachMediaToPost } from "./media-selector";

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Platform-specific configurations (unchanged)
const platformConfigs = {
  linkedin: {
    maxLength: 3000,
    style: "professional and insightful",
    format:
      "Use line breaks for readability. Can include bullet points. End with a call-to-action or thought-provoking question.",
    hashtagCount: "3-5 relevant industry hashtags",
    audienceContext: "Professional network - decision makers, industry peers, potential clients/employers",
  },
  twitter: {
    maxLength: 280,
    style: "concise, punchy, and engaging",
    format:
      "Single impactful message. Can use thread format indication if needed. Keep it shareable.",
    hashtagCount: "1-2 hashtags maximum",
    audienceContext: "Fast-scrolling audience - grab attention immediately, be memorable",
  },
  facebook: {
    maxLength: 2000,
    style: "conversational and community-focused",
    format:
      "Friendly tone, can be longer form. Encourage comments and shares. Use emojis sparingly if appropriate.",
    hashtagCount: "2-3 hashtags",
    audienceContext: "Community-oriented - friends, family, local connections, brand followers",
  },
  instagram: {
    maxLength: 2200,
    style: "visual-first, lifestyle-oriented, authentic",
    format:
      "Caption that complements an image. Use line breaks, emojis encouraged. Hashtags at the end.",
    hashtagCount: "5-10 relevant hashtags",
    audienceContext: "Visual-first audience - lifestyle focused, discovery-oriented, younger demographic",
  },
  wordpress: {
    maxLength: 5000,
    style: "informative, SEO-friendly, authoritative",
    format:
      "Blog post structure with introduction, body paragraphs, and conclusion. Use headers (##) for sections. Include a meta description.",
    hashtagCount: "3-5 tags/categories",
    audienceContext: "Readers seeking in-depth information - longer attention span, searching for solutions",
  },
};

// Tone descriptions (unchanged)
const toneDescriptions: Record<string, string> = {
  professional: "formal, business-appropriate, credible, and expert",
  casual: "relaxed, approachable, friendly, and conversational",
  friendly: "warm, personable, inclusive, and engaging",
  authoritative: "confident, expert, thought-leader, and decisive",
  cheeky: "witty, irreverent, bold, playfully disrespectful â€“ like a Nando's billboard",
  banter: "casual roasting, friendly trash-talk, local street humour",
  "ultra-short": "punchy 1-3 line statement, no explanations, maximum impact per word â€“ Magesi FC match-day energy",
  local: "authentic South African voice, mixed language (Zulu, Sesotho, Setswana), township swag, relatable",
};

export interface GenerateContentParams {
  companyId?: string;
  companyName: string;
  companyDescription?: string;
  companyIndustry?: string;
  platform: "linkedin" | "twitter" | "facebook" | "instagram" | "wordpress";
  platformId?: string;
  topic?: string;
  tone?:
    | "professional"
    | "casual"
    | "friendly"
    | "authoritative"
    | "cheeky"
    | "banter"
    | "ultra-short"
    | "local";
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  useAnalytics?: boolean;
  contentTypeContext?: string;
  previousHooks?: string[];
  isBulkGeneration?: boolean;
  includeMedia?: boolean;
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: string;
  analyticsUsed?: boolean;
  insights?: PerformanceInsights;
  selectedMedia?: { id: string; url: string; type: string } | null;
}

export async function generateSocialContent(
  params: GenerateContentParams
): Promise<GeneratedContent> {
  const {
    companyId,
    companyName,
    companyDescription,
    companyIndustry,
    platform,
    platformId,
    topic,
    tone = "professional",
    includeHashtags = true,
    includeEmojis = false,
    useAnalytics = true,
    contentTypeContext,
    previousHooks,
    isBulkGeneration = false,
    includeMedia = false,
  } = params;

  const config = platformConfigs[platform];
  const toneDesc = toneDescriptions[tone];

  let competitorInsights = "";
  if (companyId) {
    try {
      const comp = await getCompetitorInsights(companyId);
      if (comp) competitorInsights = comp;
    } catch (e) {
      // non-critical, ignore
    }
  }

  let insights: PerformanceInsights | null = null;
  let insightsPrompt = "";

  if (useAnalytics && companyId) {
    try {
      insights = await getPerformanceInsights({
        companyId,
        platformId,
        platformType: platform.toUpperCase(),
        days: 90,
        minImpressions: 10,
      });

      insightsPrompt = formatInsightsForPrompt(insights, competitorInsights || undefined);
    } catch (error) {
      console.warn("Failed to fetch performance insights:", error);
    }
  } else if (competitorInsights) {
    insightsPrompt = competitorInsights;
  }

  const prompt = buildEnhancedPrompt({
    companyName,
    companyDescription,
    companyIndustry,
    platform,
    config,
    toneDesc,
    tone,
    topic,
    includeEmojis,
    includeHashtags,
    insightsPrompt,
    contentTypeContext,
    competitorInsights,
    previousHooks,
  });

  const temperature = isBulkGeneration ? 0.9 : (tone === "ultra-short" || tone === "cheeky" ? 0.85 : 0.75);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-oss-20b",
      temperature,
      max_tokens: tone === "ultra-short" ? 150 : 1024,
    });

    let content = chatCompletion.choices[0]?.message?.content?.trim() || "";
    content = cleanGeneratedContent(content);

    if (tone === "ultra-short") {
      content = enforceUltraShort(content);
    }

    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];

    let selectedMedia = null;
    if (includeMedia && companyId) {
      try {
        selectedMedia = await attachMediaToPost(
          companyId,
          contentTypeContext,
          topic,
          undefined,
          undefined,
          false
        );
      } catch (mediaError) {
        console.warn("Media selection failed, continuing without media:", mediaError);
      }
    }

    return {
      content,
      hashtags: hashtags.map((tag) => tag.replace("#", "")),
      characterCount: content.length,
      platform,
      analyticsUsed: insights?.hasData ?? false,
      insights: insights ?? undefined,
      selectedMedia,
    };
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error(
      `Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

function buildEnhancedPrompt(params: {
  companyName: string;
  companyDescription?: string;
  companyIndustry?: string;
  platform: string;
  config: typeof platformConfigs.linkedin;
  toneDesc: string;
  tone: string;
  topic?: string;
  includeEmojis: boolean;
  includeHashtags: boolean;
  insightsPrompt: string;
  contentTypeContext?: string;
  competitorInsights?: string;
  previousHooks?: string[];
}): string {
  const {
    companyName,
    companyDescription,
    companyIndustry,
    platform,
    config,
    toneDesc,
    tone,
    topic,
    includeEmojis,
    includeHashtags,
    insightsPrompt,
    contentTypeContext,
    competitorInsights,
    previousHooks,
  } = params;

  const effectiveMaxLength = tone === "ultra-short" ? 280 : config.maxLength;

  let prompt = `Generate a ${platform.toUpperCase()} post for:

**COMPANY:**
- Name: ${companyName}
- Industry: ${companyIndustry || "Not specified"}
- Description: ${companyDescription || "Not provided"}

**PLATFORM REQUIREMENTS:**
- Platform: ${platform.toUpperCase()}
- Maximum Length: ${effectiveMaxLength} characters
- Style: ${config.style}
- Tone: ${toneDesc}
- Format: ${config.format}
- Audience: ${config.audienceContext}
${topic ? `- Topic/Focus: ${topic}` : ""}
${includeEmojis ? "- Include relevant emojis to enhance engagement" : "- Minimal or no emojis"}
${includeHashtags ? `- Include ${config.hashtagCount} at the end` : "- Do not include hashtags"}
`;

  if (contentTypeContext) {
    prompt += `\n${contentTypeContext}\n`;
  }

  if (competitorInsights) {
    prompt += `\n${competitorInsights}\n`;
  }

  if (insightsPrompt) {
    prompt += `\n${insightsPrompt}\n`;
  }

  if (previousHooks && previousHooks.length > 0) {
    prompt += `\n**AVOID REPETITION:** You have already written posts with these hooks:\n`;
    previousHooks.forEach((hook, idx) => {
      prompt += `${idx + 1}. "${hook}"\n`;
    });
    prompt += `Make sure this post is completely different in topic, tone, and opening hook. Do not reuse any of those hooks.\n`;
  }

  if (tone === "ultra-short" || tone === "local") {
    prompt += `
**ULTRA-SHORT & LOCAL MODE (MAGESI FC STYLE):**
- Write a post that is **AT MOST 3 short lines**.
- Start with a strong hype line or local slang (e.g., "Eish, the boys...", "Sho, check...")
- If the topic is football/culture/sport, tap into township/fan energy.
- Mix languages naturally (Zulu, English, Sesotho, Afrikaans slang) where they feel authentic.
- No hashtags, no long explanations â€“ just raw, instant emotion.
- The post should feel like it was typed on a phone in the moment.
`;
  } else if (tone === "cheeky" || tone === "banter") {
    prompt += `
**CHEEKY/BANTER MODE (NANDO'S STYLE):**
- Use playful disrespect or a witty twist.
- Throw in a cultural zinger (a current meme reference, a hilarious truth about SA life).
- Keep it brief â€“ 1-4 lines maximum.
- Emojis allowed if they amplify the cheek (ðŸ”¥, ðŸ˜­, ðŸ’€).
- If it doesn't make you smile or say "yoh!", rewrite it.
`;
  }

  prompt += `
**CRITICAL INSTRUCTIONS:**
1. Write ONLY the post content - no explanations, no "Here's your post:", no meta commentary
2. Start with a STRONG HOOK - the first line must grab attention immediately
3. Make it sound natural and human, not AI-generated
4. Focus on providing value to the reader
5. Match the brand voice based on the company description
6. Keep within the character limit: ${effectiveMaxLength} characters
7. End with engagement driver (question, CTA, or thought-provoker) when appropriate
${contentTypeContext ? "8. FOLLOW THE CONTENT TYPE GUIDANCE ABOVE - this determines the PURPOSE of the post" : ""}
${insightsPrompt ? "9. LEARN FROM PERFORMANCE INSIGHTS - incorporate patterns from successful posts" : ""}
${tone === "ultra-short" ? "10. RUTHLESS BREVITY: If your draft is longer than 3 lines, cut it down to the absolute essence. Every word must fight for its place." : ""}

Generate the post now:`;

  return prompt;
}

function getSystemPrompt(): string {
  return `You are a South African social media creative director who has mastered the art of ultra-short, culturally loaded, thumb-stopping posts. You live for the raw, street-smart energy of Magesi Football Club and the fearless cheek of Nando's advertising.

Your core principles:
- **Brevity is power** â€“ if you can say it in one line, donâ€™t use two. Every word must earn its place.
- **Cultural fluency** â€“ you naturally weave in South African slang (e.g., "sho", "eish", "danko", "tl tl", "siyavaya", "yoh", "sharp", "now now") and local references (Braamfontein, Soweto, load shedding, Uber to Alex) without sounding forced.
- **Tone-switching** â€“ you can be cheeky like a Nando's billboard, hype like a Magesi match-day post, or warm like a spaza shop owner. You match the exact requested tone.
- **Platform awareness** â€“ you know what works on Facebook (raw, 1-3 lines, easy to share) vs. LinkedIn (still professional but now more human).
- **Never generic** â€“ no "Here at [Company] we believe...". You write as a real human posting from a phone.

When tones like 'cheeky', 'banter', 'ultra-short', or 'local' are requested, you MUST deliver a post that feels born on South African soil â€“ as if a super-creative friend from Joburg wrote it.

You output ONLY the final post text â€“ no meta commentary, no quotes, no "Here's your post".`;
}

function cleanGeneratedContent(content: string): string {
  return content
    .replace(/^(Here's|Here is|Sure,|Okay,|Certainly,|Of course,).*?:\s*/i, "")
    .replace(/^(Here's a|Here is a|I've created|I created).*?:\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .replace(/^(Post|Content|Caption|Tweet|Update):\s*/i, "")
    .replace(/\n\n(This post|I've|I hope|Let me know|Feel free)[\s\S]*$/i, "")
    .replace(/\n(Call|Contact) .* for (more|further) information\.?/gi, "");
}

function enforceUltraShort(content: string): string {
  const maxChars = 200;
  const sentences = content.match(/[^\.!\?]+[\.!\?]+/g);
  if (!sentences || sentences.length === 0) {
    return content.slice(0, maxChars).trim();
  }
  let result = "";
  for (const s of sentences) {
    if ((result + s).length <= maxChars) {
      result += s;
    } else {
      break;
    }
  }
  return result.trim() || content.slice(0, maxChars).trim();
}

export async function regenerateContent(
  originalContent: string,
  feedback: string,
  platform: string,
  companyId?: string,
  platformId?: string
): Promise<GeneratedContent> {
  const config =
    platformConfigs[platform as keyof typeof platformConfigs] ||
    platformConfigs.linkedin;

  let insights: PerformanceInsights | null = null;
  let insightsPrompt = "";

  if (companyId) {
    try {
      insights = await getPerformanceInsights({
        companyId,
        platformId,
        platformType: platform.toUpperCase(),
        days: 90,
        minImpressions: 10,
      });

      insightsPrompt = formatInsightsForPrompt(insights);
    } catch (error) {
      console.warn("Failed to fetch performance insights:", error);
    }
  }

  const prompt = `Improve the following ${platform.toUpperCase()} post based on the feedback provided.

**ORIGINAL POST:**
${originalContent}

**FEEDBACK/INSTRUCTIONS:**
${feedback}
${insightsPrompt}
**PLATFORM REQUIREMENTS:**
- Platform: ${platform.toUpperCase()}
- Maximum Length: ${config.maxLength} characters
- Style: ${config.style}

**INSTRUCTIONS:**
1. Write ONLY the improved post content - no explanations, no commentary
2. Apply the feedback while maintaining the core message
3. Keep the same general tone unless feedback says otherwise
4. Ensure strong hook at the beginning
5. Stay within character limits
${insights?.hasData ? "6. Apply insights from high-performing posts to maximize engagement" : ""}

Generate the improved post now:`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: prompt },
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.7,
      max_tokens: 1024,
    });

    let content = chatCompletion.choices[0]?.message?.content?.trim() || "";
    content = cleanGeneratedContent(content);

    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];

    return {
      content,
      hashtags: hashtags.map((tag) => tag.replace("#", "")),
      characterCount: content.length,
      platform,
      analyticsUsed: insights?.hasData ?? false,
      insights: insights ?? undefined,
    };
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error(
      `Failed to regenerate content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function validateContentLength(
  content: string,
  platform: keyof typeof platformConfigs
): { valid: boolean; message?: string } {
  const config = platformConfigs[platform];
  if (content.length > config.maxLength) {
    return {
      valid: false,
      message: `Content exceeds ${platform} limit of ${config.maxLength} characters (current: ${content.length})`,
    };
  }
  return { valid: true };
}

export async function generateSpecialDatePost(params: {
  companyId: string;
  companyName: string;
  companyIndustry?: string;
  platform: "linkedin" | "twitter" | "facebook" | "instagram" | "wordpress";
  platformId: string;
  dateName: string;
  dateDescription: string;
  hashtags: string[];
  tone?: string;
  contentTypeContext?: string;
}): Promise<GeneratedContent & { specialDateId: string }> {
  const {
    companyId,
    companyName,
    companyIndustry,
    platform,
    platformId,
    dateName,
    dateDescription,
    hashtags,
    tone = "professional",
    contentTypeContext,
  } = params;

  const specialPrompt = `
**SPECIAL DATE POST â€“ ${dateName}**
Date significance: ${dateDescription}
Hashtags to include: ${hashtags.join(', ')}
Tone: ${tone}

Create a post that acknowledges this day in a way that is authentic to ${companyName}.
- Connect the day's theme to the company's values or industry (${companyIndustry || 'general'}).
- Don't force a connection if it's not genuine; instead, share a thoughtful message.
- Use the suggested hashtags naturally within the post or at the end.
- Keep it appropriate for the ${platform} platform.

${contentTypeContext || ''}
`;

  const result = await generateSocialContent({
    companyId,
    companyName,
    companyDescription: `${companyName} â€“ ${companyIndustry || 'business'}`,
    companyIndustry,
    platform,
    platformId,
    topic: specialPrompt,
    tone: tone as any,
    includeHashtags: true,
    includeEmojis: platform === 'instagram' || platform === 'facebook',
    useAnalytics: false,
  });

  return {
    ...result,
    specialDateId: `special-date:${dateName}`,
  };
}

export { platformConfigs };