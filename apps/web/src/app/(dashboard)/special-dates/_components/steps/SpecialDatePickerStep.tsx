// apps/web/src/app/(dashboard)/special-dates/_components/steps/SpecialDatePickerStep.tsx

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpcomingHoliday } from "../types";

interface Props {
  allHolidays: UpcomingHoliday[];
  enabledCategories: string[];
  excludedHolidays: string[];
  selectedHoliday: UpcomingHoliday | null;
  onSelectHoliday: (h: UpcomingHoliday | null) => void;
  onToggleExclude: (holidayName: string) => void;
}

export default function SpecialDatePickerStep({
  allHolidays,
  enabledCategories,
  excludedHolidays,
  selectedHoliday,
  onSelectHoliday,
  onToggleExclude,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const filteredHolidays = useMemo(
    () =>
      allHolidays.filter((h) =>
        h.categories.some((c) => enabledCategories.includes(c))
      ),
    [allHolidays, enabledCategories]
  );

  const quickPicks = useMemo(
    () => filteredHolidays.filter((h) => h.major).slice(0, 3),
    [filteredHolidays]
  );

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, UpcomingHoliday[]> = {};
    for (const h of filteredHolidays) {
      const monthKey = h.date.split(" ").slice(1).join(" ");
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(h);
    }
    return groups;
  }, [filteredHolidays]);

  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Step 3: Which dates to feature?
        </h2>
      </div>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Toggle off any dates you do not want. Toggle back on to include them again.
      </p>

      {quickPicks.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-2">
            Quick picks: next major moments
          </p>
          <div className="flex flex-wrap gap-2">
            {quickPicks.map((h) => {
              const isExcluded = excludedHolidays.includes(h.name);
              const isSelected = selectedHoliday?.name === h.name;
              return (
                <button
                  key={h.name}
                  onClick={() => onSelectHoliday(isSelected ? null : h)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-2",
                    isSelected
                      ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : isExcluded
                      ? "border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-tertiary)] line-through"
                      : "border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  )}
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>{h.name}</span>
                  <span className="text-xs opacity-70">{h.date}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowAll(!showAll)}
        className="text-sm text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
      >
        {showAll ? "Hide" : "Show"} all upcoming dates
        <ChevronRight
          className={cn("h-4 w-4 transition-transform", showAll && "rotate-90")}
        />
      </button>

      {showAll && (
        <div className="mt-4 space-y-6 max-h-[500px] overflow-y-auto pr-2">
          {Object.entries(groupedByMonth).map(([month, items]) => (
            <div key={month}>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-2">
                {month}
              </p>
              <div className="space-y-1">
                {items.map((h) => {
                  const isExcluded = excludedHolidays.includes(h.name);
                  const isSelected = selectedHoliday?.name === h.name;
                  return (
                    <div
                      key={`${h.name}-${h.isoDate}`}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        isSelected ? "bg-brand-500/10" : "hover:bg-[var(--bg-secondary)]"
                      )}
                    >
                      <button
                        onClick={() => onToggleExclude(h.name)}
                        className="flex-shrink-0"
                        title={isExcluded ? "Include this date" : "Exclude this date"}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center",
                            !isExcluded
                              ? "bg-brand-500 border-brand-500"
                              : "border-[var(--border-default)]"
                          )}
                        >
                          {!isExcluded && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => onSelectHoliday(isSelected ? null : h)}
                        className="flex-1 text-left"
                      >
                        <span
                          className={cn(
                            "text-sm",
                            isExcluded
                              ? "text-[var(--text-tertiary)] line-through"
                              : "text-[var(--text-primary)]"
                          )}
                        >
                          {h.name}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] ml-2">
                          {h.date}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(groupedByMonth).length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)]">
              No dates match the selected filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}