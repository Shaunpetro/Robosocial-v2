// apps/web/src/lib/ai/dedication.ts
import Groq from 'groq-sdk';
import { prisma } from '@/lib/db';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = 'openai/gpt-oss-20b';

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

export interface DedicationTrace {
  source: 'cache' | 'ai' | 'fallback';
  cacheHit: boolean;
  fresh: boolean;
  templateMatch: boolean;
  prompt: string | null;
  model: string;
  groqStatus: number | null;
  groqError: string | null;
  rawContent: string | null;
  rawLength: number;
  cleanedText: string | null;
  cleanedLength: number;
  finalText: string;
  envGroqKeyPresent: boolean;
  envGroqKeyLength: number;
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

  if (intel.brandVoice && intel.brandVoice.trim().length > 0) {
    lines.push(`Speak in this brand voice: ${intel.brandVoice.trim()}`);
  } else if (intel.brandPersonality && intel.brandPersonality.length > 0) {
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

interface GroqCallResult {
  prompt: string;
  generated: string | null;
  groqStatus: number | null;
  groqError: string | null;
  rawContent: string | null;
  rawLength: number;
  cleanedLength: number;
}

async function generateWithGroq(input: GenerateDedicationInput): Promise<GroqCallResult> {
  const tone = input.holidayTone || 'warm';
  const mood = input.templateMood || 'warm, grounded';

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
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.95,
      max_tokens: 80,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const cleaned = raw
      .replace(/^["']|["']$/g, '')
      .replace(/[\u2014\u2013]/g, ',')
      .slice(0, 90);

    console.log('[dedication] Groq success', {
      model: GROQ_MODEL,
      companyId: input.companyId,
      holidayName: input.holidayName,
      rawLength: raw.length,
      cleanedLength: cleaned.length,
      rawPreview: raw.slice(0, 120),
    });

    return {
      prompt,
      generated: cleaned.length > 0 ? cleaned : null,
      groqStatus: 200,
      groqError: null,
      rawContent: raw,
      rawLength: raw.length,
      cleanedLength: cleaned.length,
    };
  } catch (error) {
    const err = error as Record<string, unknown> & {
      status?: number;
      response?: { status?: number; data?: unknown };
      error?: { message?: string };
      message?: string;
    };

    const status =
      typeof err?.status === 'number'
        ? err.status
        : typeof err?.response?.status === 'number'
        ? err.response.status
        : null;

    const errorMessage =
      typeof err?.message === 'string'
        ? err.message
        : typeof err?.error?.message === 'string'
        ? err.error.message
        : String(error);

    const errorBody =
      typeof err?.response?.data !== 'undefined'
        ? JSON.stringify(err.response.data).slice(0, 500)
        : null;

    console.error('[dedication] Groq call failed', {
      model: GROQ_MODEL,
      companyId: input.companyId,
      holidayName: input.holidayName,
      status,
      message: errorMessage,
      body: errorBody,
    });

    return {
      prompt,
      generated: null,
      groqStatus: status,
      groqError: errorBody ? `${errorMessage} | body: ${errorBody}` : errorMessage,
      rawContent: null,
      rawLength: 0,
      cleanedLength: 0,
    };
  }
}

function pickFallback(tone?: string): string {
  const list = FALLBACK_BY_TONE[tone || 'warm'] || FALLBACK_BY_TONE.warm;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Trace-returning variant used by the diagnostic endpoint. Normal callers
 * should use `getDedicationForHoliday`, which returns just the string.
 */
export async function getDedicationForHolidayWithTrace(
  input: GenerateDedicationInput
): Promise<{ text: string; trace: DedicationTrace }> {
  const trace: DedicationTrace = {
    source: 'fallback',
    cacheHit: false,
    fresh: false,
    templateMatch: false,
    prompt: null,
    model: GROQ_MODEL,
    groqStatus: null,
    groqError: null,
    rawContent: null,
    rawLength: 0,
    cleanedText: null,
    cleanedLength: 0,
    finalText: '',
    envGroqKeyPresent: !!process.env.GROQ_API_KEY,
    envGroqKeyLength: process.env.GROQ_API_KEY?.length || 0,
  };

  const existing = await prisma.holidayDedication.findUnique({
    where: {
      companyId_holidayName: {
        companyId: input.companyId,
        holidayName: input.holidayName,
      },
    },
  });

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const fresh = !!(existing && existing.generatedAt > ninetyDaysAgo);
  const sameTemplate = existing?.templateId === (input.templateId || null);

  trace.fresh = fresh;
  trace.templateMatch = sameTemplate;

  if (existing && fresh && sameTemplate) {
    trace.source = 'cache';
    trace.cacheHit = true;
    trace.finalText = existing.text;

    console.log('[dedication] cache hit', {
      companyId: input.companyId,
      holidayName: input.holidayName,
      templateId: input.templateId,
      text: existing.text,
    });

    return { text: existing.text, trace };
  }

  console.log('[dedication] cache miss, calling Groq', {
    companyId: input.companyId,
    holidayName: input.holidayName,
    templateId: input.templateId,
    hadExisting: !!existing,
    fresh,
    sameTemplate,
    envGroqKeyPresent: trace.envGroqKeyPresent,
    envGroqKeyLength: trace.envGroqKeyLength,
  });

  const groqResult = await generateWithGroq(input);

  trace.prompt = groqResult.prompt;
  trace.groqStatus = groqResult.groqStatus;
  trace.groqError = groqResult.groqError;
  trace.rawContent = groqResult.rawContent;
  trace.rawLength = groqResult.rawLength;
  trace.cleanedLength = groqResult.cleanedLength;
  trace.cleanedText = groqResult.generated;

  let finalText: string;
  if (groqResult.generated) {
    trace.source = 'ai';
    finalText = groqResult.generated;
  } else {
    trace.source = 'fallback';
    finalText = pickFallback(input.holidayTone);
    console.warn('[dedication] Groq returned nothing, using fallback', {
      companyId: input.companyId,
      holidayName: input.holidayName,
      groqStatus: groqResult.groqStatus,
      groqError: groqResult.groqError,
      fallback: finalText,
    });
  }

  trace.finalText = finalText;

  if (existing) {
    await prisma.holidayDedication.update({
      where: { id: existing.id },
      data: {
        text: finalText,
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
        text: finalText,
      },
    });
  }

  return { text: finalText, trace };
}

/**
 * Returns a cached or freshly generated dedication for a company/holiday/template.
 * Cache invalidates when the template changes or after 90 days.
 */
export async function getDedicationForHoliday(
  input: GenerateDedicationInput
): Promise<string> {
  const { text } = await getDedicationForHolidayWithTrace(input);
  return text;
}