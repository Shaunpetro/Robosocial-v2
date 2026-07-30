// apps/web/src/app/(dashboard)/companies/[id]/special-dates/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Save, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface HolidaySet {
  id: string;
  label: string;
}

interface Config {
  enabled: boolean;
  holidaySets: string[];
}

export default function CompanySpecialDatesPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const [config, setConfig] = useState<Config>({ enabled: false, holidaySets: [] });
  const [availableSets, setAvailableSets] = useState<HolidaySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/special-dates`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data.config);
          setAvailableSets(data.availableSets);
        }
      } catch (error) {
        console.error("Failed to fetch special dates config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [companyId]);

  const toggleSet = (setId: string) => {
    setConfig(prev => ({
      ...prev,
      holidaySets: prev.holidaySets.includes(setId)
        ? prev.holidaySets.filter(s => s !== setId)
        : [...prev.holidaySets, setId],
    }));
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Special Dates</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Automatically generate posts for awareness days and public holidays
          </p>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] mb-6">
        <div>
          <p className="font-medium text-[var(--text-primary)]">Enable Special Dates</p>
          <p className="text-sm text-[var(--text-tertiary)]">
            Weekly generation of posts for upcoming holidays based on your selection
          </p>
        </div>
        <button
          onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
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

      {/* Holiday set selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Select Holiday Sets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableSets.map(set => (
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
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
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
  );
}