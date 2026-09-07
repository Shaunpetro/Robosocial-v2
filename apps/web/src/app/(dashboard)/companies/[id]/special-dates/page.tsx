// apps/web/src/app/(dashboard)/special-dates/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  CalendarDays,
  Upload,
  X,
  RefreshCw,
  Image as ImageIcon,
  Wand2,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  Share2,
  Palette,
  Building2,
  CheckCircle2,
  FileText,
  LinkIcon,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
}

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

interface BrandInfo {
  website?: string | null;
  socialLinks?: Record<string, string> | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  brandColors?: Record<string, string> | null;
}

const TEMPLATES = [
  { id: "clean-corporate", label: "Clean", bg: "bg-white border border-gray-200" },
  { id: "bold-gradient", label: "Gradient", bg: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { id: "minimalist-dark", label: "Dark", bg: "bg-gray-900" },
];

export default function SpecialDatesHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get("companyId") || "";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const [config, setConfig] = useState<Config>({
    enabled: false,
    holidaySets: [],
  });
  const [availableSets, setAvailableSets] = useState<HolidaySet[]>([]);
  const [brandInfo, setBrandInfo] = useState<BrandInfo>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeStep, setScrapeStep] = useState<string>("");
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const data = await res.json();
          setCompanies(data);
          if (!selectedCompanyId && data.length > 0) {
            setSelectedCompanyId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch config when selectedCompanyId changes
  useEffect(() => {
    if (!selectedCompanyId) return;
    setLoadingConfig(true);
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/companies/${selectedCompanyId}/special-dates`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data.config || { enabled: false, holidaySets: [] });
          setAvailableSets(data.availableSets || []);
          setBrandInfo(data.company || {});
          setGeneratedMediaUrl(data.config?.generatedMediaUrl || null);
          if (data.config?.logoMediaId) {
            try {
              const mediaRes = await fetch(`/api/media/${data.config.logoMediaId}`);
              if (mediaRes.ok) {
                const mediaData = await mediaRes.json();
                setLogoPreview(mediaData.url);
              }
            } catch {}
          }
        }
      } catch (error) {
        console.error("Failed to fetch special dates config:", error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, [selectedCompanyId]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCompanyId(id);
    router.push(`/special-dates?companyId=${id}`, { scroll: false });
  };

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
      formData.append("companyId", selectedCompanyId);
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
      const payload = {
        ...config,
        brandInfo: {
          website: brandInfo.website,
          socialLinks: brandInfo.socialLinks,
          contactEmail: brandInfo.contactEmail,
          contactPhone: brandInfo.contactPhone,
          brandColors: brandInfo.brandColors,
        },
      };
      const res = await fetch(`/api/companies/${selectedCompanyId}/special-dates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save");
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
    setScrapeStep("Fetching website...");
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/scrape-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: brandInfo.website }),
      });
      if (res.ok) {
        setScrapeStep("Extracting brand info...");
        const data = await res.json();
        setBrandInfo((prev) => ({
          ...prev,
          website: data.website || prev.website,
          socialLinks: data.socialLinks,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          brandColors: data.brandColors,
        }));
        setScrapeStep("Saved!");
        setTimeout(() => setScrapeStep(""), 1500);
        alert("Brand information scraped successfully!");
      } else {
        const err = await res.json();
        setScrapeError(err.error || "Scraping failed");
        setScrapeStep("");
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      setScrapeError("Network error while scraping website");
      setScrapeStep("");
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
        `/api/companies/${selectedCompanyId}/special-dates/generate-media`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({
          ...prev,
          generatedMediaId: data.mediaId,
        }));
        setGeneratedMediaUrl(data.url);
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

  if (loadingCompanies) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <Building2 className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-4" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No companies found</h1>
        <p className="text-[var(--text-tertiary)] mb-6">You need to create a company before setting up Special Dates.</p>
        <a
          href="/companies"
          className="inline-block px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600"
        >
          Go to Companies
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-6 w-6 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Special Dates</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Automatically generate branded posts for holidays and awareness days.
          </p>
        </div>
      </div>

      {/* Company Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Select Organization
        </label>
        <div className="relative">
          <select
            value={selectedCompanyId}
            onChange={handleCompanyChange}
            className="w-full appearance-none px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)] pointer-events-none" />
        </div>
      </div>

      {loadingConfig ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          {/* Brand Kit Section */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Kit
            </h2>

            {/* Logo Upload */}
            <div className="mb-6">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Company Logo (PNG)</p>
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
                    id="logo-upload-hub"
                  />
                  <label
                    htmlFor="logo-upload-hub"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-brand-600 transition-colors"
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

            {/* Website & Scrape */}
            <div className="mb-6">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Website</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={brandInfo.website || ""}
                    onChange={(e) => setBrandInfo((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <button
                  onClick={handleScrapeWebsite}
                  disabled={scraping}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  {scraping ? scrapeStep || "Scraping..." : "Scrape Website"}
                </button>
              </div>
              {scrapeError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {scrapeError}
                </div>
              )}

              {/* Alternative sources hint */}
              {!brandInfo.website && !scraping && (
                <p className="mt-3 text-sm text-[var(--text-tertiary)]">
                  No website? You can also{" "}
                  <span className="text-brand-600 dark:text-brand-400">upload a company profile PDF</span> or{" "}
                  <span className="text-brand-600 dark:text-brand-400">paste social media links</span>.
                </p>
              )}
            </div>

            {/* Detected Info */}
            {(brandInfo.socialLinks || brandInfo.contactEmail || brandInfo.contactPhone || brandInfo.brandColors) && (
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

          {/* Holiday Sets */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Holiday Sets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => toggleSet(set.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                    config.holidaySets.includes(set.id)
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
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
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">{set.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Template Style</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setConfig((prev) => ({ ...prev, templateId: tpl.id }))}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    config.templateId === tpl.id
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <div className={cn("w-full h-16 rounded-md mb-2", tpl.bg)} />
                  <p className="text-sm font-medium text-[var(--text-primary)]">{tpl.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Media */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Branded Media Image</h2>
            <div className="flex items-start gap-4">
              <div className="w-48 h-24 rounded-xl border border-[var(--border-default)] flex items-center justify-center bg-[var(--bg-secondary)] overflow-hidden">
                {generatedMediaUrl ? (
                  <img
                    src={generatedMediaUrl}
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
                ) : generatedMediaUrl ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {generatedMediaUrl ? "Regenerate" : "Generate Media Image"}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Configuration
            </button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}