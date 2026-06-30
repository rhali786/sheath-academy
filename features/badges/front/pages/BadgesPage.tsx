'use client'

import { useEffect, useState } from 'react'
import { Trophy, AlertCircle, Star, Plus, X } from 'lucide-react'
import { badgesApi } from '@/features/badges/front/services/api'
import type { AwardTransition } from '@/features/badges/front/services/api'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import type { BadgeAward, BadgeCollectionItem, BadgeDefinition } from '@/features/badges/types'

interface BadgeActions {
  learnerId: string
  onCreateAward: (badgeId: string) => Promise<void>
  onAdvance: (awardId: string, next: AwardTransition) => Promise<void>
  onRevoke: (awardId: string) => Promise<void>
  onAddEvidence: (awardId: string, evidenceId: string) => Promise<void>
  onRemoveEvidence: (awardId: string, linkId: string) => Promise<void>
}

/** Returns the next lifecycle transition (and its label), or null when earned/terminal. */
function nextTransition(award: BadgeAward): { next: AwardTransition; label: string } | null {
  if (award.approvedAt) return null
  if (award.status === 'draft') return { next: 'submitted', label: 'Submit' }
  if (award.status === 'submitted') return { next: 'verified', label: 'Verify' }
  if (award.status === 'verified') return { next: 'approved', label: 'Approve' }
  return null
}

function BadgeEmblem({ emblemKey, earned }: { emblemKey: string; earned: boolean }) {
  // text/lucide fallback — the design target is real SVG art keyed by emblemKey
  return (
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 transition-all ${
        earned
          ? 'bg-forest-100 border-forest-400 text-forest-800 shadow-md'
          : 'bg-slate-100 border-slate-200 text-slate-300 grayscale'
      }`}
      aria-hidden="true"
    >
      <Star className="w-7 h-7" />
    </div>
  )
}

function AwardManagement({ definition, award, actions }: { definition: BadgeDefinition; award: BadgeAward | null; actions: BadgeActions }) {
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)
  const [evidenceId, setEvidenceId] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    try { await fn() } finally { setBusy(false) }
  }

  if (!award) {
    return (
      <button
        type="button"
        data-testid={`start-award-${definition.id}`}
        disabled={busy}
        onClick={() => run(() => actions.onCreateAward(definition.id))}
        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-forest-700 hover:bg-forest-50 disabled:opacity-50"
      >
        <Plus className="w-3 h-3" /> Start award
      </button>
    )
  }

  if (confirmRevoke) {
    return (
      <InlineConfirm
        message="Remove this award?"
        detail={definition.title}
        confirmLabel="Remove"
        onConfirm={() => run(async () => { await actions.onRevoke(award.id); setConfirmRevoke(false) })}
        onCancel={() => setConfirmRevoke(false)}
      />
    )
  }

  const transition = nextTransition(award)

  return (
    <div className="w-full space-y-2 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="badge-amber text-xs capitalize">{award.approvedAt ? 'approved' : award.status}</span>
        <div className="flex items-center gap-1">
          {transition && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => actions.onAdvance(award.id, transition.next))}
              className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-forest-700 hover:bg-forest-50 disabled:opacity-50"
            >
              {transition.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Remove award"
            onClick={() => setConfirmRevoke(true)}
            className="text-slate-400 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {(award.evidence ?? []).length > 0 && (
        <ul className="space-y-0.5">
          {(award.evidence ?? []).map(link => (
            <li key={link.id} className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="truncate">{link.evidenceId}</span>
              <button
                type="button"
                aria-label="Unlink evidence"
                disabled={busy}
                onClick={() => run(() => actions.onRemoveEvidence(award.id, link.id))}
                className="text-slate-400 hover:text-red-600 disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEvidence ? (
        <div className="flex items-center gap-1">
          <input
            aria-label="Evidence ID"
            type="text"
            value={evidenceId}
            onChange={e => setEvidenceId(e.target.value)}
            placeholder="Evidence ID"
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
          />
          <button
            type="button"
            disabled={busy || !evidenceId.trim()}
            onClick={() => run(async () => { await actions.onAddEvidence(award.id, evidenceId.trim()); setEvidenceId(''); setShowEvidence(false) })}
            className="rounded-lg bg-forest-900 px-2 py-1 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50"
          >
            Link evidence
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowEvidence(true)}
          className="flex items-center gap-1 text-xs text-forest-700 hover:text-forest-900"
        >
          <Plus className="w-3 h-3" /> Add evidence
        </button>
      )}
    </div>
  )
}

function BadgeCard({ item, actions }: { item: BadgeCollectionItem; actions?: BadgeActions }) {
  const { definition, award, isEarned } = item
  const earnedDate = award?.approvedAt
    ? new Date(award.approvedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null

  const ariaLabel = isEarned
    ? `${definition.title}, earned${earnedDate ? ` ${earnedDate}` : ''}`
    : `${definition.title}, not yet earned — ${definition.criteria}`

  return (
    <div
      data-testid={isEarned ? `badge-earned-${definition.id}` : `badge-locked-${definition.id}`}
      aria-label={ariaLabel}
      className={`card p-4 flex flex-col items-center gap-3 text-center transition-all ${
        isEarned ? '' : 'opacity-75'
      }`}
    >
      <BadgeEmblem emblemKey={definition.emblemKey} earned={isEarned} />

      <div className="space-y-1">
        <p className={`text-sm font-semibold ${isEarned ? 'text-slate-900' : 'text-slate-500'}`}>
          {definition.title}
        </p>

        {isEarned ? (
          <div className="space-y-0.5">
            <span className="badge-green text-xs">Earned</span>
            {earnedDate && <p className="text-xs text-slate-400">{earnedDate}</p>}
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400">Not yet earned</p>
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5 text-left">
              <p className="font-medium text-slate-600 mb-0.5">How to earn this</p>
              <p>{definition.criteria}</p>
            </div>
          </div>
        )}
      </div>

      {actions && actions.learnerId && (
        <div className="w-full border-t border-slate-100 pt-2">
          <AwardManagement definition={definition} award={award} actions={actions} />
        </div>
      )}
    </div>
  )
}

function EmptyBadgeState({ starterDefs }: { starterDefs: BadgeDefinition[] }) {
  return (
    <div data-testid="badges-empty" className="space-y-6">
      <div className="card p-6 text-center space-y-3">
        <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
        <div>
          <p className="font-semibold text-slate-700">No badges yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s what your kids can work toward:
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {starterDefs.map(def => (
          <BadgeCard
            key={def.id}
            item={{ definition: def, award: null, isEarned: false }}
          />
        ))}
      </div>
    </div>
  )
}

export function BadgesPage() {
  const { householdProfile, studentProfiles } = useHousehold()
  const { selectedChildId } = useLearner()
  const [collection, setCollection] = useState<BadgeCollectionItem[]>([])
  const [platformBadgesEnabled, setPlatformBadgesEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const householdId = householdProfile?.id ?? ''
  const learnerId = selectedChildId ?? ''
  const learnerName = studentProfiles?.find(p => p.id === learnerId)?.name ?? null

  async function reloadCollection() {
    const res = await badgesApi.getCollection(householdId, learnerId)
    setCollection(res.data)
  }

  useEffect(() => {
    if (!householdId) return
    Promise.all([
      badgesApi.getCollection(householdId, learnerId),
      badgesApi.getSettings(householdId),
    ]).then(([collectionRes, settingsRes]) => {
      setCollection(collectionRes.data)
      setPlatformBadgesEnabled(settingsRes.data.platformBadgesEnabled)
      setLoading(false)
    }).catch(() => {
      setError('Could not load badges. Please try again.')
      setLoading(false)
    })
  }, [householdId, learnerId])

  const actions: BadgeActions = {
    learnerId,
    onCreateAward: async (badgeId) => {
      await badgesApi.createAward(learnerId, badgeId)
      setSuccess('Award started')
      await reloadCollection()
    },
    onAdvance: async (awardId, next) => {
      await badgesApi.advanceAward(awardId, next)
      setSuccess('Award updated')
      await reloadCollection()
    },
    onRevoke: async (awardId) => {
      await badgesApi.deleteAward(awardId)
      setSuccess('Award removed')
      await reloadCollection()
    },
    onAddEvidence: async (awardId, evidenceId) => {
      await badgesApi.addEvidence(awardId, evidenceId)
      setSuccess('Evidence linked')
      await reloadCollection()
    },
    onRemoveEvidence: async (awardId, linkId) => {
      await badgesApi.removeEvidence(awardId, linkId)
      setSuccess('Evidence unlinked')
      await reloadCollection()
    },
  }

  async function handleToggleSettings() {
    const next = !platformBadgesEnabled
    setPlatformBadgesEnabled(next)
    await badgesApi.setSettings(next)
    setSuccess('Settings updated')
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-testid="badges-loading">
        <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="card h-40 bg-slate-100" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-testid="badges-error">
        <div className="card p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (collection.length === 0) {
    return (
      <div className="page-shell space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-forest-700" />
          <h1 className="page-title">Badges</h1>
        </div>
        <EmptyBadgeState starterDefs={[]} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-forest-700" />
          <h1 className="page-title mb-0">Badges</h1>
          {learnerName && (
            <span data-testid="badges-learner-name" className="text-sm text-slate-500 font-normal">
              — {learnerName}
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            aria-label="Platform badges enabled"
            checked={platformBadgesEnabled}
            onChange={handleToggleSettings}
            className="rounded border-slate-300"
          />
          Platform badges
        </label>
      </div>

      {success && (
        <InlineSuccess message={success} onDismiss={() => setSuccess(null)} />
      )}

      <div
        data-testid="badges-trophy-case"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
      >
        {collection.map(item => (
          <BadgeCard key={item.definition.id} item={item} actions={actions} />
        ))}
      </div>
    </div>
  )
}
