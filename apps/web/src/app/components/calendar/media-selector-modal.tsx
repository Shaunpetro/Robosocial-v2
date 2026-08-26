// apps/web/src/app/components/calendar/media-selector-modal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Image as ImageIcon,
  Film,
  FileText,
  Search,
  Loader2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Media {
  id: string;
  filename: string;
  url: string;
  type?: "IMAGE" | "VIDEO" | "DOCUMENT";
  mimeType?: string;
  size?: number;
  createdAt?: string;
}

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  selectedMediaIds: string[];
  onSelectionConfirm: (mediaIds: string[], mediaItems: Media[]) => void;
  maxSelection?: number;
}

export function MediaSelectorModal({
  isOpen,
  onClose,
  companyId,
  selectedMediaIds,
  onSelectionConfirm,
  maxSelection = 10,
}: MediaSelectorModalProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelection, setLocalSelection] = useState<string[]>(selectedMediaIds);
  const [filterType, setFilterType] = useState<"ALL" | "IMAGE" | "VIDEO" | "DOCUMENT">("ALL");

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(selectedMediaIds);
      setUploadError(null);
      setUploadSuccess(null);
      fetchMedia();
    }
  }, [isOpen, companyId, selectedMediaIds]);

  const fetchMedia = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/media?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        const mediaArray = Array.isArray(data) ? data : data.media || data.data || [];
        setMedia(mediaArray);
      } else {
        console.error("Failed to fetch media:", await res.text());
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaType = (item: Media): "IMAGE" | "VIDEO" | "DOCUMENT" => {
    if (item.type) return item.type;
    if (item.mimeType?.startsWith("image/")) return "IMAGE";
    if (item.mimeType?.startsWith("video/")) return "VIDEO";
    return "DOCUMENT";
  };

  const toggleSelection = (mediaId: string) => {
    setLocalSelection((prev) => {
      if (prev.includes(mediaId)) {
        return prev.filter((id) => id !== mediaId);
      }
      if (prev.length >= maxSelection) {
        return prev;
      }
      return [...prev, mediaId];
    });
  };

  const handleConfirm = () => {
    const selectedItems = media.filter((m) => localSelection.includes(m.id));
    onSelectionConfirm(localSelection, selectedItems);
    onClose();
  };

  // Upload handlers
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
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const validDocTypes = ['application/pdf'];
      const allValidTypes = [...validImageTypes, ...validVideoTypes, ...validDocTypes];

      if (!allValidTypes.includes(file.type)) {
        errors.push(`Invalid file type: ${file.name}`);
        continue;
      }

      // Validate file size (50MB max)
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

    setIsUploading(false);

    if (uploadedCount > 0) {
      setUploadSuccess(`Successfully uploaded ${uploadedCount} file(s)`);
      await fetchMedia();
      setActiveTab("library");
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredMedia = media.filter((m) => {
    const matchesSearch = m.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const itemType = getMediaType(m);
    const matchesType = filterType === "ALL" || itemType === filterType;
    return matchesSearch && matchesType;
  });

  const getMediaIcon = (type: "IMAGE" | "VIDEO" | "DOCUMENT") => {
    switch (type) {
      case "VIDEO":
        return Film;
      case "DOCUMENT":
        return FileText;
      default:
        return ImageIcon;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg-elevated)] rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-4 border border-[var(--border-default)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Media Library
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              {localSelection.length} of {maxSelection} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab("library")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "library"
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <ImageIcon className="h-4 w-4 inline mr-2" />
              Library ({media.length})
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "upload"
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Upload
            </button>
          </div>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
            <Check className="h-4 w-4" />
            {uploadSuccess}
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "upload" ? (
          <div className="flex-1 p-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-12 transition-all h-full flex flex-col items-center justify-center",
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
                id="media-upload-input"
              />

              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-brand-500 mb-4" />
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    Uploading...
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {uploadProgress}% complete
                  </p>
                  <div className="w-64 h-2 bg-[var(--bg-tertiary)] rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="media-upload-input"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <div className={cn(
                    "p-4 rounded-full mb-4 transition-colors",
                    dragActive
                      ? "bg-brand-500/10"
                      : "bg-[var(--bg-secondary)]"
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
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-[var(--border-subtle)]">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["ALL", "IMAGE", "VIDEO", "DOCUMENT"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      filterType === type
                        ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    )}
                  >
                    {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase() + "s"}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-[var(--text-tertiary)]">
                  <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">No media found</p>
                  <p className="text-sm mt-1">
                    {media.length === 0
                      ? "Upload some media to get started"
                      : "Try adjusting your search or filter"}
                  </p>
                  {media.length === 0 && (
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                    >
                      <Upload className="h-4 w-4 inline mr-2" />
                      Upload Media
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((item) => {
                    const isSelected = localSelection.includes(item.id);
                    const itemType = getMediaType(item);
                    const Icon = getMediaIcon(itemType);
                    const isAtLimit = localSelection.length >= maxSelection && !isSelected;

                    return (
                      <button
                        key={item.id}
                        onClick={() => !isAtLimit && toggleSelection(item.id)}
                        disabled={isAtLimit}
                        className={cn(
                          "relative group aspect-square rounded-xl overflow-hidden border-2 transition-all text-left",
                          isSelected
                            ? "border-brand-500 ring-2 ring-brand-500/30"
                            : isAtLimit
                            ? "border-[var(--border-default)] opacity-50 cursor-not-allowed"
                            : "border-[var(--border-default)] hover:border-[var(--border-hover)]"
                        )}
                      >
                        {itemType === "IMAGE" ? (
                          <img
                            src={item.url}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : itemType === "VIDEO" ? (
                          <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)] relative">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                                <Film className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-secondary)] p-4">
                            <Icon className="h-12 w-12 text-[var(--text-tertiary)] mb-2" />
                            <span className="text-xs text-[var(--text-secondary)] text-center truncate w-full">
                              {item.filename}
                            </span>
                          </div>
                        )}

                        {/* Selection indicator */}
                        <div
                          className={cn(
                            "absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-brand-500 text-white"
                              : "bg-white/80 dark:bg-gray-800/80 border border-[var(--border-default)] opacity-0 group-hover:opacity-100"
                          )}
                        >
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>

                        {/* Filename overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-2 pt-6">
                          <p className="text-xs text-white truncate font-medium">
                            {item.filename}
                          </p>
                          {item.size && (
                            <p className="text-xs text-white/70">
                              {formatFileSize(item.size)}
                            </p>
                          )}
                        </div>

                        {/* Hover overlay */}
                        {!isAtLimit && !isSelected && (
                          <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/10 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocalSelection([])}
              disabled={localSelection.length === 0}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear Selection
            </button>
            {localSelection.length > 0 && (
              <span className="text-sm text-[var(--text-tertiary)]">
                {localSelection.length} item{localSelection.length !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={localSelection.length === 0}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                localSelection.length === 0
                  ? "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed"
                  : "bg-brand-500 hover:bg-brand-600"
              )}
            >
              Confirm Selection ({localSelection.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}