// apps/web/src/app/(dashboard)/special-dates/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  CalendarDays,
  Upload,
  X,
  Image as ImageIcon,
  Wand2,
  AlertCircle,
  Globe,
  Share2,
  Palette,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Pencil,
  Layers,
  Star,
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
  description: string;
}

interface UpcomingHoliday {
  name: string;
  date: string;
  isoDate: string;
  description: string;
  setId: string;
  categories: string[];
  major: boolean;
  tone?: string;
  hashtags?: string[];
}

interface Config {
  enabled: boolean;
  holidaySets: string[];
  excludedHolidays: string[];
  logoMediaId?: string | null;
  generatedMediaId?: string | null;
  templateId?: string | null;
  logoPosition?: "top" | "center" | "bottom";
  showWebsite?: boolean;
  showHandles?: boolean;
  tagline?: string | null;
  dedication?: string | null;
  useStockBackgrounds?: boolean;
}

interface BrandInfo {
  website?: string | null;
  socialLinks?: Record<string, string> | null;
  socialHandles?: Record<string, string> | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  brandColors?: Record<string, string> | null;
}

const TEMPLATES = [
  { id: "clean-corporate", label: "Clean", bg: "bg-white border border-gray-200" },
  { id: "bold-gradient", label: "Gradient", bg: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { id: "minimalist-dark", label: "Dark", bg: "bg-gray-900" },
  { id: "professional-blue", label: "Blue", bg: "bg-[#0A66C2]" },
  { id: "earthy-sa", label: "Earthy", bg: "bg-gradient-to-r from-amber-700 to-amber-900" },
  { id: "modern-split", label: "Split", bg: "bg-gradient-to-r from-slate-800 to-slate-600" },
  { id: "tech-grid", label: "Tech", bg: "bg-slate-900 border border-cyan-500/40" },
  { id: "playful", label: "Playful", bg: "bg-gradient-to-r from-pink-400 to-orange-400" },
];

const LOGO_POSITIONS = [
  { id: "top", label: "Top" },
  { id: "center", label: "Center" },
  { id: "bottom", label: "Bottom" },
] as const;

const CATEGORIES: { id: string; label: string; description: string }[] = [
  { id: "public", label: "Public holidays", description: "National days off" },
  { id: "awareness", label: "Awareness days", description: "Health, environment, social causes" },
  { id: "cultural", label: "Cultural moments", description: "Heritage, community, seasonal" },
  { id: "religious", label: "Religious observances", description: "Faith-based celebrations" },
  { id: "commercial", label: "Commercial moments", description: "Gift-giving and retail days" },
];

const ALL_PLATFORMS = [
  "linkedin",
  "facebook",
  "twitter",
  "instagram",
  "youtube",
  "tiktok",
  "pinterest",
  "threads",
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
    excludedHolidays: [],
    tagline: null,
    dedication: null,
    useStockBackgrounds: false,
  });
  const [availableSets, setAvailableSets] = useState<HolidaySet[]>([]);
  const [allHolidays, setAllHolidays] = useState<UpcomingHoliday[]>([]);
  const [selectedHoliday, setSelectedHoliday] = useState<UpcomingHoliday | null>(null);
  const [enabledCategories, setEnabledCategories] = useState<string[]>([
    "public",
    "awareness",
    "cultural",
    "religious",
    "commercial",
  ]);
  const [brandInfo, setBrandInfo] = useState<BrandInfo>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading">("idle");
  const [scraping, setScraping] = useState(false);
  const [scrapeStep, setScrapeStep] = useState<string>("");
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingHandles, setEditingHandles] = useState(false);
  const [showAllHolidays, setShowAllHolidays] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  const stateRef = useRef({ config, brandInfo, selectedCompanyId });
  useEffect(() => {
    stateRef.current = { config, brandInfo, selectedCompanyId };
  }, [config, brandInfo, selectedCompanyId]);

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

  useEffect(() => {
    if (!selectedCompanyId) return;
    setLoadingConfig(true);
    isInitialLoadRef.current = true;
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/companies/${selectedCompanyId}/special-dates`);
        if (res.ok) {
          const data = await res.json();
          const cfg = data.config || {
            enabled: false,
            holidaySets: [],
            excludedHolidays: [],
            tagline: null,
            dedication: null,
            useStockBackgrounds: false,
          };
          setConfig({
            ...cfg,
            excludedHolidays: cfg.excludedHolidays || [],
            tagline: cfg.tagline ?? null,
            dedication: cfg.dedication ?? null,
            useStockBackgrounds: cfg.useStockBackgrounds ?? false,
          });
          setAvailableSets(data.availableSets || []);
          setBrandInfo(data.company || {});
          setGeneratedMediaUrl(data.config?.generatedMediaUrl || null);
          setAllHolidays(data.upcomingHolidays || []);
          setSelectedHoliday(null);
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
        console.error("Failed to fetch config:", error);
      } finally {
        setLoadingConfig(false);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 600);
      }
    };
    fetchConfig();
  }, [selectedCompanyId]);

  const performSave = useCallback(async () => {
    const { config: c, brandInfo: b, selectedCompanyId: cid } = stateRef.current;
    if (!cid) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/companies/${cid}/special-dates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...c,
          brandInfo: {
            website: b.website,
            socialLinks: b.socialLinks,
            socialHandles: b.socialHandles,
            contactEmail: b.contactEmail,
            contactPhone: b.contactPhone,
            contactWhatsapp: b.contactWhatsapp,
            brandColors: b.brandColors,
          },
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, []);

  const scheduleAutoSave = useCallback(() => {
    if (isInitialLoadRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      performSave();
    }, 700);
  }, [performSave]);

  useEffect(() => {
    if (isInitialLoadRef.current) return;
    scheduleAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.templateId,
    config.logoPosition,
    config.showWebsite,
    config.showHandles,
    config.holidaySets.join(","),
    config.excludedHolidays.join(","),
    config.tagline,
    config.dedication,
    config.useStockBackgrounds,
  ]);

  const updateConfig = (updates: Partial<Config>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateBrandInfo = (updates: Partial<BrandInfo>) => {
    setBrandInfo((prev) => ({ ...prev, ...updates }));
    scheduleAutoSave();
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCompanyId(id);
    router.push(`/special-dates?companyId=${id}`, { scroll: false });
  };

  const toggleSet = (setId: string) => {
    const next = config.holidaySets.includes(setId)
      ? config.holidaySets.filter((s) => s !== setId)
      : [...config.holidaySets, setId];
    updateConfig({ holidaySets: next });
  };

  const toggleCategory = (catId: string) => {
    setEnabledCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const toggleHoliday = (holidayName: string) => {
    const isExcluded = config.excludedHolidays.includes(holidayName);
    updateConfig({
      excludedHolidays: isExcluded
        ? config.excludedHolidays.filter((h) => h !== holidayName)
        : [...config.excludedHolidays, holidayName],
    });
  };

  const filteredHolidays = useMemo(() => {
    return allHolidays.filter((h) =>
      h.categories.some((c) => enabledCategories.includes(c))
    );
  }, [allHolidays, enabledCategories]);

  const quickPicks = useMemo(() => {
    return filteredHolidays.filter((h) => h.major).slice(0, 3);
  }, [filteredHolidays]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, UpcomingHoliday[]> = {};
    for (const h of filteredHolidays) {
      const monthKey = h.date.split(" ").slice(1).join(" ");
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(h);
    }
    return groups;
  }, [filteredHolidays]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      alert("Only PNG or JPG images are accepted for the logo.");
      return;
    }
    try {
      setUploadStage("uploading");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/companies/${selectedCompanyId}/logo`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({ ...prev, logoMediaId: data.mediaId }));
        setLogoPreview(data.url);
        scheduleAutoSave();
      } else {
        const err = await res.json();
        alert(err.error || "Upload failed");
      }
    } catch (error) {
      console.error("Logo upload failed:", error);
      alert("Logo upload failed");
    } finally {
      setUploadStage("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    updateConfig({ logoMediaId: null });
    setLogoPreview(null);
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
        setScrapeStep("Extracting...");
        const data = await res.json();
        setBrandInfo((prev) => ({
          ...prev,
          website: data.website || prev.website,
          socialLinks: data.socialLinks,
          socialHandles: data.socialHandles,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          contactWhatsapp: data.contactWhatsapp,
          brandColors: data.brandColors,
        }));
        setScrapeStep("Saved!");
        setTimeout(() => setScrapeStep(""), 1500);
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
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holidayName: selectedHoliday?.name,
            holidayDate: selectedHoliday?.date,
            holidayMessage: selectedHoliday ? `Happy ${selectedHoliday.name}!` : undefined,
            holidayDescription: selectedHoliday?.description,
            holidayTone: selectedHoliday?.tone,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setGeneratedMediaUrl(data.url);
        if (!selectedHoliday) {
          setConfig((prev) => ({ ...prev, generatedMediaId: data.mediaId }));
        }
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

  const handleHandleChange = (platform: string, value: string) => {
    const nextHandles = { ...(brandInfo.socialHandles || {}) };
    nextHandles[platform] = value.trim();
    updateBrandInfo({ socialHandles: nextHandles });
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
        <p className="text-[var(--text-tertiary)] mb-6">
          You need to create a company before setting up Special Dates.
        </p>
        <a
          href="/companies"
          className="inline-block px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600"
        >
          Go to Companies
        </a>
      </div>
    );
  }

  const detectedPlatforms = ALL_PLATFORMS.filter(
    (p) =>
      (brandInfo.socialLinks && brandInfo.socialLinks[p]) ||
      (brandInfo.socialHandles && brandInfo.socialHandles[p] !== undefined)
  );

  const visiblePlatforms = editingHandles ? ALL_PLATFORMS : detectedPlatforms;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-brand-500" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Special Dates</h1>
            <p className="text-sm text-[var(--text-tertiary)]">
              Automatically generate branded posts for holidays and awareness days.
            </p>
          </div>
        </div>
        <div className="text-xs text-[var(--text-tertiary)]">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" /> Save failed
            </span>
          )}
        </div>
      </div>

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
                  onClick={() => toggleSet(set.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                    config.holidaySets.includes(set.id)
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                      config.holidaySets.includes(set.id)
                        ? "bg-brand-500 border-brand-500"
                        : "border-[var(--border-default)]"
                    )}
                  >
                    {config.holidaySets.includes(set.id) && (
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

          {config.holidaySets.length > 0 && (
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
                    onClick={() => toggleCategory(cat.id)}
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
          )}

          {config.holidaySets.length > 0 && (
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
                      const isExcluded = config.excludedHolidays.includes(h.name);
                      const isSelected = selectedHoliday?.name === h.name;
                      return (
                        <button
                          key={h.name}
                          onClick={() => setSelectedHoliday(isSelected ? null : h)}
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
                onClick={() => setShowAllHolidays(!showAllHolidays)}
                className="text-sm text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
              >
                {showAllHolidays ? "Hide" : "Show"} all upcoming dates
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showAllHolidays && "rotate-90"
                  )}
                />
              </button>

              {showAllHolidays && (
                <div className="mt-4 space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {Object.entries(groupedByMonth).map(([month, items]) => (
                    <div key={month}>
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-2">
                        {month}
                      </p>
                      <div className="space-y-1">
                        {items.map((h) => {
                          const isExcluded = config.excludedHolidays.includes(h.name);
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
                                onClick={() => toggleHoliday(h.name)}
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
                                onClick={() =>
                                  setSelectedHoliday(isSelected ? null : h)
                                }
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
                      No holidays match the selected filters.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Kit
            </h2>

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
                    onChange={handleLogoUpload}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Tagline <span className="text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={config.tagline ?? ""}
                  onChange={(e) => updateConfig({ tagline: e.target.value })}
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
                  value={config.dedication ?? ""}
                  onChange={(e) => updateConfig({ dedication: e.target.value })}
                  placeholder="Leave empty to auto-generate per holiday"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  If empty, a unique line is generated for each holiday
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Website</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={brandInfo.website || ""}
                  onChange={(e) => updateBrandInfo({ website: e.target.value })}
                  placeholder="https://yourcompany.com"
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <button
                  onClick={handleScrapeWebsite}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={brandInfo.contactEmail ?? ""}
                  onChange={(e) => updateBrandInfo({ contactEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={brandInfo.contactPhone ?? ""}
                  onChange={(e) => updateBrandInfo({ contactPhone: e.target.value })}
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
                  value={brandInfo.contactWhatsapp ?? ""}
                  onChange={(e) => updateBrandInfo({ contactWhatsapp: e.target.value })}
                  placeholder="012 345 6789"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium flex items-center gap-2 text-[var(--text-primary)]">
                  <Share2 className="h-4 w-4" />
                  Social Handles
                </p>
                <button
                  onClick={() => setEditingHandles(!editingHandles)}
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
                    const handle = (brandInfo.socialHandles || {})[platform] ?? "";
                    const url = (brandInfo.socialLinks || {})[platform] || "";
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
                            onChange={(e) => handleHandleChange(platform, e.target.value)}
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

          <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-default)] mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Template Style
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => updateConfig({ templateId: tpl.id })}
                  className={cn(
                    "p-2 rounded-xl border text-left transition-all",
                    config.templateId === tpl.id
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <div className={cn("w-full h-14 rounded-md mb-2", tpl.bg)} />
                  <p className="text-xs font-medium text-[var(--text-primary)]">{tpl.label}</p>
                </button>
              ))}
            </div>

            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Logo position</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {LOGO_POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => updateConfig({ logoPosition: pos.id })}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                    config.logoPosition === pos.id
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]"
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-sm mb-3">
              <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={config.showWebsite ?? true}
                  onChange={(e) => updateConfig({ showWebsite: e.target.checked })}
                />
                Show website
              </label>
              <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={config.showHandles ?? true}
                  onChange={(e) => updateConfig({ showHandles: e.target.checked })}
                />
                Show social handles
              </label>
            </div>

            <div className="flex flex-wrap gap-4 text-sm pt-3 border-t border-[var(--border-subtle)]">
              <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={config.useStockBackgrounds ?? false}
                  onChange={(e) => updateConfig({ useStockBackgrounds: e.target.checked })}
                />
                Use stock photo backgrounds for holidays
              </label>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              Pexels photos appear behind the branded overlay. Only applies when a holiday is selected.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPreviewModal(true)}
              disabled={!config.logoMediaId}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              <Wand2 className="h-5 w-5" />
              {selectedHoliday
                ? `Preview and Generate: ${selectedHoliday.name}`
                : "Preview and Generate"}
            </button>
            <button
              onClick={performSave}
              disabled={saveStatus === "saving"}
              className="flex items-center gap-2 px-5 py-3 border border-[var(--border-default)] rounded-xl font-medium hover:bg-[var(--bg-secondary)] transition-colors text-sm"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Now
            </button>
            {!config.logoMediaId && (
              <span className="text-sm text-amber-600 dark:text-amber-400">
                Upload a logo first
              </span>
            )}
          </div>
        </>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {selectedHoliday
                  ? `Preview: ${selectedHoliday.name}`
                  : "Preview: Base Image"}
              </h2>
              <button
                onClick={() => setShowPreviewModal(false)}
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
                  onClick={handleGenerateMedia}
                  disabled={generating || !config.logoMediaId}
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
      )}
    </div>
  );
}