// apps/web/src/app/go/[id]/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const revalidate = 3600;

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=cshad.isentinel.news&hl=en";

const BRAND_FALLBACK_OG = "/og/app-promotion-fallback.png";

const TYPE_LABELS: Record<string, string> = {
  NEWS: "News",
  TENDER: "Tender",
  JOB: "Job",
  BURSARY: "Bursary",
};

const SOURCE_CTA_LABELS: Record<string, string> = {
  NEWS: "Read the full story",
  TENDER: "View the tender",
  JOB: "View the job",
  BURSARY: "View the bursary",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const item = await prisma.promoSeenItem.findUnique({ where: { id } });

  if (!item) {
    return { title: "Not found" };
  }

  const siteName = "CSHAD iSentinel";
  const description = item.sourceName
    ? `${item.title} — via ${item.sourceName}`
    : item.title;

  return {
    title: item.title,
    description,
    openGraph: {
      title: item.title,
      description,
      siteName,
      images: item.imageUrl ? [item.imageUrl] : [BRAND_FALLBACK_OG],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description,
      images: item.imageUrl ? [item.imageUrl] : [BRAND_FALLBACK_OG],
    },
  };
}

export default async function BridgePage({ params }: PageProps) {
  const { id } = await params;
  const item = await prisma.promoSeenItem.findUnique({ where: { id } });

  if (!item) notFound();

  const typeLabel = TYPE_LABELS[item.externalType] ?? item.externalType;
  const sourceCtaLabel =
    SOURCE_CTA_LABELS[item.externalType] ?? "View source";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl overflow-hidden shadow-xl">
        {item.imageUrl && (
          <div className="w-full aspect-[1200/630] bg-[var(--bg-tertiary)] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              {typeLabel}
            </span>
            {item.sourceName && (
              <>
                <span className="text-[var(--text-tertiary)]">&middot;</span>
                <span className="text-xs text-[var(--text-tertiary)] truncate max-w-[60%]">
                  {item.sourceName}
                </span>
              </>
            )}
          </div>

          <h1 className="text-xl font-semibold text-[var(--text-primary)] leading-snug">
            {item.title}
          </h1>

          <div className="space-y-2 pt-2">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Get the CSHAD iSentinel app
            </a>

            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium transition-colors"
              >
                {sourceCtaLabel}
              </a>
            )}
          </div>

          <p className="text-xs text-[var(--text-tertiary)] text-center pt-2">
            Robosocial does not own or endorse the content linked above.
          </p>
        </div>
      </div>
    </div>
  );
}