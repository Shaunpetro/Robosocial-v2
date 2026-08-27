// apps/web/src/app/(dashboard)/media/page.tsx

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ImageIcon,
  Building2,
  Filter,
  Search,
  Grid3X3,
  List,
  Trash2,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  ArrowRight,
  FolderOpen,
  Upload,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/app/contexts/company-context";

import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaDetailModal } from "@/components/media/MediaDetailModal";
import { MediaStats } from "@/components/media/MediaStats";

// ============================================
// TYPES
// ============================================

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | "GIF";
  mimeType: string | null;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  pillarIds: string[];
  tags: string[];
  contentTypes: string[];
  isUsed: boolean;
  usedAt: string | null;
  usedInPostId: string | null;
  expiresAt: string | null;
  autoSelect: boolean;
  priority: number;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  _count?: {
    media: number;
  };
}

interface GlobalStats {
  total: number;
  available: number;
  used: number;
  expiring: number;
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_OPTIONS = [
  { value: "all", label: "All Media", icon: Grid3X3 },
  { value: "available", label: "Available", icon: CheckCircle2 },
  { value: "expiring", label: "Expiring Soon", icon: AlertTriangle },
  { value: "used", label: "Used", icon: Clock },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "IMAGE", label: "Images" },
  { value: "VIDEO", label: "Videos" },
  { value: "GIF", label: "GIFs" },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function GlobalMediaPage() {
  const searchParams = useSearchParams();
  const { selectedCompanyId } = useCompany();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [companyMediaCounts, setCompanyMediaCounts] = useState<Record<string, { total: number; expiring: number }>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [viewMode, setViewMode] = useState<"companies" | "all">("companies");
  const [showStats, setShowStats] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync companyFilter from URL or selectedCompanyId
  useEffect(() => {
    const urlCompanyId = searchParams.get("companyId");
    if (urlCompanyId) {
      setCompanyFilter(urlCompanyId);
      setViewMode("all");
    } else if (selectedCompanyId) {
      setCompanyFilter(selectedCompanyId);
      setViewMode("all");
    } else {
      setCompanyFilter("all");
      setViewMode("companies");
    }
  }, [searchParams, selectedCompanyId]);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  }, []);

  const fetchMedia = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (companyFilter !== "all") params.set("companyId", companyFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/media?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses
        const mediaList = Array.isArray(data) ? data : data.media || data.data || [];
        setMedia(mediaList);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, typeFilter, companyFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/media/stats");
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.overview.total,
          available: data.overview.available,
          used: data.overview.used,
          expiring: data.overview.expiring,
        });
        if (data.companyBreakdown) {
          const counts: Record<string, { total: number; expiring: number }> = {};
          for (const company of data.companyBreakdown) {
            counts[company.id] = { total: company.mediaCount, expiring: company.expiring || 0 };
          }
          setCompanyMediaCounts(counts);
        }
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchExpiringCounts = useCallback(async () => {
    try {
      const response = await fetch("/api/media?status=expiring");
      if (response.ok) {
        const data = await response.json();
        const mediaList = Array.isArray(data) ? data : data.media || [];
        const expiringCounts: Record<string, number> = {};
        for (const m of mediaList) {
          const companyId = m.company?.id || m.companyId;
          if (companyId) expiringCounts[companyId] = (expiringCounts[companyId] || 0) + 1;
        }
        setCompanyMediaCounts((prev) => {
          const updated = { ...prev };
          for (const [companyId, count] of Object.entries(expiringCounts)) {
            if (updated[companyId]) updated[companyId].expiring = count;
            else updated[companyId] = { total: 0, expiring: count };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to fetch expiring counts:", error);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchStats();
    fetchExpiringCounts();
  }, [fetchCompanies, fetchStats, fetchExpiringCounts]);

  useEffect(() => {
    if (viewMode === "all") fetchMedia();
  }, [viewMode, fetchMedia]);

  // Upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!companyFilter || companyFilter === "all") return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf'
      ];
      if (!validTypes.includes(file.type)) {
        errors.push(`Invalid file type: ${file.name}`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`File too large: ${file.name} (max 50MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", companyFilter);
        const res = await fetch("/api/media/upload", { method: "POST", body: formData });
        if (res.ok) {
          uploadedCount++;
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        } else {
          const errorData = await res.json().catch(() => ({ error: "Upload failed" }));
          errors.push(`${file.name}: ${errorData.error || "Upload failed"}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        errors.push(`${file.name}: Network error`);
      }
    }

    setUploading(false);
    if (uploadedCount > 0) {
      setUploadSuccess(`Successfully uploaded ${uploadedCount} file(s)`);
      fetchMedia(false);
      fetchStats();
      setTimeout(() => setUploadSuccess(null), 3000);
    }
    if (errors.length > 0) setUploadError(errors.join("; "));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const handleSelectAll = (ids: string[]) => setSelectedIds(ids);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} media item(s)?`);
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", mediaIds: selectedIds }),
      });
      if (response.ok) {
        setSelectedIds([]);
        fetchMedia(false);
        fetchStats();
      } else {
        alert("Failed to delete some media items");
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
      alert("Failed to delete media");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewMedia = (media: MediaItem) => {
    setSelectedMedia(media);
    setShowDetailModal(true);
  };

  const handleDeleteMedia = async (media: MediaItem) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${media.filename}"?`);
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/media/${media.id}?force=true`, { method: "DELETE" });
      if (response.ok) {
        fetchMedia(false);
        fetchStats();
      } else {
        alert("Failed to delete media");
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
      alert("Failed to delete media");
    }
  };

  const handleMediaUpdate = (updatedMedia: MediaItem) => {
    setMedia((prev) => prev.map((m) => (m.id === updatedMedia.id ? updatedMedia : m)));
    setSelectedMedia(updatedMedia);
  };

  const handleMediaDelete = (mediaId: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    setSelectedIds((prev) => prev.filter((id) => id !== mediaId));
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                <ImageIcon className="w-7 h-7 text-brand-500" />
                Media Library
              </h1>
              <p className="text-[var(--text-tertiary)] mt-1">
                Manage media across all companies
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-2 rounded-lg border transition-colors ${
                  showStats
                    ? "bg-brand-500/10 border-brand-500"
                    : "border-[var(--border-default)] hover:border-brand-500/50"
                }`}
                title="Toggle statistics"
              >
                <BarChart3 className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>

              <button
                onClick={() => {
                  fetchStats();
                  fetchExpiringCounts();
                  if (viewMode === "all") fetchMedia(false);
                }}
                disabled={refreshing}
                className="p-2 rounded-lg border border-[var(--border-default)] hover:border-brand-500/50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-[var(--text-secondary)] ${refreshing ? "animate-spin" : ""}`} />
              </button>

              {/* Upload button */}
              <button
                onClick={() => {
                  if (companyFilter === "all") {
                    alert("Please select a company first");
                    return;
                  }
                  setShowUploadModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors font-medium"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
                <p className="text-sm text-[var(--text-tertiary)]">Total Media</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
                <p className="text-sm text-[var(--text-tertiary)]">Available</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.expiring}</p>
                <p className="text-sm text-[var(--text-tertiary)]">Expiring Soon</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.used}</p>
                <p className="text-sm text-[var(--text-tertiary)]">Used</p>
              </div>
            </div>
          )}

          {/* View mode tabs */}
          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={() => setViewMode("companies")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === "companies"
                  ? "bg-brand-500 text-white"
                  : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              By Company
            </button>
            <button
              onClick={() => {
                setViewMode("all");
                if (!companyFilter || companyFilter === "all") {
                  if (selectedCompanyId) setCompanyFilter(selectedCompanyId);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === "all"
                  ? "bg-brand-500 text-white"
                  : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              All Media
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {showStats && (
          <div className="mb-6">
            <MediaStats />
          </div>
        )}

        {/* Companies view */}
        {viewMode === "companies" && (
          <div className="space-y-6">
            {stats && stats.expiring > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      {stats.expiring} media item{stats.expiring !== 1 ? "s" : ""} expiring soon
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)]">Across all companies</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setViewMode("all");
                    setStatusFilter("expiring");
                    setCompanyFilter("all");
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors text-sm"
                >
                  View All
                </button>
              </div>
            )}

            {companies.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
                <p className="text-[var(--text-tertiary)]">No companies found</p>
                <Link
                  href="/companies"
                  className="mt-4 inline-block px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                >
                  Go to Companies
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((company) => {
                  const counts = companyMediaCounts[company.id] || { total: 0, expiring: 0 };
                  return (
                    <Link
                      key={company.id}
                      href={`/media?companyId=${company.id}`}
                      className="group p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-brand-500/50 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {company.logoUrl ? (
                          <Image src={company.logoUrl} alt={company.name} width={40} height={40} className="rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-brand-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {company.name}
                          </h3>
                          <p className="text-sm text-[var(--text-tertiary)]">
                            {counts.total || company._count?.media || 0} media item{counts.total !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-brand-500 transition-colors" />
                      </div>
                      {counts.expiring > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          {counts.expiring} expiring soon
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All media view */}
        {viewMode === "all" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by filename or tag..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        statusFilter === option.value
                          ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showFilters ? "bg-brand-500/10 border-brand-500" : "border-[var(--border-default)] hover:border-brand-500/50"
                }`}
              >
                <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-tertiary)]">Company:</span>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)]"
                  >
                    <option value="all">All Companies</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-tertiary)]">Type:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)]"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                {(typeFilter !== "all" || companyFilter !== "all" || search || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setTypeFilter("all");
                      setCompanyFilter("all");
                      setStatusFilter("all");
                      setSearch("");
                    }}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-brand-500/10 border border-brand-500/20">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            <MediaGrid
              media={media}
              loading={loading}
              selectable
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onView={handleViewMedia}
              onEdit={handleViewMedia}
              onDelete={handleDeleteMedia}
              showCompany
              emptyMessage={
                search || statusFilter !== "all" || typeFilter !== "all" || companyFilter !== "all"
                  ? "No media matches your filters"
                  : "No media found for this company. Click Upload to add media."
              }
            />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <MediaDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMedia(null);
        }}
        media={selectedMedia}
        pillars={[]}
        onUpdate={handleMediaUpdate}
        onDelete={handleMediaDelete}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-elevated)] rounded-xl shadow-xl w-full max-w-lg mx-4 border border-[var(--border-default)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Upload Media
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {uploading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-brand-500 mb-4" />
                  <p className="text-[var(--text-primary)]">Uploading...</p>
                  <div className="w-64 h-2 bg-[var(--bg-tertiary)] rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center",
                    dragActive
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-[var(--border-default)] hover:border-[var(--border-hover)]"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime,application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="global-media-upload-input"
                  />
                  <label
                    htmlFor="global-media-upload-input"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div className={cn(
                      "p-4 rounded-full mb-4 transition-colors",
                      dragActive ? "bg-brand-500/10" : "bg-[var(--bg-secondary)]"
                    )}>
                      <Upload className={cn(
                        "h-10 w-10 transition-colors",
                        dragActive ? "text-brand-500" : "text-[var(--text-tertiary)]"
                      )} />
                    </div>
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                      {dragActive ? "Drop files here" : "Click to upload"}
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">
                      or drag and drop files here
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-secondary)]">
                        JPG, PNG, GIF, WebP
                      </span>
                      <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-secondary)]">
                        MP4, WebM
                      </span>
                      <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-secondary)]">
                        PDF
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">
                      Maximum file size: 50MB
                    </p>
                  </label>
                </div>
              )}

              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{uploadError}</span>
                </div>
              )}
              {uploadSuccess && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {uploadSuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}