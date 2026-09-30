// apps/web/src/app/(dashboard)/app-promotion/_components/PostCard.tsx
'use client'

import { useState } from 'react'
import { ExternalLink, Trash2, Send, Clock, Loader2, AlertCircle } from 'lucide-react'

export interface PromoPost {
  id: string
  seenItemId: string
  slotDate: string
  slotIndex: number
  scheduledFor: string | null
  postedAt: string | null
  updatedAt: string
  status: 'PENDING' | 'POSTED' | 'FAILED' | 'DELETED'
  facebookUrl: string | null
  errorMessage: string | null
  title: string
  type: string
  sourceUrl: string | null
  imageUrl: string | null
}

const TYPE_COLORS: Record<string, string> = {
  NEWS: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  TENDER: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  JOB: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  BURSARY: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
}

function formatSast(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  })
}

export function PostCard({
  post,
  onChanged,
}: {
  post: PromoPost
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function action(
    path: string,
    method: 'DELETE' | 'POST' | 'PATCH',
    body?: unknown
  ) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed (${res.status})`)
      }
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  async function reschedule() {
    const current = post.scheduledFor ? new Date(post.scheduledFor) : new Date()
    const proposed = window.prompt(
      'New time (ISO format, e.g. 2026-09-30T07:30:00.000Z)',
      current.toISOString()
    )
    if (!proposed) return
    await action(`/api/app-promotion/posts/${post.id}`, 'PATCH', {
      scheduledFor: proposed,
    })
  }

  const typeClass =
    TYPE_COLORS[post.type] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400'

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeClass}`}>
          {post.type}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)] line-clamp-2">
            {post.title}
          </p>

          {post.status === 'PENDING' && post.scheduledFor && (
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-tertiary)]">
              <Clock className="w-3 h-3" />
              <span>Scheduled {formatSast(post.scheduledFor)}</span>
            </div>
          )}

          {post.status === 'POSTED' && post.postedAt && (
            <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Clock className="w-3 h-3" />
              <span>Posted {formatSast(post.postedAt)}</span>
            </div>
          )}

          {post.status === 'FAILED' && (
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>Failed {formatSast(post.updatedAt)}</span>
              </div>
              {post.errorMessage && (
                <p className="text-xs text-[var(--text-tertiary)] pl-5 break-words">
                  {post.errorMessage}
                </p>
              )}
            </div>
          )}

          {post.status === 'DELETED' && (
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-tertiary)]">
              <Clock className="w-3 h-3" />
              <span>Deleted {formatSast(post.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
        {post.facebookUrl && (
          <a
            href={post.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View
          </a>
        )}
        {post.status === 'PENDING' && (
          <>
            <button
              onClick={() =>
                action(`/api/app-promotion/posts/${post.id}/publish-now`, 'POST')
              }
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Publish now
            </button>
            <button
              onClick={reschedule}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
            >
              <Clock className="w-3 h-3" />
              Reschedule
            </button>
          </>
        )}
        {post.status !== 'DELETED' && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Delete this post? If already published, it will be removed from Facebook.'
                )
              ) {
                action(`/api/app-promotion/posts/${post.id}`, 'DELETE')
              }
            }}
            disabled={busy}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}