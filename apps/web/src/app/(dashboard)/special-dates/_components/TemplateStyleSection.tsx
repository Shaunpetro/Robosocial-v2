// apps/web/src/app/(dashboard)/special-dates/_components/TemplateStyleSection.tsx

"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPOSITIONS } from "@/lib/templates/compositions";
import { LOGO_POSITIONS, TEMPLATES } from "./constants";
import type { Config } from "./types";

interface Props {
  templateId: string | null;
  compositionId: string | null;
  logoPosition: "top" | "center" | "bottom";
  showWebsite: boolean;
  showHandles: boolean;
  useStockBackgrounds: boolean;
  onUpdate: (updates: Partial<Config>) => void;
}

export default function TemplateStyleSection({
  templateId,
  compositionId,
  logoPosition,
  showWebsite,
  showHandles,
  useStockBackgrounds,
  onUpdate,
}: Props) {
  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Template Style
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onUpdate({ templateId: tpl.id })}
            className={cn(
              "p-2 rounded-xl border text-left transition-all",
              templateId === tpl.id
                ? "border-brand-500 bg-brand-500/10"
                : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
            )}
          >
            <div className={cn("w-full h-14 rounded-md mb-2", tpl.bg)} />
            <p className="text-xs font-medium text-[var(--text-primary)]">{tpl.label}</p>
          </button>
        ))}
      </div>

      <div className="mb-6 pt-4 border-t border-[var(--border-subtle)]">
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Composition layout
        </label>
        <p className="text-xs text-[var(--text-tertiary)] mb-3">
          8 layouts combine with 8 templates for 64 possible looks. Auto uses the built-in Full Hero.
        </p>
        <div className="relative">
          <select
            value={compositionId ?? ""}
            onChange={(e) => onUpdate({ compositionId: e.target.value || null })}
            className="w-full appearance-none px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
          >
            <option value="">Auto (Full Hero)</option>
            {COMPOSITIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)] pointer-events-none" />
        </div>
        {compositionId && (
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            {COMPOSITIONS.find((c) => c.id === compositionId)?.description}
          </p>
        )}
      </div>

      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Logo position</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {LOGO_POSITIONS.map((pos) => (
          <button
            key={pos.id}
            onClick={() => onUpdate({ logoPosition: pos.id })}
            className={cn(
              "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
              logoPosition === pos.id
                ? "border-brand-500 bg-brand-500/10"
                : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
            )}
          >
            {pos.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--text-tertiary)] mb-4">
        Honoured by Full Hero and Vignette. Other compositions use fixed layouts.
      </p>

      <div className="flex flex-wrap gap-4 text-sm mb-3">
        <label className="flex items-center gap-2 text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={showWebsite}
            onChange={(e) => onUpdate({ showWebsite: e.target.checked })}
          />
          Show website
        </label>
        <label className="flex items-center gap-2 text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={showHandles}
            onChange={(e) => onUpdate({ showHandles: e.target.checked })}
          />
          Show social handles
        </label>
      </div>

      <div className="flex flex-wrap gap-4 text-sm pt-3 border-t border-[var(--border-subtle)]">
        <label className="flex items-center gap-2 text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={useStockBackgrounds}
            onChange={(e) => onUpdate({ useStockBackgrounds: e.target.checked })}
          />
          Use stock photo backgrounds for holidays
        </label>
      </div>
      <p className="text-xs text-[var(--text-tertiary)] mt-2">
        Pexels photos appear behind the branded overlay. Only applies when a date is selected.
      </p>
    </div>
  );
}