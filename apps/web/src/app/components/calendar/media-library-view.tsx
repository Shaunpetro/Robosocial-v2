// apps/web/src/app/components/calendar/media-library-view.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Search,
  Grid,
  List,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Media {
  id: string;
  filename: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "GIF";
  size: number;
  createdAt: string;
}

interface MediaLibraryViewProps {
  companyId?: string;
  selectionMode?: boolean;
  selectedMedia?: string[];
  onSelectionChange?: (mediaIds: string[]) => void;
  maxSelection?: number;
}

export function MediaLibraryView({
  companyId,
  selectionMode = false,
  selectedMedia = [],
  onSelectionChange,
  maxSelection = 10,
}: MediaLibraryViewProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "IMAGE" | "VIDEO">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, [companyId, filterType]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (filterType !== "all") params.append("type", filterType);

      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        const mediaArray = Array.isArray(data) ? data : data.media || data.data || [];
        setMedia(mediaArray);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMedia(media.filter((m) => m.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Failed to delete media");
    } finally {
      setDeleting(null);
    }
  };

  const handleSelect = (id: string) => {
    if (!onSelectionChange) return;
    const isSelected = selectedMedia.includes(id);
    if (isSelected) {
      onSelectionChange(selectedMedia.filter((m) => m !== id));
    } else if (selectedMedia.length < maxSelection) {
      onSelectionChange([...selectedMedia, id]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
    if (!companyId) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const allValidTypes = [...validImageTypes, ...validVideoTypes, 'application/pdf'];

      if (!allValidTypes.includes(file.type)) {
        errors.push(`Invalid file type: ${file.name}`);
        continue;
      }

      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`File too large: ${file.name} (max 50MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", companyId);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

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
      await fetchMedia();
      setShowUpload(false);
    }

    if (errors.length > 0) {
      setUploadError(errors.join("; "));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (uploadedCount > 0) {
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  };

  const filteredMedia = media.filter((m) =>
    m.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            🖼️ Media Library
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {media.length} files
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg">
          {(["all", "IMAGE", "VIDEO"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                filterType === type
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {type === "all" ? "All" : type === "IMAGE" ? "Images" : "Videos"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-[var(--bg-primary)] shadow-sm"
                : "text-[var(--text-secondary)]"
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-[var(--bg-primary)] shadow-sm"
                : "text-[var(--text-secondary)]"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selectionMode && selectedMedia.length > 0 && (
        <div className="mb-4 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-between">
          <span className="text-sm text-brand-600 dark:text-brand-400">
            {selectedMedia.length} of {maxSelection} selected
          </span>
          <button
            onClick={() => onSelectionChange?.([])}
            className="text-sm text-brand-600 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 rounded-full bg-[var(--bg-secondary)] mb-4">
              <ImageIcon className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              No media found
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Upload your first image or video
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium"
            >
              Upload Media
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => selectionMode && handleSelect(item.id)}
                className={cn(
                  "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                  selectedMedia.includes(item.id)
                    ? "border-brand-500 ring-2 ring-brand-500/20"
                    : "border-transparent hover:border-[var(--border-hover)]"
                )}
              >
                {item.type === "VIDEO" ? (
                  <div className="absolute inset-0 bg-[var(--bg-secondary)] flex items-center justify-center">
                    <Video className="h-8 w-8 text-[var(--text-tertiary)]" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {selectionMode && (
                  <div
                    className={cn(
                      "absolute top-2 left-2 h-6 w-6 rounded-full border-2 flex items-center justify-center",
                      selectedMedia.includes(item.id)
                        ? "bg-brand-500 border-brand-500"
                        : "bg-white/80 border-[var(--border-default)]"
                    )}
                  >
                    {selectedMedia.includes(item.id) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                )}

                {!selectionMode && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deleting === item.id}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      {deleting === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}

                {item.type === "VIDEO" && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                    VIDEO
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => selectionMode && handleSelect(item.id)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer",
                  selectedMedia.includes(item.id)
                    ? "border-brand-500 bg-brand-500/5"
                    : "border-[var(--border-default)] hover:bg-[var(--bg-secondary)]"
                )}
              >
                {selectionMode && (
                  <div
                    className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                      selectedMedia.includes(item.id)
                        ? "bg-brand-500 border-brand-500"
                        : "border-[var(--border-default)]"
                    )}
                  >
                    {selectedMedia.includes(item.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                )}

                <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)]">
                  {item.type === "VIDEO" ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Video className="h-5 w-5 text-[var(--text-tertiary)]" />
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {item.filename}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">{item.type} • {formatSize(item.size)}</p>
                </div>

                {!selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 text-[var(--text-tertiary)] hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-elevated)] rounded-xl shadow-xl w-full max-w-lg mx-4 border border-[var(--border-default)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Upload Media
              </h2>
              <button
                onClick={() => setShowUpload(false)}
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
                    id="library-upload-input"
                  />
                  <label
                    htmlFor="library-upload-input"
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
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
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