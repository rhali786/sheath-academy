'use client'

import { useState } from 'react'
import type { CompatibilitySignal, FeedbackPrivacyLevel } from '@/features/resources/types'
import { IslamicCompatibilityBadge } from './IslamicCompatibilityBadge'

const COMPATIBILITY_OPTIONS: { value: CompatibilitySignal; label: string }[] = [
  { value: 'generally-compatible', label: 'Generally compatible' },
  { value: 'needsContext',         label: 'Needs parent context' },
  { value: 'worldviewConcern',     label: 'Contains worldview concern' },
  { value: 'sensitivContent',      label: 'Contains sensitive content' },
  { value: 'stronglyBeneficial',   label: 'Strongly beneficial' },
  { value: 'notReviewed',          label: 'Not reviewed yet' },
]

const PRIVACY_OPTIONS: { value: FeedbackPrivacyLevel; label: string }[] = [
  { value: 'anonymous',     label: 'Anonymous' },
  { value: 'named',         label: 'With my name' },
  { value: 'private',       label: 'Private (not shared)' },
  { value: 'shareForReview', label: 'Share with Sheath for review' },
]

interface FeedbackFormProps {
  resourceId: string
  parentId: string
  onSubmit: (data: {
    resourceId: string
    parentId: string
    compatibility: CompatibilitySignal
    rating?: number
    islamicNote?: string
    worksIndependently?: boolean
    worksTeacherLed?: boolean
    privacyLevel: FeedbackPrivacyLevel
  }) => Promise<void>
}

export function FeedbackForm({ resourceId, parentId, onSubmit }: FeedbackFormProps) {
  const [compatibility, setCompatibility] = useState<CompatibilitySignal>('notReviewed')
  const [rating, setRating] = useState('')
  const [islamicNote, setIslamicNote] = useState('')
  const [worksIndependently, setWorksIndependently] = useState(false)
  const [worksTeacherLed, setWorksTeacherLed] = useState(false)
  const [privacyLevel, setPrivacyLevel] = useState<FeedbackPrivacyLevel>('anonymous')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        resourceId,
        parentId,
        compatibility,
        rating: rating ? parseInt(rating, 10) : undefined,
        islamicNote: islamicNote.trim() || undefined,
        worksIndependently,
        worksTeacherLed,
        privacyLevel,
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div data-testid="feedback-under-review" className="rounded-xl border border-slate-200 p-4 bg-slate-50">
        <p className="text-sm font-medium text-slate-700">
          Thank you — your feedback is under review.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          It will appear as a Community Note once verified by the Sheath team.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} data-testid="feedback-form" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Islamic compatibility
        </label>
        <div className="space-y-2" data-testid="islamic-compatibility-selector">
          {COMPATIBILITY_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="compatibility"
                value={opt.value}
                checked={compatibility === opt.value}
                onChange={() => setCompatibility(opt.value)}
                className="text-forest-900 focus:ring-forest-900"
              />
              <IslamicCompatibilityBadge signal={opt.value} />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Rating (1–5)
        </label>
        <input
          type="number"
          min="1"
          max="5"
          value={rating}
          onChange={e => setRating(e.target.value)}
          className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          data-testid="feedback-rating-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Islamic note (optional)
        </label>
        <textarea
          value={islamicNote}
          onChange={e => setIslamicNote(e.target.value)}
          rows={2}
          placeholder="Any Islamic considerations worth noting for other families…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
          data-testid="feedback-islamic-note-input"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            checked={worksIndependently}
            onChange={e => setWorksIndependently(e.target.checked)}
            data-testid="feedback-works-independently"
          />
          Works independently
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            checked={worksTeacherLed}
            onChange={e => setWorksTeacherLed(e.target.checked)}
            data-testid="feedback-works-teacher-led"
          />
          Works teacher-led
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Contribution privacy
        </label>
        <select
          value={privacyLevel}
          onChange={e => setPrivacyLevel(e.target.value as FeedbackPrivacyLevel)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          data-testid="feedback-privacy-select"
        >
          {PRIVACY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-50"
        data-testid="feedback-submit-button"
      >
        {submitting ? 'Submitting…' : 'Submit feedback'}
      </button>
    </form>
  )
}
