// apps/web/src/app/(dashboard)/special-dates/_components/ScheduledSpecialDatesList.tsx

"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduledListTab, ScheduledSpecialDatePost } from "./types";

interface Props {
  posts: ScheduledSpecialDatePost[];
  loading: boolean;
  onPreview: (post: ScheduledSpecialDatePost) => void;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  SCHEDULED: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  PUBLISHED: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
  PUBLISHING: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  FAILED: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300",
};

export default function ScheduledSpecialDatesList({ posts, loading, onPreview }: Props) {
  const [tab, setTab] = useState<ScheduledListTab>("upcoming");

  const upcoming = posts.filter((p) => !p.isPast);
  const past = posts.filter((p) => p.isPast);

  const filtered =
    tab === "upcoming" ? upcoming : tab === "past" ? past : posts;

  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        Scheduled special dates
      </h2>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Every special date post that has been generated for this company.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {(
          [
            { id: "upcoming", label: "Upcoming", count: upcoming.length },
            { id: "past", label: "Past", count: past.length },
            { id: "all", label: "All", count: posts.length },
          ] as Array<{ id: ScheduledListTab; label: string; count: number }>
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              tab === t.id
                ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                : "border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
            )}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-[var(--text-tertiary)] py-4">
          {tab === "upcoming"
            ? "Nothing scheduled ahead. Use the schedulers above."
            : tab === "past"
            ? "No past special date posts yet."
            : "No special date posts yet."}
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const displayDate = p.scheduledFor
              ? new Date(p.scheduledFor).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "TBD";

            return (
              <li
                key={p.postId}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                onClick={() => onPreview(p)}
              >
                <div className="w-20 aspect-[1200/630] rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)] overflow-hidden flex items-center justify-center flex-shrink-0">
                  {p.mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.mediaUrl} alt={p.topic} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {p.topic}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                    {displayDate} · {p.platformLabel}
                  </p>
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wide rounded px-2 py-0.5",
                    STATUS_STYLES[p.status] || STATUS_STYLES.DRAFT
                  )}
                >
                  {p.status}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(p);
                  }}
                  title="Preview & edit"
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-brand-500 hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}