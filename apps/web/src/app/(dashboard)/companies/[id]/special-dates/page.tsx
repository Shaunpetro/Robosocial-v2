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
  Settings,
  Wand2,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  Share2,
  Palette,
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
  templateId?: string | null;
}

interface CompanyBrandInfo {
  website?: string | null;
  socialLinks?: Record<string, string> | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  brandColors?: Record<string, string> | null;
}

const TEMPLATES = [
  { id: "clean-corporate", label: "Clean Corporate", description: "White background, subtle shadows, centered logo" },
  { id: "bold-gradient", label: "Bold Gradient", description: "Vibrant gradient background, large text overlay" },
  { id: "minimalist-dark", label: "Minimalist Dark", description: "Dark background, white text, minimal decor" },
];

export default function CompanySpecialDatesPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const [config, setConfig] = useState<Config>({
    enabled: false,
    holidaySets: [],
  });
  const [availableSets, setAvailableSets] = useState<HolidaySet[]>([]);
  const [brandInfo, setBrandInfo] = useState<CompanyBrandInfo>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"configuration" | "generation">("configuration");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch config and brand info
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/special-dates`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data.config);
          setAvailableSets(data.availableSets);
          setBrandInfo(data.company || {});
          if (data.config.logoMediaId) {
            try {
              const mediaRes = await fetch(`/api/media/${data.config.logoMediaId}`);
              if (mediaRes.ok) {
                const mediaData = await mediaRes.json();
                setLogoPreview(mediaData.url);
              }
            } catch {}
          }
          if (data.config.generatedMediaId) {
            try {
              const genRes = await fetch(`/api/media/${data.config.generatedMediaId}`);
              if (genRes.ok) {
                const genData = await genRes.json();
                setConfig((prev) => ({ ...prev, generatedMediaUrl: genData.url }));
              }
            } catch {}
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

  const handleScrapeWebsite = async () => {
    if (!brandInfo.website) {
      alert("Please enter your website URL first.");
      return;
    }
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/scrape-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: brandInfo.website }),
      });
      if (res.ok) {
        const data = await res.json();
        setBrandInfo((prev) => ({
          ...prev,
          socialLinks: data.socialLinks,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          brandColors: data.brandColors,
        }));
        alert("Brand information scraped successfully!");
      } else {
        const err = await res.json();
        setScrapeError(err.error || "Scraping failed");
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      setScrapeError("Network error while scraping website");
    } finally {
      setScraping(false);
    }
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

  const canGenerate = config.enabled && config.logoMediaId && config.holidaySets.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-6 w-6 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Special Dates</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Automatically generate posts for awareness days and public holidays
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("configuration")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "configuration"
              ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <Settings size={16} />
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("generation")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === "generation"
              ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <Wand2 size={16} />
          Media Generation
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === "configuration" && (
        <div className="space-y-8">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Enable Special Dates</p>
              <p className="text-sm text-[var(--text-tertiary)]">
                Weekly generation of posts for upcoming holidays based on your selection
              </p>
            </div>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
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

          {/* Brand Kit Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2 text-[var(--text-primary)]">
              <Palette className="h-5 w-5" />
              Brand Kit
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              We'll use this information to create consistent branded images for your special date posts.
            </p>

            {/* Website input + scrape */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Website URL</label>
                <input
                  type="text"
                  value={brandInfo.website || ""}
                  onChange={(e) => setBrandInfo((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourcompany.com"
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleScrapeWebsite}
                  disabled={scraping}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                >
                  {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Scrape Website
                </button>
              </div>
            </div>
            {scrapeError && (
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {scrapeError}
              </div>
            )}

            {/* Detected info */}
            {(brandInfo.socialLinks || brandInfo.contactEmail || brandInfo.contactPhone) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {brandInfo.socialLinks && Object.keys(brandInfo.socialLinks).length > 0 && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-sm font-medium flex items-center gap-2 text-[var(--text-primary)]">
                      <Share2 className="h-4 w-4" /> Social Links
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {Object.entries(brandInfo.socialLinks).map(([platform, url]) => (
                        <li key={platform} className="truncate text-[var(--text-secondary)]">
                          <span className="font-medium">{platform}:</span> {url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(brandInfo.contactEmail || brandInfo.contactPhone) && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-sm font-medium flex items-center gap-2 text-[var(--text-primary)]">
                      <Mail className="h-4 w-4" /> Contact
                    </p>
                    <div className="mt-2 space-y-1 text-sm">
                      {brandInfo.contactEmail && (
                        <p className="text-[var(--text-secondary)]">Email: {brandInfo.contactEmail}</p>
                      )}
                      {brandInfo.contactPhone && (
                        <p className="text-[var(--text-secondary)]">Phone: {brandInfo.contactPhone}</p>
                      )}
                    </div>
                  </div>
                )}
                {brandInfo.brandColors && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-sm font-medium flex items-center gap-2 text-[var(--text-primary)]">
                      <Palette className="h-4 w-4" /> Brand Colors
                    </p>
                    <div className="mt-2 flex gap-2">
                      {Object.entries(brandInfo.brandColors).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1">
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: value }}
                          />
                          <span className="text-xs text-[var(--text-tertiary)]">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logo Upload */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Company Logo (PNG)
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-3">
              Upload a <strong>solid‑background PNG</strong> of your logo. The logo will be placed on a coloured gradient in the generated image. Transparency is fine – the gradient will show through – but if you need a white or black version, use a pre‑flattened image.
            </p>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-xl border border-[var(--border-default)] flex items-center justify-center bg-[var(--bg-secondary)] overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
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

          {/* Holiday Set Selection */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Select Holiday Sets
            </h3>
            {availableSets.length === 0 ? (
              <div className="p-4 bg-[var(--bg-secondary)] rounded-xl flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <AlertCircle size={16} />
                No holiday sets available. This may be a loading issue – try refreshing the page.
              </div>
            ) : (
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
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{set.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Template Style
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setConfig((prev) => ({ ...prev, templateId: tpl.id }))}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    config.templateId === tpl.id
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <div
                    className={cn(
                      "w-full h-16 rounded-md mb-2",
                      tpl.id === "clean-corporate" && "bg-white border border-gray-200",
                      tpl.id === "bold-gradient" && "bg-gradient-to-r from-purple-500 to-pink-500",
                      tpl.id === "minimalist-dark" && "bg-gray-900"
                    )}
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)]">{tpl.label}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Configuration
            </button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
            )}
          </div>
        </div>
      )}

      {/* Media Generation Tab */}
      {activeTab === "generation" && (
        <div className="space-y-6">
          {!canGenerate && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle size={16} />
              Please complete the configuration first (enable, upload logo, select holidays, and save).
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              Branded Media Image
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-3">
              This image will be attached to every special‑date post. It includes your logo, website, and all connected platform handles.
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
                disabled={!canGenerate || generating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : config.generatedMediaId ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {config.generatedMediaId ? "Regenerate" : "Generate Media Image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}