// apps/web/src/app/(dashboard)/special-dates/_components/GeneratePreviewModal.tsx

"use client";

import { ExternalLink, Image as ImageIcon, Loader2, Wand2, X } from "lucide-react";
import type { UpcomingHoliday } from "./types";

interface Props {
  isOpen: boolean;
  selectedHoliday: UpcomingHoliday | null;
  generatedMediaUrl: string | null;
  generating: boolean;
  hasLogo: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

export default function GeneratePreviewModal({
  isOpen,
  selectedHoliday,
  generatedMediaUrl,
  generating,
  hasLogo,
  onClose,
  onGenerate,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {selectedHoliday
              ? `Preview: ${selectedHoliday.name}`
              : "Preview: Base Image"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="w-full aspect-[1200/630] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] overflow-hidden flex items-center justify-center mb-4">
            {generatedMediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={generatedMediaUrl}
                alt="Generated"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-6">
                <ImageIcon className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  No image generated yet
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onGenerate}
              disabled={generating || !hasLogo}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {generating ? "Generating..." : generatedMediaUrl ? "Regenerate" : "Generate"}
            </button>
            {generatedMediaUrl && (
              <a
                href={generatedMediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border-default)] rounded-xl text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Full Size
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}