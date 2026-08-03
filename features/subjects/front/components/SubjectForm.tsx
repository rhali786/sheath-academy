'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { DayOfWeek, StudentProfile } from '@/features/lib/types'
import type { RecurringScheduleBlock, SubjectCourseCategory } from '@/features/subjects/types'
import { SUBJECT_COURSE_CATEGORIES, formatCategory } from '@/features/subjects/front/lib/categories'
import { childrenApi } from '@/features/children/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'

const ALL_DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ScheduleBlockDraft {
  daysOfWeek: DayOfWeek[]
  startTime: string
  endTime: string
}

function emptyBlock(): ScheduleBlockDraft {
  return { daysOfWeek: [], startTime: '', endTime: '' }
}

/** A block is only submitted once it has at least one day and both times set. */
function isCompleteBlock(b: ScheduleBlockDraft): b is RecurringScheduleBlock {
  return b.daysOfWeek.length > 0 && !!b.startTime && !!b.endTime
}

export interface SubjectFormProps {
  /** Matches `StudentProfile.householdId` (household profile id, not workspace id). */
  householdId: string
  /** Called after a subject is created successfully */
  onSuccess?: () => void
  /** When set, pre-selects this learner (legacy tab mode). */
  defaultChildId?: string
  /** Hide the learner checkboxes — parent UI owns child selection (tabs only). */
  hideChildSelect?: boolean
}

export function SubjectForm({ householdId, onSuccess, defaultChildId, hideChildSelect }: SubjectFormProps) {
  const [children, setChildren] = useState<StudentProfile[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>(
    defaultChildId ? [defaultChildId] : []
  )
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SubjectCourseCategory>('Quran')
  const [customCategory, setCustomCategory] = useState('')
  const [instructorName, setInstructorName] = useState('')
  const [level, setLevel] = useState('')
  const [recurringEnabled, setRecurringEnabled] = useState(false)
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlockDraft[]>([emptyBlock()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!householdId.trim()) {
      setChildren([])
      setSelectedLearnerIds([])
      setLoadingChildren(false)
      return
    }
    setLoadingChildren(true)
    childrenApi
      .getChildren(householdId, false)
      .then((res) => {
        if (cancelled) return
        const list = (res.data ?? []).filter((c) => c.isActive !== false)
        setChildren(list)
        if (defaultChildId) {
          setSelectedLearnerIds([defaultChildId])
        } else if (list.length === 1) {
          setSelectedLearnerIds([list[0].id])
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load children')
      })
      .finally(() => {
        if (!cancelled) setLoadingChildren(false)
      })
    return () => {
      cancelled = true
    }
  }, [defaultChildId, householdId])

  function toggleLearner(id: string) {
    setSelectedLearnerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleBlockDay(index: number, day: DayOfWeek) {
    setScheduleBlocks(prev =>
      prev.map((b, i) =>
        i !== index
          ? b
          : { ...b, daysOfWeek: b.daysOfWeek.includes(day) ? b.daysOfWeek.filter(d => d !== day) : [...b.daysOfWeek, day] }
      )
    )
  }

  function updateBlockTime(index: number, field: 'startTime' | 'endTime', value: string) {
    setScheduleBlocks(prev => prev.map((b, i) => (i !== index ? b : { ...b, [field]: value })))
  }

  function addBlock() {
    setScheduleBlocks(prev => [...prev, emptyBlock()])
  }

  function removeBlock(index: number) {
    setScheduleBlocks(prev => (prev.length <= 1 ? [emptyBlock()] : prev.filter((_, i) => i !== index)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (selectedLearnerIds.length === 0 || !name.trim()) {
      setError('Choose at least one learner and enter a course name.')
      return
    }
    setSubmitting(true)
    try {
      const completeBlocks = recurringEnabled ? scheduleBlocks.filter(isCompleteBlock) : []
      await subjectsApi.createSubject({
        learnerIds: selectedLearnerIds,
        name: name.trim(),
        category,
        ...(category === 'OtherCustom' && customCategory.trim() && { customCategory: customCategory.trim() }),
        ...(instructorName.trim() && { instructorName: instructorName.trim() }),
        ...(level.trim() && { level: level.trim() }),
        ...(completeBlocks.length > 0 && { recurringSchedule: completeBlocks }),
      })
      setName('')
      setCustomCategory('')
      setInstructorName('')
      setLevel('')
      setRecurringEnabled(false)
      setScheduleBlocks([emptyBlock()])
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create subject')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingChildren) {
    return (
      <p className="text-sm text-slate-500" data-testid="subject-form-loading">
        Loading children…
      </p>
    )
  }

  if (!householdId.trim()) {
    return (
      <p className="text-sm text-amber-700" data-testid="subject-form-no-household">
        Household is not ready yet. Finish setup, then add subjects here.
      </p>
    )
  }

  if (children.length === 0) {
    return (
      <p className="text-sm text-amber-700" data-testid="subject-form-no-children">
        No children in this household yet. Add a child in the Children tab first.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="subject-form">
      {!hideChildSelect && (
        <div>
          <p className="block text-xs font-medium text-slate-600 mb-1.5">Learner(s)</p>
          <div className="flex flex-wrap gap-2">
            {children.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLearnerIds.includes(c.id)}
                  onChange={() => toggleLearner(c.id)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">{c.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {hideChildSelect && children.length > 1 && (
        <p className="text-xs text-slate-500" data-testid="subject-form-tabs-hint">
          New subjects are added for the child selected in the tabs above.
        </p>
      )}

      <div>
        <label htmlFor="subject-name" className="block text-xs font-medium text-slate-600 mb-1">
          Course / Subject name
        </label>
        <input
          id="subject-name"
          type="text"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Algebra I"
          maxLength={120}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="subject-category" className="block text-xs font-medium text-slate-600 mb-1">
            Category
          </label>
          <select
            id="subject-category"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as SubjectCourseCategory)}
          >
            {SUBJECT_COURSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {formatCategory(c)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject-level" className="block text-xs font-medium text-slate-600 mb-1">
            Level/Grade <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="subject-level"
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="e.g. Grade 5"
            maxLength={60}
          />
        </div>
      </div>

      {category === 'OtherCustom' && (
        <div>
          <label htmlFor="subject-custom-category" className="block text-xs font-medium text-slate-600 mb-1">
            Custom category
          </label>
          <input
            id="subject-custom-category"
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="e.g. Nature Journaling"
            maxLength={80}
          />
        </div>
      )}

      <div>
        <label htmlFor="subject-instructor" className="block text-xs font-medium text-slate-600 mb-1">
          Instructor/Teacher <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="subject-instructor"
          type="text"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          value={instructorName}
          onChange={(e) => setInstructorName(e.target.value)}
          placeholder="e.g. Umm Layth"
          maxLength={80}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setRecurringEnabled(v => !v)}
          aria-pressed={recurringEnabled}
          className="text-xs font-medium text-forest-800 hover:underline"
          data-testid="recurring-schedule-toggle"
        >
          {recurringEnabled ? 'Remove recurring weekly schedule' : '+ Add recurring weekly schedule (optional)'}
        </button>

        {recurringEnabled && (
          <div className="mt-2 space-y-3" data-testid="recurring-schedule-editor">
            {scheduleBlocks.map((block, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-2" data-testid={`recurring-block-${index}`}>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => (
                    <label key={day} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.daysOfWeek.includes(day)}
                        onChange={() => toggleBlockDay(index, day)}
                        className="rounded"
                        data-testid={`recurring-day-${day}-${index}`}
                      />
                      <span className="text-xs text-slate-600">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`recurring-start-${index}`} className="block text-xs font-medium text-slate-600 mb-1">
                      Start time
                    </label>
                    <input
                      id={`recurring-start-${index}`}
                      type="time"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={block.startTime}
                      onChange={(e) => updateBlockTime(index, 'startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`recurring-end-${index}`} className="block text-xs font-medium text-slate-600 mb-1">
                      End time
                    </label>
                    <input
                      id={`recurring-end-${index}`}
                      type="time"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={block.endTime}
                      onChange={(e) => updateBlockTime(index, 'endTime', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="text-xs text-red-600 hover:underline"
                  data-testid={`recurring-remove-block-${index}`}
                >
                  Remove time block
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addBlock}
              className="text-xs text-forest-800 hover:underline"
              data-testid="recurring-add-block"
            >
              + Add another time block
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name.trim() || selectedLearnerIds.length === 0}
        className="w-full py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Add course'}
      </button>
    </form>
  )
}
