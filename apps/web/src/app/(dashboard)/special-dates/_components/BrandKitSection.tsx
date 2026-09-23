// apps/web/src/app/(dashboard)/special-dates/_components/BrandKitSection.tsx

"use client";

import { useRef } from "react";
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  Globe,
  Loader2,
  Palette,
  Pencil,
  Share2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandInfo, Config, UploadStage } from "./types";

interface Props {
  tagline: string | null;
  dedication: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  socialLinks: Record<string, string> | null;
  socialHandles: Record<string, string> | null;
  logoPreview: string | null;
  uploadStage: UploadStage;
  scraping: boolean;
  scrapeStep: string;
  scrapeError: string | null;
  editingHandles: boolean;
  visiblePlatforms: string[];
  onLogoUpload: (file: File) => void;
  onRemoveLogo: () => void;
  onScrapeWebsite: () => void;
  onUpdateConfig: (updates: Partial<Config>) => void;
  onUpdateBrandInfo: (updates: Partial<BrandInfo>) => void;
  onHandleChange: (platform: string, value: string) => void;
  onToggleEditingHandles: () => void;
}

export default function BrandKitSection({
  tagline,
  dedication,
  website,
  contactEmail,
  contactPhone,
  contactWhatsapp,
  socialLinks,
  socialHandles,
  logoPreview,
  uploadStage,
  scraping,
  scrapeStep,
  scrapeError,
  editingHandles,
  visiblePlatforms,
  onLogoUpload,
  onRemoveLogo,
  onScrapeWebsite,
  onUpdateConfig,
  onUpdateBrandInfo,
  onHandleChange,
  onToggleEditingHandles,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLogoUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Palette className="h-5 w-5" />
        Brand Kit
      </h2>

      {/* Logo */}
      <div className="mb-6">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Company Logo</p>
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-xl border border-[var(--border-default)] flex items-center justify-center bg-[var(--bg-secondary)] overflow-hidden">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <CalendarDays className="h-8 w-8 text-[var(--text-tertiary)]" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
              id="logo-upload-hub"
            />
            <label
              htmlFor="logo-upload-hub"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors",
                uploadStage !== "idle"
                  ? "bg-brand-500/60 text-white cursor-wait"
                  : "bg-brand-500 text-white hover:bg-brand-600"
              )}
            >
              {uploadStage === "uploading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </>
              )}
            </label>
            {logoPreview && uploadStage === "idle" && (
              <button
                onClick={onRemoveLogo}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tagline + Dedication */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Tagline <span className="text-[var(--text-tertiary)]">(optional)</span>
          </label>
          <input
            type="text"
            value={tagline ?? ""}
            onChange={(e) => onUpdateConfig({ tagline: e.target.value })}
            placeholder="e.g., Engineering Excellence Since 2008"
            maxLength={80}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Appears under the company name
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Fallback dedication <span className="text-[var(--text-tertiary)]">(optional)</span>
          </label>
          <input
            type="text"
            value={dedication ?? ""}
            onChange={(e) => onUpdateConfig({ dedication: e.target.value })}
            placeholder="Leave empty to auto-generate per holiday"
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            If empty, a unique line is generated for each holiday
          </p>
        </div>
      </div>

      {/* Website + Scrape */}
      <div className="mb-6">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Website</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={website || ""}
            onChange={(e) => onUpdateBrandInfo({ website: e.target.value })}
            placeholder="https://yourcompany.com"
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <button
            onClick={onScrapeWebsite}
            disabled={scraping}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {scraping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            {scraping ? scrapeStep || "Scraping..." : "Scrape"}
          </button>
        </div>
        {scrapeError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {scrapeError}
          </div>
        )}
      </div>

      {/* Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Email
          </label>
          <input
            type="email"
            value={contactEmail ?? ""}
            onChange={(e) => onUpdateBrandInfo({ contactEmail: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={contactPhone ?? ""}
            onChange={(e) => onUpdateBrandInfo({ contactPhone: e.target.value })}
            placeholder="012 345 6789"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            WhatsApp
          </label>
          <input
            type="tel"
            value={contactWhatsapp ?? ""}
            onChange={(e) => onUpdateBrandInfo({ contactWhatsapp: e.target.value })}
            placeholder="012 345 6789"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
          />
        </div>
      </div>

      {/* Social Handles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium flex items-center gap-2 text-[var(--text-primary)]">
            <Share2 className="h-4 w-4" />
            Social Handles
          </p>
          <button
            onClick={onToggleEditingHandles}
            className="text-xs flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
          >
            <Pencil className="h-3 w-3" />
            {editingHandles ? "Done" : "Edit or Add"}
          </button>
        </div>
        {visiblePlatforms.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">
            No social handles detected. Click Edit to add manually.
          </p>
        ) : (
          <div className="space-y-2">
            {visiblePlatforms.map((platform) => {
              const handle = (socialHandles || {})[platform] ?? "";
              const url = (socialLinks || {})[platform] || "";
              return (
                <div
                  key={platform}
                  className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-secondary)]"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] w-20 flex-shrink-0">
                    {platform}
                  </span>
                  {editingHandles ? (
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => onHandleChange(platform, e.target.value)}
                      placeholder="handle (without @)"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
                    />
                  ) : (
                    <span className="text-sm text-[var(--text-primary)] truncate flex-1">
                      {handle ? `@${handle}` : "(no handle)"}
                    </span>
                  )}
                  {!editingHandles && url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-tertiary)] hover:text-brand-500"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}