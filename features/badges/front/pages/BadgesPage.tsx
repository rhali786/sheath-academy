'use client'

import { useEffect, useState } from 'react'
import { Trophy, AlertCircle, Star, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { badgesApi } from '@/features/badges/front/services/api'
import type { AwardTransition, BadgeDefinitionInput } from '@/features/badges/front/services/api'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import type { BadgeAward, BadgeCollectionItem, BadgeDefinition, VerificationRequirement } from '@/features/badges/types'
import type { GradeBand } from '@/features/gradebook/types'

const GRADE_BANDS: { value: GradeBand; label: string }[] = [
  { value: 'g1_4', label: 'G1–4' },
  { value: 'g5_8', label: 'G5–8' },
  { value: 'g9_12', label: 'G9–12' },
]
const VERIFICATION_OPTIONS: VerificationRequirement[] = ['none', 'parent', 'external']

interface DefinitionActions {
  onUpdate: (id: string, values: BadgeDefinitionInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function BadgeDefinitionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: BadgeDefinitionInput
  submitLabel: string
  onSubmit: (values: BadgeDefinitionInput) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [criteria, setCriteria] = useState(initial?.criteria ?? '')
  const [emblemKey, setEmblemKey] = useState(initial?.emblemKey ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [gradeBands, setGradeBands] = useState<GradeBand[]>(initial?.gradeBands ?? [])
  const [verificationRequirement, setVerificationRequirement] = useState<VerificationRequirement>(initial?.verificationRequirement ?? 'none')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleBand(band: GradeBand) {
    setGradeBands(prev => prev.includes(band) ? prev.filter(b => b !== band) : [...prev, band])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim() || !description.trim() || !criteria.trim() || !emblemKey.trim()) {
      setError('Title, description, criteria, and emblem key are required.')
      return
    }
    setPending(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        criteria: criteria.trim(),
        emblemKey: emblemKey.trim(),
        imageUrl: imageUrl.trim() || null,
        gradeBands,
        verificationRequirement,
        visibility: 'household',
        enabled,
      })
    } catch {
      setError('Could not save. Please try again.')
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left">
      <input aria-label="Badge title" type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700" />
      <input aria-label="Badge description" type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700" />
      <input aria-label="Badge criteria" type="text" placeholder="How to earn this" value={criteria} onChange={e => setCriteria(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700" />
      <input aria-label="Badge emblem key" type="text" placeholder="Emblem key (e.g. quran-champion)" value={emblemKey} onChange={e => setEmblemKey(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700" />
      <input aria-label="Badge image URL" type="text" placeholder="Image URL (optional — overrides the emblem icon)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Grade bands:</span>
        {GRADE_BANDS.map(b => (
          <label key={b.value} className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" aria-label={`Grade band ${b.label}`} checked={gradeBands.includes(b.value)} onChange={() => toggleBand(b.value)} className="rounded border-slate-300" />
            {b.label}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1 text-xs text-slate-600">
          Verification
          <select aria-label="Verification requirement" value={verificationRequirement} onChange={e => setVerificationRequirement(e.target.value as VerificationRequirement)} className="rounded border border-slate-300 px-1 py-0.5 text-xs capitalize">
            {VERIFICATION_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" aria-label="Badge enabled" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="rounded border-slate-300" />
          Enabled
        </label>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={pending} className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={pending} className="rounded-lg bg-forest-900 px-3 py-1 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50">{pending ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  )
}

interface BadgeActions {
  learnerId: string
  onCreateAward: (badgeId: string) => Promise<void>
  onAdvance: (awardId: string, next: AwardTransition) => Promise<void>
  onRevoke: (awardId: string) => Promise<void>
  onAddEvidence: (awardId: string, evidenceId: string) => Promise<void>
  onRemoveEvidence: (awardId: string, linkId: string) => Promise<void>
  onUpdateProgress: (awardId: string, current: number | null, target: number | null) => Promise<void>
}

/** Returns the next lifecycle transition (and its label), or null when earned/terminal. */
function nextTransition(award: BadgeAward): { next: AwardTransition; label: string } | null {
  if (award.approvedAt) return null
  if (award.status === 'draft') return { next: 'submitted', label: 'Submit' }
  if (award.status === 'submitted') return { next: 'verified', label: 'Verify' }
  if (award.status === 'verified') return { next: 'approved', label: 'Approve' }
  return null
}

function BadgeEmblem({ emblemKey, earned, imageUrl, title }: { emblemKey: string; earned: boolean; imageUrl?: string | null; title?: string }) {
  const ringClass = earned
    ? 'border-forest-400 shadow-md'
    : 'border-slate-200 grayscale'

  if (imageUrl) {
    return (
      <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${ringClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- custom user-supplied badge art, not a known-dimension local asset */}
        <img src={imageUrl} alt={title ?? emblemKey} className="w-full h-full object-cover" />
      </div>
    )
  }

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

function AwardProgress({ award, onUpdateProgress }: { award: BadgeAward; onUpdateProgress: BadgeActions['onUpdateProgress'] }) {
  const [current, setCurrent] = useState(String(award.progressCurrent ?? ''))
  const [target, setTarget] = useState(String(award.progressTarget ?? ''))
  const [busy, setBusy] = useState(false)

  const hasProgress = award.progressTarget != null && award.progressTarget > 0
  const pct = hasProgress
    ? Math.max(0, Math.min(100, Math.round(((award.progressCurrent ?? 0) / award.progressTarget!) * 100)))
    : 0

  async function handleUpdate() {
    setBusy(true)
    try {
      const c = current.trim() === '' ? null : Number(current)
      const t = target.trim() === '' ? null : Number(target)
      await onUpdateProgress(award.id, Number.isNaN(c as number) ? null : c, Number.isNaN(t as number) ? null : t)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1.5 text-left">
      {hasProgress && (
        <div className="space-y-0.5">
          <p className="text-xs text-slate-500">{award.progressCurrent ?? 0} / {award.progressTarget}</p>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div data-testid="award-progress-bar" className="h-1.5 rounded-full bg-forest-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-1">
        <input
          aria-label="Progress current"
          type="number"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          className="w-12 rounded border border-slate-300 px-1 py-0.5 text-xs text-slate-700"
        />
        <span className="text-xs text-slate-400">/</span>
        <input
          aria-label="Progress target"
          type="number"
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="w-12 rounded border border-slate-300 px-1 py-0.5 text-xs text-slate-700"
        />
        <button
          type="button"
          disabled={busy}
          onClick={handleUpdate}
          className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-forest-700 hover:bg-forest-50 disabled:opacity-50"
        >
          Update progress
        </button>
      </div>
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

      <AwardProgress award={award} onUpdateProgress={actions.onUpdateProgress} />

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
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          <input
            aria-label="Evidence ID"
            type="text"
            value={evidenceId}
            onChange={e => setEvidenceId(e.target.value)}
            placeholder="Evidence ID"
            className="flex-1 min-w-0 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
          />
          <button
            type="button"
            disabled={busy || !evidenceId.trim()}
            onClick={() => run(async () => { await actions.onAddEvidence(award.id, evidenceId.trim()); setEvidenceId(''); setShowEvidence(false) })}
            className="shrink-0 whitespace-nowrap rounded-lg bg-forest-900 px-2 py-1 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50"
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

function BadgeCard({ item, actions, definitionActions }: { item: BadgeCollectionItem; actions?: BadgeActions; definitionActions?: DefinitionActions }) {
  const { definition, award, isEarned } = item
  const [editingDef, setEditingDef] = useState(false)
  const [confirmDeleteDef, setConfirmDeleteDef] = useState(false)
  const earnedDate = award?.approvedAt
    ? new Date(award.approvedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null

  // A custom (household-authored) badge is editable; platform starters are read-only.
  const isCustom = definition.householdId !== null && !definition.isStarter
  const canManageDef = isCustom && !!definitionActions

  const ariaLabel = isEarned
    ? `${definition.title}, earned${earnedDate ? ` ${earnedDate}` : ''}`
    : `${definition.title}, not yet earned — ${definition.criteria}`

  if (canManageDef && editingDef) {
    return (
      <div data-testid={`badge-editing-${definition.id}`} className="card p-4">
        <BadgeDefinitionForm
          submitLabel="Save"
          initial={{
            title: definition.title,
            description: definition.description,
            criteria: definition.criteria,
            emblemKey: definition.emblemKey,
            imageUrl: definition.imageUrl,
            gradeBands: definition.gradeBands,
            verificationRequirement: definition.verificationRequirement,
            visibility: definition.visibility,
            enabled: definition.enabled,
          }}
          onSubmit={async values => { await definitionActions!.onUpdate(definition.id, values); setEditingDef(false) }}
          onCancel={() => setEditingDef(false)}
        />
      </div>
    )
  }

  return (
    <div
      data-testid={isEarned ? `badge-earned-${definition.id}` : `badge-locked-${definition.id}`}
      aria-label={ariaLabel}
      className={`card p-4 flex flex-col items-center gap-3 text-center transition-all min-w-0 ${
        isEarned ? '' : 'opacity-75'
      }`}
    >
      <BadgeEmblem emblemKey={definition.emblemKey} earned={isEarned} imageUrl={definition.imageUrl} title={definition.title} />

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

      {canManageDef && (
        confirmDeleteDef ? (
          <div className="w-full">
            <InlineConfirm
              message="Delete this badge?"
              detail={definition.title}
              confirmLabel="Delete"
              onConfirm={async () => { await definitionActions!.onDelete(definition.id); setConfirmDeleteDef(false) }}
              onCancel={() => setConfirmDeleteDef(false)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Edit badge" onClick={() => setEditingDef(true)} className="text-slate-400 hover:text-forest-700">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" aria-label="Delete badge" onClick={() => setConfirmDeleteDef(true)} className="text-slate-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      )}

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
      {starterDefs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {starterDefs.map(def => (
            <BadgeCard
              key={def.id}
              item={{ definition: def, award: null, isEarned: false }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function BadgesPage() {
  const { householdProfile, studentProfiles } = useHousehold()
  const { selectedChildId } = useLearner()
  const [collection, setCollection] = useState<BadgeCollectionItem[]>([])
  const [platformBadgesEnabled, setPlatformBadgesEnabled] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
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
    if (!learnerId) {
      setLoading(false)
      return
    }
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
    onUpdateProgress: async (awardId, current, target) => {
      await badgesApi.updateAwardProgress(awardId, current, target)
      setSuccess('Progress updated')
      await reloadCollection()
    },
  }

  async function handleToggleSettings() {
    const next = !platformBadgesEnabled
    setPlatformBadgesEnabled(next)
    await badgesApi.setSettings(next)
    setSuccess('Settings updated')
  }

  const definitionActions: DefinitionActions = {
    onUpdate: async (id, values) => {
      await badgesApi.updateDefinition(id, values)
      setSuccess('Badge updated')
      await reloadCollection()
    },
    onDelete: async (id) => {
      await badgesApi.deleteDefinition(id)
      setSuccess('Badge deleted')
      await reloadCollection()
    },
  }

  async function handleCreateDefinition(values: BadgeDefinitionInput) {
    await badgesApi.createDefinition(values)
    setShowCreateForm(false)
    setSuccess('Badge created')
    await reloadCollection()
  }

  if (!learnerId) {
    return (
      <div className="page-shell space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-forest-700" />
          <h1 className="page-title">Badges</h1>
        </div>
        <div className="card p-6 text-center space-y-2" data-testid="badges-no-learner">
          <p className="text-sm text-slate-600">Select a learner from the header to view their badges.</p>
        </div>
      </div>
    )
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

  const isEmpty = collection.length === 0

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
        <div className="flex items-center gap-3">
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
          <button
            type="button"
            data-testid="add-badge-toggle"
            onClick={() => setShowCreateForm(v => !v)}
            className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800"
          >
            {showCreateForm ? 'Cancel' : 'Add badge'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div data-testid="create-badge-form">
          <h2 className="form-section-heading">Add badge</h2>
          <p className="text-xs text-slate-500 mb-2">
            Badges you create here are custom to your household — design your own goals for your kids to work toward.
          </p>
          <div className="add-form-card">
            <BadgeDefinitionForm submitLabel="Create badge" onSubmit={handleCreateDefinition} onCancel={() => setShowCreateForm(false)} />
          </div>
        </div>
      )}

      {success && (
        <InlineSuccess message={success} onDismiss={() => setSuccess(null)} />
      )}

      {isEmpty ? (
        <EmptyBadgeState starterDefs={[]} />
      ) : (
        <div
          data-testid="badges-trophy-case"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        >
          {collection.map(item => (
            <BadgeCard key={item.definition.id} item={item} actions={actions} definitionActions={definitionActions} />
          ))}
        </div>
      )}
    </div>
  )
}
