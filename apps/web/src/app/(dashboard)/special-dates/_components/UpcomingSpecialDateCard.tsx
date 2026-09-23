// apps/web/src/app/(dashboard)/special-dates/_components/UpcomingSpecialDateCard.tsx

"use client";

import { CalendarClock, Image as ImageIcon, Pencil } from "lucide-react";
import type { ScheduledSpecialDatePost } from "./types";

interface Props {
  post: ScheduledSpecialDatePost | null;
  onPreview: (post: ScheduledSpecialDatePost) => void;
}

export default function UpcomingSpecialDateCard({ post, onPreview }: Props) {
  if (!post) {
    return (
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-brand-500" />
          Next up
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Nothing scheduled yet. Use the schedulers below to plan your next special date.
        </p>
      </div>
    );
  }

  const displayDate = post.scheduledFor
    ? new Date(post.scheduledFor).toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date TBD";

  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-brand-500" />
          Next up
        </h2>
        <span className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
          {post.platformLabel} · {post.status}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-56 aspect-[1200/630] rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden flex items-center justify-center flex-shrink-0">
          {post.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt={post.topic}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-[var(--text-tertiary)]" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{post.topic}</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{displayDate}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-3">
              {post.content}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onPreview(post)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Preview & edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}