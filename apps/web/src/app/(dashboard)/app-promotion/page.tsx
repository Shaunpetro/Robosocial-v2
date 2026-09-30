// apps/web/src/app/(dashboard)/app-promotion/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'
import { EnableScreen } from './_components/EnableScreen'
import { PostCard, type PromoPost } from './_components/PostCard'

interface StatusResponse {
  enabled: boolean
  hostPage: { name: string | null; id: string } | null
  posts: PromoPost[]
  upcoming: Array<{
    date: string
    slotIndex: number
    startUtc: string
    endUtc: string
  }>
}

function AppPromotionInner() {
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')
  const hostCompanyId = process.env.NEXT_PUBLIC_APP_PROMOTION_HOST_COMPANY_ID
  const isHost = !!companyId && !!hostCompanyId && companyId === hostCompanyId

  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disabling, setDisabling] = useState(false)

  async function load() {
    if (!companyId || !isHost) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/app-promotion/status?companyId=${companyId}`)
      if (res.status === 403) {
        throw new Error('App Promotion is not available for this account.')
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed (${res.status})`)
      }
      setStatus(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, isHost])

  async function disable() {
    if (!companyId) return
    if (!window.confirm('Disable App Promotion? Scheduled posts will stop. History is preserved.')) return
    setDisabling(true)
    try {
      await fetch('/api/app-promotion/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      await load()
    } finally {
      setDisabling(false)
    }
  }

  if (!companyId || !isHost) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-6 h-6 text-[var(--text-tertiary)]" />
        </div>
        <h1 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          App Promotion
        </h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          This feature is not available for the selected company.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PageLoader message="Loading App Promotion..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    )
  }

  if (!status) return null

  if (!status.enabled) {
    return <EnableScreen companyId={companyId} onEnabled={load} />
  }

  const upcomingPosts = status.posts.filter((p) => p.status === 'PENDING')
  const pastPosts = status.posts.filter((p) => p.status !== 'PENDING').slice(0, 20)

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              App Promotion
            </h1>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            Posting to:{' '}
            {status.hostPage?.name ? (
              <span className="text-[var(--text-primary)]">{status.hostPage.name}</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                Host Page not configured
              </span>
            )}
          </p>
        </div>
        <button
          onClick={disable}
          disabled={disabling}
          className="px-3 py-2 text-sm rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
        >
          {disabling ? 'Disabling...' : 'Disable'}
        </button>
      </header>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-3">
          Scheduled ({upcomingPosts.length})
        </h2>
        {upcomingPosts.length === 0 ? (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-6 text-center text-sm text-[var(--text-tertiary)]">
            No posts scheduled. The next slot will populate on the next cycle.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingPosts.map((p) => (
              <PostCard key={p.id} post={p} onChanged={load} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-3">
          Recent activity
        </h2>
        {pastPosts.length === 0 ? (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-6 text-center text-sm text-[var(--text-tertiary)]">
            No activity yet.
          </div>
        ) : (
          <div className="space-y-2">
            {pastPosts.map((p) => (
              <PostCard key={p.id} post={p} onChanged={load} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <PageLoader message="Loading..." />
        </div>
      }
    >
      <AppPromotionInner />
    </Suspense>
  )
}