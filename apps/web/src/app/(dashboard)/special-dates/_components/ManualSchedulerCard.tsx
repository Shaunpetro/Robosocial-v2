// apps/web/src/app/(dashboard)/special-dates/_components/ManualSchedulerCard.tsx

"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import type {
  ManualProgress,
  SchedulableHoliday,
  SchedulableHolidaysResponse,
} from "./types";

interface Props {
  schedulable: SchedulableHolidaysResponse | null;
  loading: boolean;
  error: string | null;
  manualProgress: Record<string, ManualProgress>;
  regeneratingPostIds: string[];
  hasLogo: boolean;
  onScheduleOne: (h: SchedulableHoliday) => void;
  onRegenerateMedia: (h: SchedulableHoliday) => void;
}

export default function ManualSchedulerCard({
  schedulable,
  loading,
  error,
  manualProgress,
  regeneratingPostIds,
  hasLogo,
  onScheduleOne,
  onRegenerateMedia,
}: Props) {
  if (!schedulable || !schedulable.window) return null;

  const targetsDisabled = !hasLogo || schedulable.compatiblePlatforms.length === 0;

  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
        <Send className="h-5 w-5" />
        Schedule individual special dates
      </h2>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Schedule one special date at a time within the current window — up to{" "}
        {schedulable.window.termLabel
          ? `the end of ${schedulable.window.termLabel}`
          : "the next term starts"}
        . Ideal when the term is almost over and there are just a few dates left.
      </p>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          Window:{" "}
          {new Date(schedulable.window.startIso).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
          })}
          {" – "}
          {new Date(schedulable.window.endIso).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span>
          {schedulable.window.daysRemaining} day
          {schedulable.window.daysRemaining === 1 ? "" : "s"} remaining
        </span>
        {schedulable.compatiblePlatforms.length > 0 && (
          <span>
            Targets: {schedulable.compatiblePlatforms.map((p) => p.label).join(", ")}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start gap-2 mb-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {!loading && schedulable.holidays.length === 0 && (
        <p className="text-sm text-[var(--text-tertiary)]">
          No special dates in the current window. Enable more calendars above or check
          excluded dates.
        </p>
      )}

      {!loading && schedulable.holidays.length > 0 && (
        <ul className="space-y-2">
          {schedulable.holidays.map((h) => {
            const key = h.isoDate + h.name;
            const progress = manualProgress[key];
            const scheduledPosts = h.scheduledPosts ?? [];
            const allScheduled =
              schedulable.compatiblePlatforms.length > 0 &&
              h.alreadyScheduledPlatforms.length >= schedulable.compatiblePlatforms.length;
            const anyRegenerating = scheduledPosts.some((sp) =>
              regeneratingPostIds.includes(sp.postId)
            );

            return (
              <li
                key={key}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{h.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {h.displayDate}
                    {h.alreadyScheduledPlatforms.length > 0 && (
                      <> · Scheduled on {h.alreadyScheduledPlatforms.join(", ")}</>
                    )}
                  </p>
                  {progress?.status === "error" && progress.errors.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {progress.errors.map((e, ei) => (
                        <li key={ei} className="text-xs text-red-600 dark:text-red-400">
                          {e}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {progress?.status === "pending" ? (
                  <span className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Scheduling...
                  </span>
                ) : progress?.status === "success" ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {progress.postsCreated} post
                    {progress.postsCreated === 1 ? "" : "s"} created
                  </span>
                ) : allScheduled ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Scheduled
                    </span>
                    {scheduledPosts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onRegenerateMedia(h)}
                        disabled={anyRegenerating}
                        title="Generate a new image for this post"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                      >
                        {anyRegenerating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5" />
                            New image
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onScheduleOne(h)}
                    disabled={targetsDisabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Schedule
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {targetsDisabled && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
          {!hasLogo
            ? "Upload a company logo first."
            : "Connect a compatible platform (LinkedIn, Facebook, or X) to schedule."}
        </p>
      )}
    </div>
  );
}