// apps/web/src/lib/app-promotion/fetch-items.ts
import { getCshadClient } from "./cshad-client";

export type PromoItemTypeString = "NEWS" | "TENDER" | "JOB" | "BURSARY";

export interface FetchedItem {
  externalId: string;
  externalType: PromoItemTypeString;
  title: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  publishedAt: Date | null;
}

const FETCH_LIMIT = 200;

const ETENDERS_FALLBACK_URL =
  "https://www.etenders.gov.za/Home/opportunities?id=1";

function mapOpportunityCategory(category: string): PromoItemTypeString | null {
  const lower = String(category || "").toLowerCase();
  if (lower === "tender") return "TENDER";
  if (lower === "job") return "JOB";
  if (lower === "bursary") return "BURSARY";
  return null;
}

function resolveSourceUrl(
  rawUrl: string | null | undefined,
  type: PromoItemTypeString
): string | null {
  if (rawUrl && rawUrl.trim() !== "") return rawUrl.trim();
  if (type === "TENDER") return ETENDERS_FALLBACK_URL;
  return null;
}

export async function fetchNews(): Promise<FetchedItem[]> {
  const { data, error } = await getCshadClient()
    .from("news")
    .select("id,title,source,source_url,image_url,published_at")
    .order("published_at", { ascending: false })
    .limit(FETCH_LIMIT);

  if (error) throw new Error(`Fetch news failed: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>): FetchedItem => ({
    externalId: String(row.id),
    externalType: "NEWS",
    title: String(row.title ?? ""),
    sourceUrl: resolveSourceUrl(row.source_url as string | null, "NEWS"),
    imageUrl: (row.image_url as string | null) ?? null,
    sourceName: (row.source as string | null) ?? null,
    publishedAt: row.published_at ? new Date(row.published_at as string) : null,
  }));
}

export async function fetchOpportunities(): Promise<FetchedItem[]> {
  const { data, error } = await getCshadClient()
    .from("opportunities")
    .select(
      "id,title,category,company_name,apply_url,date_advertised,created_at"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(FETCH_LIMIT);

  if (error) throw new Error(`Fetch opportunities failed: ${error.message}`);

  const items: FetchedItem[] = [];
  for (const row of data ?? []) {
    const type = mapOpportunityCategory(row.category as string);
    if (!type) continue;

    items.push({
      externalId: String(row.id),
      externalType: type,
      title: String(row.title ?? ""),
      sourceUrl: resolveSourceUrl(row.apply_url as string | null, type),
      imageUrl: null,
      sourceName: (row.company_name as string | null) ?? null,
      publishedAt: row.date_advertised
        ? new Date(row.date_advertised as string)
        : row.created_at
        ? new Date(row.created_at as string)
        : null,
    });
  }
  return items;
}

export async function fetchAll(): Promise<FetchedItem[]> {
  const [news, opps] = await Promise.all([fetchNews(), fetchOpportunities()]);
  return [...news, ...opps];
}