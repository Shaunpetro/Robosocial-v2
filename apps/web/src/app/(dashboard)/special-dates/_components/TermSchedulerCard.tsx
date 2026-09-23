// apps/web/src/app/(dashboard)/special-dates/_components/TermSchedulerCard.tsx

"use client";

import { AlertCircle, CalendarCheck, CheckCircle2 } from "lucide-react";

interface Props {
  disabled: boolean;
  disabledReason: string | null;
  alreadyScheduled: boolean;
  onOpenPreview: () => void;
}

export default function TermSchedulerCard({
  disabled,
  disabledReason,
  alreadyScheduled,
  onOpenPreview,
}: Props) {
  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5" />
        Schedule the full term
      </h2>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Generate branded posts and images for every special date in the current school
        term. Best used near the start of a term, so the whole term is planned
        ahead. Each post is scheduled for 08:00 on the special date.
      </p>

      {alreadyScheduled && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Term already scheduled. Re-running will skip existing posts.
        </div>
      )}

      <button
        onClick={onOpenPreview}
        disabled={disabled}
        className="flex items-center gap-2 px-5 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
      >
        <CalendarCheck className="h-5 w-5" />
        Preview full term
      </button>

      {disabled && disabledReason && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {disabledReason}
        </p>
      )}
    </div>
  );
}