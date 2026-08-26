// apps/web/src/lib/ai/competitor-insights.ts
import { prisma } from "@/lib/db";

/**
 * Fetches competitor data and returns a compact summary string
 * to inject into the generation prompt. Returns null if no competitors exist.
 */
export async function getCompetitorInsights(companyId: string): Promise<string | null> {
  try {
    const intel = await prisma.companyIntelligence.findUnique({
      where: { companyId },
      select: {
        competitors: {
          select: {
            name: true,
            topContentTypes: true,
            topHashtags: true,
            strengths: true,
          },
          take: 3,
        },
      },
    });

    if (!intel?.competitors?.length) return null;

    const lines = intel.competitors.map((c) => {
      const types = c.topContentTypes?.join(", ") || "general";
      const tags = c.topHashtags?.join(" ") || "";
      const strengths = c.strengths?.slice(0, 3).join(", ") || "";
      return `- ${c.name}: posts about ${types}, uses ${tags}. Strengths: ${strengths}.`;
    });

    return `**Competitor Landscape:**\n${lines.join("\n")}\nMake your post stand out from these patterns.`;
  } catch (error) {
    console.error("[CompetitorInsights] Failed to fetch competitor insights:", error);
    return null; // fail silently â€“ don't block generation
  }
}