// apps/web/src/app/(dashboard)/special-dates/_components/ScheduledPostEditModal.tsx

"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduledSpecialDatePost } from "./types";

interface Props {
  post: ScheduledSpecialDatePost | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

function isoForInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ScheduledPostEditModal({
  post,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [regeneratingImage, setRegeneratingImage] = useState(false);
  const [regeneratingCaption, setRegeneratingCaption] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!post) return;
    setContent(post.content);
    setHashtags(post.hashtags || []);
    setHashtagInput("");
    setScheduledFor(isoForInput(post.scheduledFor));
    setStatus(post.status);
    setMediaUrl(post.mediaUrl);
    setError(null);
    setSuccess(null);
  }, [post]);

  if (!isOpen || !post) return null;

  const readOnly = post.status === "PUBLISHED";
  const captionOver = content.length > post.captionMax;

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleSave = async () => {
    if (readOnly) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          hashtags,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
          status,
        }),
      });
      if (res.ok) {
        flashSuccess("Saved");
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to save");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateImage = async () => {
    setRegeneratingImage(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.postId}/regenerate-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setMediaUrl(data.url || mediaUrl);
        flashSuccess("New image generated");
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to regenerate image");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRegeneratingImage(false);
    }
  };

  const handleRegenerateCaption = async () => {
    setRegeneratingCaption(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.postId}/regenerate-caption`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || content);
        setHashtags(data.hashtags || []);
        flashSuccess("New short caption written");
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to regenerate caption");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRegeneratingCaption(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this scheduled post? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.postId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to delete");
        setDeleting(false);
      }
    } catch (err) {
      setError(String(err));
      setDeleting(false);
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.replace(/^#/, "").trim();
    if (!tag) return;
    if (!hashtags.includes(tag)) setHashtags((prev) => [...prev, tag]);
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">
              {post.topic}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {post.platformLabel} · {post.status}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {readOnly && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              This post has already been published. Editing is disabled.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="w-full aspect-[1200/630] rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden flex items-center justify-center">
                {mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt={post.topic} className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-[var(--text-tertiary)]" />
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={handleRegenerateImage}
                  disabled={regeneratingImage || readOnly}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition-colors"
                >
                  {regeneratingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {regeneratingImage ? "Generating..." : "Regenerate image"}
                </button>
                {mediaUrl && (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Full size
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Caption ({content.length} / {post.captionMax})
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCaption}
                    disabled={regeneratingCaption || readOnly}
                    title="Rewrite as a short two-line caption"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 disabled:opacity-50 transition-colors"
                  >
                    {regeneratingCaption ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {regeneratingCaption ? "Rewriting..." : "Regenerate caption"}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={readOnly}
                  rows={8}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border bg-[var(--bg-primary)] text-sm resize-none disabled:opacity-60",
                    captionOver
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-[var(--border-default)] focus:ring-brand-500/50"
                  )}
                />
                {captionOver && (
                  <p className="text-xs text-red-600 mt-1">
                    Caption exceeds the platform limit by {content.length - post.captionMax}{" "}
                    characters. Click <strong>Regenerate caption</strong> to rewrite it as a
                    short two-line caption.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Hashtags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)]"
                    >
                      #{tag}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => removeHashtag(tag)}
                          className="text-[var(--text-tertiary)] hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {hashtags.length === 0 && (
                    <span className="text-xs text-[var(--text-tertiary)]">No hashtags</span>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addHashtag();
                        }
                      }}
                      placeholder="Add hashtag and press Enter"
                      className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm"
                    />
                    <button
                      type="button"
                      onClick={addHashtag}
                      className="px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)]"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Scheduled for
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm disabled:opacity-60"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-[var(--border-subtle)]">
            <button
              onClick={handleDelete}
              disabled={deleting || readOnly}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete post
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Close
              </button>
              {!readOnly && (
                <button
                  onClick={handleSave}
                  disabled={saving || captionOver}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}