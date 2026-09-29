// apps/web/src/lib/app-promotion/fetch-items.ts
import { getCshadClient } from "./cshad-client";

export type PromoItemType = "NEWS" | "TENDER" | "JOB" | "BURSARY";

export interface NormalisedItem {
  externalId: string;
  externalType: PromoItemType;
  title: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  publishedAt: Date | null;
}

const ETENDERS_FALLBACK_URL =
  "https://www.etenders.gov.za/Home/opportunities?id=1";

const FETCH_LIMIT = 200;

function mapOpportunityCategory(
  cat: string | null | undefined
): PromoItemType | null {
  switch (cat) {
    case "tender":
      return "TENDER";
    case "job":
      return "JOB";
    case "bursary":
      return "BURSARY";
    default:
      return null;
  }
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Fetch recent news and opportunities from CSHAD and normalise into a single
 * shape. The CSHAD row UUID is used as the external identity because it is
 * the only column guaranteed non-null across both tables.
 *
 * No date filter at fetch time. Freshness is defined by Robosocial's own
 * `PromoSeenItem.firstSeenAt` — see `diff.ts`.
 */
export async function fetchRecentItems(): Promise<NormalisedItem[]> {
  const supabase = getCshadClient();
  const items: NormalisedItem[] = [];

  // --- News ---
  const { data: newsRows, error: newsError } = await supabase
    .from("news")
    .select("id, title, source, source_url, image_url, published_at")
    .order("published_at", { ascending: false })
    .limit(FETCH_LIMIT);

  if (newsError) {
    throw new Error(`CSHAD news fetch failed: ${newsError.message}`);
  }

  for (const row of newsRows ?? []) {
    if (!row?.id || !row?.title) continue;
    items.push({
      externalId: String(row.id),
      externalType: "NEWS",
      title: String(row.title),
      sourceUrl: cleanString(row.source_url),
      imageUrl: cleanString(row.image_url),
      sourceName: cleanString(row.source),
      publishedAt: row.published_at ? new Date(row.published_at) : null,
    });
  }

  // --- Opportunities ---
  const { data: oppRows, error: oppError } = await supabase
    .from("opportunities")
    .select("id, title, category, company_name, apply_url, closing_date")
    .in("category", ["tender", "job", "bursary"])
    .order("date_advertised", { ascending: false })
    .limit(FETCH_LIMIT);

  if (oppError) {
    throw new Error(`CSHAD opportunities fetch failed: ${oppError.message}`);
  }

  for (const row of oppRows ?? []) {
    if (!row?.id || !row?.title) continue;

    const type = mapOpportunityCategory(row.category);
    if (!type) continue;

    const rawApplyUrl = cleanString(row.apply_url);
    const sourceUrl =
      rawApplyUrl ?? (type === "TENDER" ? ETENDERS_FALLBACK_URL : null);

    items.push({
      externalId: String(row.id),
      externalType: type,
      title: String(row.title),
      sourceUrl,
      imageUrl: null,
      sourceName: cleanString(row.company_name),
      publishedAt: row.closing_date ? new Date(row.closing_date) : null,
    });
  }

  return items;
}