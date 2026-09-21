// apps/web/src/lib/ai/dedication.ts
import Groq from 'groq-sdk';
import { prisma } from '@/lib/db';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface DedicationIntelligenceContext {
  brandVoice?: string | null;
  brandPersonality?: string[] | null;
  uniqueSellingPoints?: string[] | null;
  targetAudience?: string | null;
  communityFocus?: string | null;
  primaryBusinessGoal?: string | null;
  primaryKeywords?: string[] | null;
  defaultTone?: string | null;
}

export interface GenerateDedicationInput {
  companyId: string;
  companyName: string;
  industry?: string | null;
  companyDescription?: string | null;
  intelligence?: DedicationIntelligenceContext | null;
  holidayName: string;
  holidayDescription: string;
  holidayTone?: string;
  templateId?: string | null;
  templateMood?: string;
}

const FALLBACK_BY_TONE: Record<string, string[]> = {
  celebratory: [
    'Celebrating this moment with pride.',
    'Marking this special day together.',
    'Honouring this day with joy.',
    'Sharing the joy of this moment.',
  ],
  reflective: [
    'Taking a moment to reflect today.',
    'Honouring this day with gratitude.',
    'Pausing to remember what matters.',
    'Holding space for reflection today.',
  ],
  warm: [
    'Wishing you a warm and meaningful day.',
    'Sharing this moment with our community.',
    'Sending warmth and good wishes.',
    'Holding you close in our thoughts today.',
  ],
  educational: [
    'Raising awareness together today.',
    'Standing with the cause this day represents.',
    'Learning and growing with this community.',
    'Shining a light on what matters.',
  ],
  playful: [
    'Having fun together on this day.',
    'Enjoying this moment with you.',
    'Celebrating with a little extra sparkle.',
    'Bringing a smile to this special day.',
  ],
  inspirational: [
    'Inspired by the spirit of this day.',
    'Letting this day spark something bigger.',
    'Moving forward with purpose.',
    'Building something meaningful together.',
  ],
  appreciative: [
    'Thankful for everyone who makes this possible.',
    'Appreciating the people behind the work.',
    'Grateful for the hands that build this.',
    'Honouring the effort behind every step.',
  ],
};

function buildIntelligenceBlock(
  intel: DedicationIntelligenceContext | null | undefined
): string[] {
  if (!intel) return [];
  const lines: string[] = [];

  // Explicit voice wins
  if (intel.brandVoice && intel.brandVoice.trim().length > 0) {
    lines.push(`Speak in this brand voice: ${intel.brandVoice.trim()}`);
  } else if (intel.brandPersonality && intel.brandPersonality.length > 0) {
    // Synthesize a voice descriptor from personality traits
    lines.push(`Brand personality: ${intel.brandPersonality.join(', ')}`);
  }

  if (intel.targetAudience && intel.targetAudience.trim().length > 0) {
    lines.push(`Speaks to: ${intel.targetAudience.trim()}`);
  }

  if (intel.uniqueSellingPoints && intel.uniqueSellingPoints.length > 0) {
    const usps = intel.uniqueSellingPoints
      .filter((s) => s && s.trim().length > 0)
      .slice(0, 4);
    if (usps.length > 0) lines.push(`What makes them different: ${usps.join('; ')}`);
  }

  if (intel.communityFocus && intel.communityFocus.trim().length > 0) {
    lines.push(`Community role: ${intel.communityFocus.trim()}`);
  }

  if (intel.primaryBusinessGoal && intel.primaryBusinessGoal.trim().length > 0) {
    lines.push(`Purpose: ${intel.primaryBusinessGoal.trim()}`);
  }

  if (intel.primaryKeywords && intel.primaryKeywords.length > 0) {
    const kw = intel.primaryKeywords
      .filter((s) => s && s.trim().length > 0)
      .slice(0, 6);
    if (kw.length > 0) lines.push(`Themes to weave in naturally: ${kw.join(', ')}`);
  }

  return lines;
}

async function generateWithGroq(input: GenerateDedicationInput): Promise<string | null> {
  const tone = input.holidayTone || 'warm';
  const mood = input.templateMood || 'warm, grounded';

  // Context lines, only populated fields included
  const contextLines: string[] = [];

  if (input.industry && input.industry.trim().length > 0) {
    contextLines.push(`Industry: ${input.industry.trim()}`);
  }

  const intelLines = buildIntelligenceBlock(input.intelligence);
  contextLines.push(...intelLines);

  if (
    contextLines.length === 0 &&
    input.companyDescription &&
    input.companyDescription.trim().length > 0
  ) {
    // Fallback: raw description
    contextLines.push(`About the company: ${input.companyDescription.trim().slice(0, 240)}`);
  }

  const contextBlock = contextLines.length > 0 ? `\n${contextLines.join('\n')}\n` : '';

  const prompt = `Write one short dedication line for a social media post.

Company: ${input.companyName}${contextBlock}
Holiday: ${input.holidayName}
Description: ${input.holidayDescription}
Holiday tone: ${tone}
Visual style: ${mood}

Rules:
- One sentence only
- Maximum 90 characters
- No greetings, no emojis, no hashtags
- Reference the holiday theme
- If brand context is given above, let it shape the language naturally
- Match the energy of the visual style
- Avoid dry or generic phrasing; aim for a line that carries weight
- No em dashes

Return only the sentence, nothing else.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.95,
      max_tokens: 80,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const cleaned = raw
      .replace(/^["']|["']$/g, '')
      .replace(/[\u2014\u2013]/g, ',')
      .slice(0, 90);
    return cleaned.length > 0 ? cleaned : null;
  } catch (error) {
    console.error('Groq dedication failed:', error);
    return null;
  }
}

function pickFallback(tone?: string): string {
  const list = FALLBACK_BY_TONE[tone || 'warm'] || FALLBACK_BY_TONE.warm;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Returns a cached or freshly generated dedication for a company/holiday/template.
 * Cache invalidates when the template changes or after 90 days.
 */
export async function getDedicationForHoliday(
  input: GenerateDedicationInput
): Promise<string> {
  const existing = await prisma.holidayDedication.findUnique({
    where: {
      companyId_holidayName: {
        companyId: input.companyId,
        holidayName: input.holidayName,
      },
    },
  });

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const fresh = existing && existing.generatedAt > ninetyDaysAgo;
  const sameTemplate = existing?.templateId === (input.templateId || null);

  if (existing && fresh && sameTemplate) {
    return existing.text;
  }

  const generated = await generateWithGroq(input);
  const text = generated || pickFallback(input.holidayTone);

  if (existing) {
    await prisma.holidayDedication.update({
      where: { id: existing.id },
      data: {
        text,
        generatedAt: new Date(),
        templateId: input.templateId || null,
      },
    });
  } else {
    await prisma.holidayDedication.create({
      data: {
        companyId: input.companyId,
        holidayName: input.holidayName,
        templateId: input.templateId || null,
        text,
      },
    });
  }

  return text;
}