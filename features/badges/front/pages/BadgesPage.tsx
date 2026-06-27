'use client'

import { useEffect, useState } from 'react'
import { Trophy, AlertCircle, Star } from 'lucide-react'
import { badgesApi } from '@/features/badges/front/services/api'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import type { BadgeCollectionItem, BadgeDefinition } from '@/features/badges/types'

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

function BadgeCard({ item }: { item: BadgeCollectionItem }) {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const householdId = householdProfile?.id ?? ''
  const learnerId = selectedChildId ?? ''
  const learnerName = studentProfiles?.find(p => p.id === learnerId)?.name ?? null

  useEffect(() => {
    if (!householdId) return
    badgesApi.getCollection(householdId, learnerId).then(res => {
      setCollection(res.data)
      setLoading(false)
    }).catch(() => {
      setError('Could not load badges. Please try again.')
      setLoading(false)
    })
  }, [householdId, learnerId])

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
      <div className="flex items-center gap-3">
        <Trophy className="w-6 h-6 text-forest-700" />
        <h1 className="page-title">Badges</h1>
        {learnerName && (
          <span data-testid="badges-learner-name" className="text-sm text-slate-500 font-normal">
            — {learnerName}
          </span>
        )}
      </div>

      <div
        data-testid="badges-trophy-case"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
      >
        {collection.map(item => (
          <BadgeCard key={item.definition.id} item={item} />
        ))}
      </div>
    </div>
  )
}
