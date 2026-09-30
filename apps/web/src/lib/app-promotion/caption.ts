// apps/web/src/lib/app-promotion/caption.ts

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=cshad.isentinel.news&hl=en";

export interface CaptionItem {
  id: string;
  externalType: string;
  title: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  publishedAt: Date | null;
}

export interface CaptionInput {
  item: CaptionItem;
  bridgeUrl: string;
}

/**
 * Facebook collapses single newlines into spaces. Paragraphs therefore
 * need double newlines (\n\n) to render as separate blocks.
 */
const P = "\n\n";

const TYPE_LABEL: Record<string, string> = {
  NEWS: "NEWS",
  TENDER: "TENDER",
  JOB: "JOB",
  BURSARY: "BURSARY",
};

const MARKETING_LINE: Record<string, string> = {
  NEWS:
    "Read the full story in the CSHAD iSentinel app. Daily news, jobs, bursaries, and tenders — all in one free app.",
  TENDER:
    "Read the full tender in the CSHAD iSentinel app. Daily news, jobs, bursaries, and tenders — all in one free app.",
  JOB:
    "Read the full job in the CSHAD iSentinel app. Daily news, jobs, bursaries, and tenders — all in one free app.",
  BURSARY:
    "Read the full bursary in the CSHAD iSentinel app. Daily news, jobs, bursaries, and tenders — all in one free app.",
};

/**
 * Truncate a title and append an ellipsis if it exceeds `max` characters.
 */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trimEnd() + "...";
}

function formatClosingDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

/**
 * Build the Facebook caption for a single promo item.
 *
 * Layout:
 *   1. TYPE | SOURCE (and Closing date for opportunities)
 *   2. Title, truncated to 220 chars with an ellipsis if needed
 *   3. Marketing line — one sentence naming the app and its benefit
 *   4. Play Store call to action and link
 *
 * The Play Store URL is the only link in the caption. It renders as the
 * Facebook preview card.
 */
export function buildCaption({ item }: CaptionInput): string {
  const type = item.externalType;
  const label = TYPE_LABEL[type] ?? type;
  const marketing = MARKETING_LINE[type] ?? MARKETING_LINE.NEWS;

  const title = truncate(item.title, 220);

  const headerParts: string[] = [label];

  if (item.sourceName) headerParts.push(item.sourceName);

  if (type !== "NEWS") {
    const closing = formatClosingDate(item.publishedAt);
    if (closing) headerParts.push(`Closing ${closing}`);
  }

  const header = headerParts.join(" | ");

  return [
    header,
    title,
    marketing,
    "Get it free on Google Play:",
    PLAY_STORE_URL,
  ].join(P);
}

export function buildBridgeUrl(baseUrl: string, itemId: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}/go/${itemId}`;
}

export function getPlayStoreUrl(): string {
  return PLAY_STORE_URL;
}