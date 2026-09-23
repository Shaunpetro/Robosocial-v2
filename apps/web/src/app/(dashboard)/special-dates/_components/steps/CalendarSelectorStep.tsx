// apps/web/src/app/(dashboard)/special-dates/_components/steps/CalendarSelectorStep.tsx

"use client";

import { CheckCircle2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HolidaySet } from "../types";

interface Props {
  availableSets: HolidaySet[];
  selectedSetIds: string[];
  onToggleSet: (setId: string) => void;
}

export default function CalendarSelectorStep({
  availableSets,
  selectedSetIds,
  onToggleSet,
}: Props) {
  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Step 1: Which calendars should we watch?
        </h2>
      </div>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Pick the holiday calendars that matter to your business and audience.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableSets.map((set) => (
          <button
            key={set.id}
            onClick={() => onToggleSet(set.id)}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
              selectedSetIds.includes(set.id)
                ? "border-brand-500 bg-brand-500/10"
                : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                selectedSetIds.includes(set.id)
                  ? "bg-brand-500 border-brand-500"
                  : "border-[var(--border-default)]"
              )}
            >
              {selectedSetIds.includes(set.id) && (
                <CheckCircle2 className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)]">{set.label}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{set.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}