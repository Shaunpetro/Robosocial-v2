// apps/web/src/lib/ai/dedication.ts
import Groq from 'groq-sdk';
import { prisma } from '@/lib/db';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface GenerateDedicationInput {
  companyId: string;
  companyName: string;
  industry?: string | null;
  brandVoice?: string | null;
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

async function generateWithGroq(input: GenerateDedicationInput): Promise<string | null> {
  const tone = input.holidayTone || 'warm';
  const mood = input.templateMood || 'warm, grounded';
  const industryLine = input.industry ? `Industry: ${input.industry}.` : '';
  const voiceLine = input.brandVoice ? `Brand voice: ${input.brandVoice}.` : '';

  const prompt = `Write one short dedication line for a social media post.

Company: ${input.companyName}
${industryLine}
${voiceLine}
Holiday: ${input.holidayName}
Description: ${input.holidayDescription}
Holiday tone: ${tone}
Visual style: ${mood}

Rules:
- One sentence only
- Maximum 90 characters
- No greetings, no emojis, no hashtags
- Reference the holiday theme
- Feel personal to the industry if one is given
- Match the energy of the visual style above
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