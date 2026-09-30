// apps/web/src/app/(dashboard)/app-promotion/_components/EnableScreen.tsx
'use client'

import { useState } from 'react'
import { Megaphone, Loader2 } from 'lucide-react'

export function EnableScreen({
  companyId,
  onEnabled,
}: {
  companyId: string
  onEnabled: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enable() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/app-promotion/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed (${res.status})`)
      }
      onEnabled()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl p-8">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
          <Megaphone className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
          App Promotion
        </h1>
        <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
          Post curated South African opportunities and news to a Robosocial
          Facebook Page. Drives installs of the CSHAD iSentinel app.
        </p>

        <div className="space-y-3 mb-8 text-sm text-[var(--text-secondary)]">
          <p>
            <span className="text-[var(--text-primary)] font-medium">What it does: </span>
            Posts up to 3 items per slot, 3 times a day, on every other day.
          </p>
          <p>
            <span className="text-[var(--text-primary)] font-medium">Where it posts: </span>
            One designated Facebook Page, set on the server.
          </p>
          <p>
            <span className="text-[var(--text-primary)] font-medium">What you control: </span>
            You can reschedule, delete, or publish a post immediately from the
            App Promotion calendar. Captions are not editable.
          </p>
          <p>
            <span className="text-[var(--text-primary)] font-medium">How to pause: </span>
            Disable at any time. Scheduled posts stop, history is preserved.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={enable}
          disabled={busy}
          className="w-full px-4 py-3 rounded-xl bg-[var(--brand-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? 'Enabling...' : 'Enable App Promotion'}
        </button>
      </div>
    </div>
  )
}