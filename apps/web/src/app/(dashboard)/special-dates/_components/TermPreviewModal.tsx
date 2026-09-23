// apps/web/src/app/(dashboard)/special-dates/_components/TermPreviewModal.tsx

"use client";

import { AlertCircle, CalendarCheck, CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommitProgress, TermPlan } from "./types";

interface Props {
  isOpen: boolean;
  termPlan: TermPlan | null;
  loading: boolean;
  error: string | null;
  committing: boolean;
  commitProgress: CommitProgress[];
  onClose: () => void;
  onCommit: () => void;
}

export default function TermPreviewModal({
  isOpen,
  termPlan,
  loading,
  error,
  committing,
  commitProgress,
  onClose,
  onCommit,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-brand-500" />
            {termPlan ? `Schedule: ${termPlan.term.label}` : "Term Preview"}
          </h2>
          <button
            onClick={() => !committing && onClose()}
            disabled={committing}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {termPlan && !committing && commitProgress.length === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
                    Term dates
                  </p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(termPlan.term.effectiveStartIso).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" – "}
                    {new Date(termPlan.term.effectiveEndIso).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {termPlan.term.daysRemaining} days remaining
                    {termPlan.term.isMidTerm && " (mid-term setup — only remaining dates)"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
                    Total posts
                  </p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {termPlan.totalPosts} post{termPlan.totalPosts === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {termPlan.holidays.length} dates ×{" "}
                    {termPlan.platforms.filter((p) => p.compatible).length} platform
                    {termPlan.platforms.filter((p) => p.compatible).length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Special dates in this term ({termPlan.holidays.length})
                </p>
                {termPlan.holidays.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)]">
                    No special dates fall within this term.
                  </p>
                ) : (
                  <ul className="space-y-1 max-h-64 overflow-y-auto">
                    {termPlan.holidays.map((h) => (
                      <li
                        key={`${h.name}-${h.isoDate}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)] text-sm"
                      >
                        <span className="text-[var(--text-primary)]">{h.name}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {h.displayDate}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Target platforms
                </p>
                <ul className="space-y-1">
                  {termPlan.platforms.map((p) => (
                    <li
                      key={p.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg text-sm",
                        p.compatible
                          ? "bg-[var(--bg-secondary)]"
                          : "bg-[var(--bg-primary)] opacity-60"
                      )}
                    >
                      <span className="flex items-center gap-2 text-[var(--text-primary)]">
                        {p.compatible ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
                        )}
                        {p.label}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {p.compatible ? "Will receive posts" : p.skipReason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {!termPlan.canCommit && termPlan.blockReason && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {termPlan.blockReason}
                </div>
              )}

              {termPlan.alreadyScheduled && termPlan.canCommit && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  This term was already scheduled. Re-running will skip existing posts.
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  {termPlan.canCommit ? "Cancel" : "Close"}
                </button>
                <button
                  onClick={onCommit}
                  disabled={!termPlan.canCommit}
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Schedule {termPlan.totalPosts} post{termPlan.totalPosts === 1 ? "" : "s"}
                </button>
              </div>
            </>
          )}

          {committing && (
            <>
              <div className="mb-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Scheduling{" "}
                  {commitProgress.filter((p) => p.status !== "pending").length + 1} of{" "}
                  {commitProgress.length}...
                </p>
                <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 transition-all"
                    style={{
                      width: `${
                        (commitProgress.filter((p) => p.status !== "pending").length /
                          Math.max(commitProgress.length, 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {commitProgress.map((p, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-sm",
                      p.status === "pending" &&
                        "bg-[var(--bg-secondary)] border-[var(--border-default)]",
                      p.status === "success" &&
                        "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
                      p.status === "error" &&
                        "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                    )}
                  >
                    {p.status === "pending" && (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
                    )}
                    {p.status === "success" && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {p.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] font-medium">{p.holidayName}</p>
                      {p.status === "success" && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {p.postsCreated} post{p.postsCreated === 1 ? "" : "s"} created
                        </p>
                      )}
                      {p.status === "error" && p.errors.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {p.errors.map((e, ei) => (
                            <li key={ei} className="text-xs text-red-600 dark:text-red-400">
                              {e}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!committing && commitProgress.length > 0 && (
            <>
              <div className="mb-4 p-4 rounded-lg bg-[var(--bg-secondary)]">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Scheduling complete
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {commitProgress.filter((p) => p.status === "success").length} of{" "}
                  {commitProgress.length} processed successfully. Posts appear on the
                  calendar.
                </p>
              </div>
              <ul className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {commitProgress.map((p, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-sm",
                      p.status === "success" &&
                        "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
                      p.status === "error" &&
                        "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                    )}
                  >
                    {p.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] font-medium">{p.holidayName}</p>
                      {p.status === "success" && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {p.postsCreated} post{p.postsCreated === 1 ? "" : "s"} created
                        </p>
                      )}
                      {p.errors.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {p.errors.map((e, ei) => (
                            <li key={ei} className="text-xs text-red-600 dark:text-red-400">
                              {e}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}