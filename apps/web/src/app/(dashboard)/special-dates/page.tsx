// apps/web/src/app/(dashboard)/special-dates/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, CalendarDays, Loader2, Save, Wand2 } from "lucide-react";
import CompanySidebar from "@/components/layout/CompanySidebar";

import type {
  BrandInfo,
  CommitProgress,
  Company,
  Config,
  HolidaySet,
  ManualProgress,
  SaveStatus,
  SchedulableHoliday,
  SchedulableHolidaysResponse,
  ScheduledSpecialDatePost,
  SidebarCompany,
  TermPlan,
  UpcomingHoliday,
  UploadStage,
} from "./_components/types";
import {
  ALL_PLATFORMS,
  DEFAULT_ENABLED_CATEGORIES,
} from "./_components/constants";

import CompanySelector from "./_components/CompanySelector";
import SaveStatusIndicator from "./_components/SaveStatusIndicator";
import BrandKitSection from "./_components/BrandKitSection";
import TemplateStyleSection from "./_components/TemplateStyleSection";
import TermSchedulerCard from "./_components/TermSchedulerCard";
import ManualSchedulerCard from "./_components/ManualSchedulerCard";
import GeneratePreviewModal from "./_components/GeneratePreviewModal";
import TermPreviewModal from "./_components/TermPreviewModal";
import UpcomingSpecialDateCard from "./_components/UpcomingSpecialDateCard";
import ScheduledSpecialDatesList from "./_components/ScheduledSpecialDatesList";
import ScheduledPostEditModal from "./_components/ScheduledPostEditModal";
import CalendarSelectorStep from "./_components/steps/CalendarSelectorStep";
import CategoryFilterStep from "./_components/steps/CategoryFilterStep";
import SpecialDatePickerStep from "./_components/steps/SpecialDatePickerStep";

export default function SpecialDatesHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get("companyId") || "";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [sidebarCompany, setSidebarCompany] = useState<SidebarCompany | null>(null);

  const [config, setConfig] = useState<Config>({
    enabled: false,
    holidaySets: [],
    excludedHolidays: [],
    tagline: null,
    dedication: null,
    useStockBackgrounds: false,
    compositionId: null,
    lastScheduledTermId: null,
  });
  const [availableSets, setAvailableSets] = useState<HolidaySet[]>([]);
  const [allHolidays, setAllHolidays] = useState<UpcomingHoliday[]>([]);
  const [selectedHoliday, setSelectedHoliday] = useState<UpcomingHoliday | null>(null);
  const [enabledCategories, setEnabledCategories] = useState<string[]>(
    DEFAULT_ENABLED_CATEGORIES
  );
  const [brandInfo, setBrandInfo] = useState<BrandInfo>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [scraping, setScraping] = useState(false);
  const [scrapeStep, setScrapeStep] = useState<string>("");
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingHandles, setEditingHandles] = useState(false);

  // Term scheduling state
  const [showTermModal, setShowTermModal] = useState(false);
  const [termPlan, setTermPlan] = useState<TermPlan | null>(null);
  const [loadingTermPlan, setLoadingTermPlan] = useState(false);
  const [termPlanError, setTermPlanError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [commitProgress, setCommitProgress] = useState<CommitProgress[]>([]);

  // Manual scheduler state
  const [schedulable, setSchedulable] = useState<SchedulableHolidaysResponse | null>(null);
  const [loadingSchedulable, setLoadingSchedulable] = useState(false);
  const [schedulableError, setSchedulableError] = useState<string | null>(null);
  const [manualProgress, setManualProgress] = useState<Record<string, ManualProgress>>({});
  const [regeneratingPostIds, setRegeneratingPostIds] = useState<string[]>([]);

  // SD-2b: scheduled posts list + edit modal
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledSpecialDatePost[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledSpecialDatePost | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  const stateRef = useRef({ config, brandInfo, selectedCompanyId });
  useEffect(() => {
    stateRef.current = { config, brandInfo, selectedCompanyId };
  }, [config, brandInfo, selectedCompanyId]);

  // -------- companies --------
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- config --------
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
            compositionId: null,
            lastScheduledTermId: null,
          };
          setConfig({
            ...cfg,
            excludedHolidays: cfg.excludedHolidays || [],
            tagline: cfg.tagline ?? null,
            dedication: cfg.dedication ?? null,
            useStockBackgrounds: cfg.useStockBackgrounds ?? false,
            compositionId: cfg.compositionId ?? null,
            lastScheduledTermId: cfg.lastScheduledTermId ?? null,
          });
          setAvailableSets(data.availableSets || []);
          setBrandInfo(data.company || {});
          setGeneratedMediaUrl(data.config?.generatedMediaUrl || null);
          setAllHolidays(data.upcomingHolidays || []);
          setSelectedHoliday(null);

          if (data.company) {
            setSidebarCompany({
              id: data.company.id,
              name: data.company.name,
              logoUrl: data.company.logoUrl,
              industry: data.company.industry ?? null,
              platforms: (data.company.platforms || []).map((p: any) => ({
                id: p.id,
                type: p.type,
                platformName: p.name,
              })),
              intelligence: data.company.intelligence || null,
            });
          }

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

  // -------- schedulable --------
  const refreshSchedulable = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoadingSchedulable(true);
    setSchedulableError(null);
    try {
      const res = await fetch(
        `/api/companies/${selectedCompanyId}/special-dates/schedulable-holidays`
      );
      if (res.ok) {
        const data = await res.json();
        setSchedulable(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setSchedulableError(err.error || "Failed to load special dates");
      }
    } catch (err) {
      console.error("Schedulable fetch failed:", err);
      setSchedulableError("Network error");
    } finally {
      setLoadingSchedulable(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    refreshSchedulable();
  }, [selectedCompanyId, refreshSchedulable]);

  // -------- scheduled posts (SD-2b) --------
  const refreshScheduled = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoadingScheduled(true);
    try {
      const res = await fetch(
        `/api/companies/${selectedCompanyId}/special-dates/scheduled-posts`
      );
      if (res.ok) {
        const data = await res.json();
        setScheduledPosts(data.posts || []);
      } else {
        setScheduledPosts([]);
      }
    } catch (err) {
      console.error("Scheduled posts fetch failed:", err);
      setScheduledPosts([]);
    } finally {
      setLoadingScheduled(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    refreshScheduled();
  }, [selectedCompanyId, refreshScheduled]);

  const upcomingPost = (() => {
    const future = scheduledPosts
      .filter((p) => !p.isPast && p.scheduledFor)
      .sort(
        (a, b) =>
          new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime()
      );
    return future[0] || null;
  })();

  // -------- save --------
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
    config.compositionId,
    config.logoPosition,
    config.showWebsite,
    config.showHandles,
    config.holidaySets.join(","),
    config.excludedHolidays.join(","),
    config.tagline,
    config.dedication,
    config.useStockBackgrounds,
  ]);

  // -------- handlers --------
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

  const handleLogoUpload = async (file: File) => {
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

  // -------- term modal --------
  const openTermModal = async () => {
    setShowTermModal(true);
    setTermPlan(null);
    setTermPlanError(null);
    setCommitProgress([]);
    setLoadingTermPlan(true);
    try {
      const res = await fetch(
        `/api/companies/${selectedCompanyId}/special-dates/term-preview`
      );
      if (res.ok) {
        const data = await res.json();
        setTermPlan(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setTermPlanError(err.error || "Failed to load term preview");
      }
    } catch (err) {
      console.error("Term preview failed:", err);
      setTermPlanError("Network error loading term preview");
    } finally {
      setLoadingTermPlan(false);
    }
  };

  const handleCommitTerm = async () => {
    if (!termPlan || !termPlan.canCommit) return;

    setCommitting(true);
    const initial: CommitProgress[] = termPlan.holidays.map((h, i) => ({
      holidayName: h.name,
      index: i,
      total: termPlan.holidays.length,
      status: "pending",
      postsCreated: 0,
      errors: [],
    }));
    setCommitProgress(initial);

    for (let i = 0; i < termPlan.holidays.length; i++) {
      const h = termPlan.holidays[i];
      const isFinal = i === termPlan.holidays.length - 1;

      try {
        const res = await fetch(
          `/api/companies/${selectedCompanyId}/special-dates/schedule-term`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              termId: termPlan.term.id,
              holidayName: h.name,
              holidayIsoDate: h.isoDate,
              holidayDescription: h.description,
              holidayTone: h.tone,
              setId: h.setId,
              isFinalHoliday: isFinal,
            }),
          }
        );
        const data = await res.json();
        if (res.ok) {
          setCommitProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    ...p,
                    status: data.errors && data.errors.length > 0 ? "error" : "success",
                    postsCreated: (data.postsCreated || []).filter(
                      (pc: any) => !pc.skipped
                    ).length,
                    errors: data.errors || [],
                  }
                : p
            )
          );
        } else {
          setCommitProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: "error", errors: [data.error || "Request failed"] }
                : p
            )
          );
        }
      } catch (err) {
        setCommitProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: "error", errors: [String(err)] } : p
          )
        );
      }
    }

    setCommitting(false);
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/special-dates`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig((prev) => ({
            ...prev,
            lastScheduledTermId: data.config.lastScheduledTermId ?? null,
          }));
        }
      }
    } catch {}
    refreshSchedulable();
    refreshScheduled();
  };

  // -------- manual scheduler --------
  const scheduleOneHoliday = async (h: SchedulableHoliday) => {
    setManualProgress((prev) => ({
      ...prev,
      [h.isoDate + h.name]: {
        holidayName: h.name,
        status: "pending",
        postsCreated: 0,
        errors: [],
      },
    }));

    try {
      const res = await fetch(
        `/api/companies/${selectedCompanyId}/special-dates/schedule-holiday`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holidayName: h.name,
            holidayIsoDate: h.isoDate,
            holidayDescription: h.description,
            holidayTone: h.tone,
            setId: h.setId,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setManualProgress((prev) => ({
          ...prev,
          [h.isoDate + h.name]: {
            holidayName: h.name,
            status: data.errors && data.errors.length > 0 ? "error" : "success",
            postsCreated: (data.postsCreated || []).filter((pc: any) => !pc.skipped).length,
            errors: data.errors || [],
          },
        }));
      } else {
        setManualProgress((prev) => ({
          ...prev,
          [h.isoDate + h.name]: {
            holidayName: h.name,
            status: "error",
            postsCreated: 0,
            errors: [data.error || "Request failed"],
          },
        }));
      }
    } catch (err) {
      setManualProgress((prev) => ({
        ...prev,
        [h.isoDate + h.name]: {
          holidayName: h.name,
          status: "error",
          postsCreated: 0,
          errors: [String(err)],
        },
      }));
    }

    setTimeout(() => {
      refreshSchedulable();
      refreshScheduled();
      setManualProgress((prev) => {
        const next = { ...prev };
        delete next[h.isoDate + h.name];
        return next;
      });
    }, 2200);
  };

  const regenerateMediaForHoliday = async (h: SchedulableHoliday) => {
    const scheduled = h.scheduledPosts ?? [];
    if (scheduled.length === 0) return;

    const postIds = scheduled.map((p) => p.postId);
    setRegeneratingPostIds((prev) => [...new Set([...prev, ...postIds])]);

    const errors: string[] = [];

    for (const sp of scheduled) {
      try {
        const res = await fetch(`/api/posts/${sp.postId}/regenerate-media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          errors.push(`${sp.platformLabel}: ${err.error || "Failed to regenerate"}`);
        }
      } catch (err) {
        errors.push(`${sp.platformLabel}: ${String(err)}`);
      }
    }

    setRegeneratingPostIds((prev) => prev.filter((id) => !postIds.includes(id)));

    if (errors.length > 0) {
      setManualProgress((prev) => ({
        ...prev,
        [h.isoDate + h.name]: {
          holidayName: h.name,
          status: "error",
          postsCreated: 0,
          errors,
        },
      }));
      setTimeout(() => {
        setManualProgress((prev) => {
          const next = { ...prev };
          delete next[h.isoDate + h.name];
          return next;
        });
      }, 4000);
    }

    await refreshSchedulable();
    await refreshScheduled();
  };

  // -------- derived --------
  const detectedPlatforms = ALL_PLATFORMS.filter(
    (p) =>
      (brandInfo.socialLinks && brandInfo.socialLinks[p]) ||
      (brandInfo.socialHandles && brandInfo.socialHandles[p] !== undefined)
  );
  const visiblePlatforms = editingHandles ? ALL_PLATFORMS : detectedPlatforms;

  // -------- early returns --------
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

  const termDisabled = !config.logoMediaId || config.holidaySets.length === 0;
  const termDisabledReason = !config.logoMediaId
    ? "Upload a company logo first."
    : config.holidaySets.length === 0
    ? "Select at least one holiday calendar."
    : null;

  // -------- main render --------
  const content = (
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
        <SaveStatusIndicator status={saveStatus} />
      </div>

      <CompanySelector
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onChange={handleCompanyChange}
      />

      {loadingConfig ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          <UpcomingSpecialDateCard
            post={upcomingPost}
            onPreview={(p) => setEditingPost(p)}
          />

          <CalendarSelectorStep
            availableSets={availableSets}
            selectedSetIds={config.holidaySets}
            onToggleSet={toggleSet}
          />

          {config.holidaySets.length > 0 && (
            <CategoryFilterStep
              enabledCategories={enabledCategories}
              onToggleCategory={toggleCategory}
            />
          )}

          {config.holidaySets.length > 0 && (
            <SpecialDatePickerStep
              allHolidays={allHolidays}
              enabledCategories={enabledCategories}
              excludedHolidays={config.excludedHolidays}
              selectedHoliday={selectedHoliday}
              onSelectHoliday={setSelectedHoliday}
              onToggleExclude={toggleHoliday}
            />
          )}

          <BrandKitSection
            tagline={config.tagline ?? null}
            dedication={config.dedication ?? null}
            website={brandInfo.website ?? null}
            contactEmail={brandInfo.contactEmail ?? null}
            contactPhone={brandInfo.contactPhone ?? null}
            contactWhatsapp={brandInfo.contactWhatsapp ?? null}
            socialLinks={brandInfo.socialLinks ?? null}
            socialHandles={brandInfo.socialHandles ?? null}
            logoPreview={logoPreview}
            uploadStage={uploadStage}
            scraping={scraping}
            scrapeStep={scrapeStep}
            scrapeError={scrapeError}
            editingHandles={editingHandles}
            visiblePlatforms={visiblePlatforms}
            onLogoUpload={handleLogoUpload}
            onRemoveLogo={handleRemoveLogo}
            onScrapeWebsite={handleScrapeWebsite}
            onUpdateConfig={updateConfig}
            onUpdateBrandInfo={updateBrandInfo}
            onHandleChange={handleHandleChange}
            onToggleEditingHandles={() => setEditingHandles((v) => !v)}
          />

          <TemplateStyleSection
            templateId={config.templateId ?? null}
            compositionId={config.compositionId ?? null}
            logoPosition={config.logoPosition ?? "top"}
            showWebsite={config.showWebsite ?? true}
            showHandles={config.showHandles ?? true}
            useStockBackgrounds={config.useStockBackgrounds ?? false}
            onUpdate={updateConfig}
          />

          <TermSchedulerCard
            disabled={termDisabled}
            disabledReason={termDisabledReason}
            alreadyScheduled={!!config.lastScheduledTermId}
            onOpenPreview={openTermModal}
          />

          <ManualSchedulerCard
            schedulable={schedulable}
            loading={loadingSchedulable}
            error={schedulableError}
            manualProgress={manualProgress}
            regeneratingPostIds={regeneratingPostIds}
            hasLogo={!!config.logoMediaId}
            onScheduleOne={scheduleOneHoliday}
            onRegenerateMedia={regenerateMediaForHoliday}
          />

          <ScheduledSpecialDatesList
            posts={scheduledPosts}
            loading={loadingScheduled}
            onPreview={(p) => setEditingPost(p)}
          />

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
    </div>
  );

  // Modals rendered regardless of layout branch
  const modals = (
    <>
      <GeneratePreviewModal
        isOpen={showPreviewModal}
        selectedHoliday={selectedHoliday}
        generatedMediaUrl={generatedMediaUrl}
        generating={generating}
        hasLogo={!!config.logoMediaId}
        onClose={() => setShowPreviewModal(false)}
        onGenerate={handleGenerateMedia}
      />
      <TermPreviewModal
        isOpen={showTermModal}
        termPlan={termPlan}
        loading={loadingTermPlan}
        error={termPlanError}
        committing={committing}
        commitProgress={commitProgress}
        onClose={() => setShowTermModal(false)}
        onCommit={handleCommitTerm}
      />
      <ScheduledPostEditModal
        isOpen={!!editingPost}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSaved={() => {
          refreshScheduled();
          refreshSchedulable();
        }}
        onDeleted={() => {
          setEditingPost(null);
          refreshScheduled();
          refreshSchedulable();
        }}
      />
    </>
  );

  if (!sidebarCompany) {
    return (
      <>
        {content}
        {modals}
      </>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <CompanySidebar company={sidebarCompany} />
      <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
        {content}
      </main>
      {modals}
    </div>
  );
}