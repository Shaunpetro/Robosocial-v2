// apps/web/src/app/(dashboard)/companies/[id]/special-dates/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Save,
  CalendarDays,
  Upload,
  X,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HolidaySet {
  id: string;
  label: string;
}

interface Config {
  enabled: boolean;
  holidaySets: string[];
  logoMediaId?: string | null;
  logoUrl?: string | null;
  generatedMediaId?: string | null;
  generatedMediaUrl?: string | null;
}

export default function CompanySpecialDatesPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const [config, setConfig] = useState<Config>({
    enabled: false,
    holidaySets: [],
  });
  const [availableSets, setAvailableSets] = useState<HolidaySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/special-dates`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data.config);
          setAvailableSets(data.availableSets);
          if (data.config.logoMediaId) {
            try {
              const mediaRes = await fetch(
                `/api/media/${data.config.logoMediaId}`
              );
              if (mediaRes.ok) {
                const mediaData = await mediaRes.json();
                setLogoPreview(mediaData.url);
              }
            } catch (e) {
              console.warn("Could not fetch logo preview");
            }
          }
          if (data.config.generatedMediaId) {
            try {
              const genRes = await fetch(
                `/api/media/${data.config.generatedMediaId}`
              );
              if (genRes.ok) {
                const genData = await genRes.json();
                setConfig((prev) => ({
                  ...prev,
                  generatedMediaUrl: genData.url,
                }));
              }
            } catch (e) {
              console.warn("Could not fetch generated media preview");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [companyId]);

  const toggleSet = (setId: string) => {
    setConfig((prev) => ({
      ...prev,
      holidaySets: prev.holidaySets.includes(setId)
        ? prev.holidaySets.filter((s) => s !== setId)
        : [...prev.holidaySets, setId],
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      alert("Only PNG images are accepted for the logo.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", companyId);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const media = await res.json();
        setConfig((prev) => ({ ...prev, logoMediaId: media.id }));
        setLogoPreview(media.url);
      } else {
        const err = await res.json();
        alert(err.error || "Upload failed");
      }
    } catch (error) {
      console.error("Logo upload failed:", error);
      alert("Logo upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setConfig((prev) => ({ ...prev, logoMediaId: null }));
    setLogoPreview(null);
  };

  const handleGenerateMedia = async () => {
    if (!config.logoMediaId) {
      alert("Please upload a company logo first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/companies/${companyId}/special-dates/generate-media`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({
          ...prev,
          generatedMediaId: data.mediaId,
          generatedMediaUrl: data.url,
        }));
        alert("Media image generated successfully!");
      } else {
        const err = await res.json();
        alert(err.error || "Generation failed");
      }
    } catch (error) {
      console.error("Media generation failed:", error);
      alert("Media generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/companies/${companyId}/special-dates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-6 w-6 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Special Dates
          </h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Automatically generate posts for awareness days and public holidays
          </p>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] mb-6">
        <div>
          <p className="font-medium text-[var(--text-primary)]">
            Enable Special Dates
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            Weekly generation of posts for upcoming holidays based on your
            selection
          </p>
        </div>
        <button
          onClick={() =>
            setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
          }
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors",
            config.enabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
              config.enabled ? "translate-x-6" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      {/* Logo Upload */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Company Logo (PNG)
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-2">
          Upload a solid‑background PNG logo. This will be used in the generated
          media image.
        </p>
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-xl border border-[var(--border-default)] flex items-center justify-center bg-[var(--bg-secondary)] overflow-hidden">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <CalendarDays className="h-8 w-8 text-[var(--text-tertiary)]" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Logo"}
            </label>
            {logoPreview && (
              <button
                onClick={handleRemoveLogo}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generated Media Image */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Branded Media Image
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-2">
          This image will be attached to every special‑date post. It includes
          your logo, website, and all connected platform handles.
        </p>
        <div className="flex items-start gap-4">
          <div className="w-48 h-24 rounded-xl border border-[var(--border-default)] flex items-center justify-center bg-[var(--bg-secondary)] overflow-hidden">
            {config.generatedMediaUrl ? (
              <img
                src={config.generatedMediaUrl}
                alt="Generated media"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-[var(--text-tertiary)]" />
            )}
          </div>
          <button
            onClick={handleGenerateMedia}
            disabled={generating || !config.logoMediaId}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : config.generatedMediaId ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            {config.generatedMediaId ? "Regenerate" : "Generate Media Image"}
          </button>
        </div>
      </div>

      {/* Holiday set selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Select Holiday Sets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableSets.map((set) => (
            <button
              key={set.id}
              onClick={() => toggleSet(set.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                config.holidaySets.includes(set.id)
                  ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                  : "border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                  config.holidaySets.includes(set.id)
                    ? "bg-brand-500 border-brand-500"
                    : "border-[var(--border-default)]"
                )}
              >
                {config.holidaySets.includes(set.id) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="font-medium">{set.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Configuration
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Saved!
          </span>
        )}
      </div>
    </div>
  );
}