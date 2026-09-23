// apps/web/src/app/(dashboard)/special-dates/_components/steps/CategoryFilterStep.tsx

"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "../constants";

interface Props {
  enabledCategories: string[];
  onToggleCategory: (catId: string) => void;
}

export default function CategoryFilterStep({ enabledCategories, onToggleCategory }: Props) {
  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Star className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Step 2: What kinds of days?
        </h2>
      </div>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Filter the kinds of days you want to appear in your picker below.
      </p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onToggleCategory(cat.id)}
            title={cat.description}
            className={cn(
              "px-3 py-2 rounded-lg border text-sm transition-all",
              enabledCategories.includes(cat.id)
                ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                : "border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}