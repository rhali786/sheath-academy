'use client'

import { useState } from 'react'
import { plannerApi } from '@/features/plan/front/services/api'
import { DEFAULT_SCHOOL_DAYS } from '@/features/plan/utils/schoolDays'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import type { DayOfWeek } from '@/features/lib/types'
import type { LessonDateMove, ShiftLessonsRequest, ShiftPreview } from '@/features/plan/types'

interface Option {
  id: string
  name: string
}

interface ShiftLessonsPanelProps {
  learners: Option[]
  courses: Option[]
  /** Household school days; "1 week" = this many school days. Undefined = Mon–Fri. */
  schoolDays?: DayOfWeek[]
  /** YYYY-MM-DD; defaults to the local date. Injectable for tests. */
  today?: string
  /** Called after lessons move (apply or undo) so the planner can refetch. */
  onShifted: () => void
  onClose: () => void
}

type DateMove = Pick<LessonDateMove, 'id' | 'from' | 'to'>

interface Notice {
  message: string
  skippedCount: number
  undoMoves?: DateMove[]
}

function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

const primaryButtonClass = 'px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-50 disabled:cursor-not-allowed'
const secondaryButtonClass = 'px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50'
const chipClass = 'px-3 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50'

/**
 * Lesson Planner → "Shift lessons". Moves every not-started lesson on/after a date later by
 * N school days (skipping non-school days and breaks), for chosen learners and courses.
 * Always previews first; nothing changes until Confirm, and Undo puts the dates back.
 */
export function ShiftLessonsPanel({ learners, courses, schoolDays, today, onShifted, onClose }: ShiftLessonsPanelProps) {
  const daysPerWeek = (schoolDays ?? DEFAULT_SCHOOL_DAYS).length || 5
  const [fromDate, setFromDate] = useState(today ?? localToday())
  const [count, setCount] = useState(1)
  const [learnerIds, setLearnerIds] = useState<string[]>(learners.map(l => l.id))
  const [courseIds, setCourseIds] = useState<string[]>(courses.map(c => c.id))
  const [preview, setPreview] = useState<ShiftPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  // Any form change makes an existing preview stale.
  function edit(apply: () => void) {
    apply()
    setPreview(null)
    setError(null)
  }

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter(x => x !== id) : [...list, id]
  }

  function buildRequest(): ShiftLessonsRequest {
    const request: ShiftLessonsRequest = { mode: 'shift', fromDate, schoolDays: count }
    if (learnerIds.length < learners.length) request.learnerIds = learnerIds
    if (courseIds.length < courses.length) request.subjectIds = courseIds
    return request
  }

  async function handlePreview() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setPreview(await plannerApi.previewShift(buildRequest()))
    } catch (err) {
      setError(errorText(err, 'Could not preview the shift'))
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirm() {
    if (!preview) return
    setBusy(true)
    setError(null)
    try {
      const moves: DateMove[] = preview.moves.map(m => ({ id: m.id, from: m.from, to: m.to }))
      const result = await plannerApi.applyShift(moves)
      const applied = moves.filter(m => !result.skipped.includes(m.id))
      setPreview(null)
      setNotice({
        message: `${plural(result.applied, 'lesson')} moved`,
        skippedCount: result.skipped.length,
        undoMoves: applied.map(m => ({ id: m.id, from: m.to, to: m.from })),
      })
      onShifted()
    } catch (err) {
      setError(errorText(err, 'Could not move the lessons'))
    } finally {
      setBusy(false)
    }
  }

  async function handleUndo(undoMoves: DateMove[]) {
    setNotice(null)
    setError(null)
    try {
      const result = await plannerApi.applyShift(undoMoves)
      setNotice({ message: `${plural(result.applied, 'lesson')} moved back`, skippedCount: result.skipped.length })
      onShifted()
    } catch (err) {
      setError(errorText(err, 'Could not undo the move'))
    }
  }

  const learnerName = (id: string) => learners.find(l => l.id === id)?.name ?? 'Unknown learner'
  const canPreview = !busy && learnerIds.length > 0 && courseIds.length > 0 && count >= 1 && Boolean(fromDate)

  return (
    <div className="space-y-4" data-testid="shift-lessons-panel">
      <p className="text-sm text-slate-600">
        Move every not-started lesson on or after a date to later school days — for a sick day, a lost week,
        or time off. Weekends that aren&apos;t school days and breaks are skipped. You&apos;ll see a preview first.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Move lessons from
          <input
            type="date"
            value={fromDate}
            onChange={e => edit(() => setFromDate(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            School days later
            <input
              type="number"
              min={1}
              value={count}
              onChange={e => edit(() => setCount(Math.max(1, Math.floor(Number(e.target.value) || 1))))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-2 mt-2">
            <button type="button" className={chipClass} onClick={() => edit(() => setCount(1))}>1 day</button>
            <button type="button" className={chipClass} onClick={() => edit(() => setCount(daysPerWeek))}>1 week</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 mb-1">Learners</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {learners.map(l => (
              <label key={l.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={learnerIds.includes(l.id)}
                  onChange={() => edit(() => setLearnerIds(ids => toggle(ids, l.id)))}
                />
                {l.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 mb-1">Courses</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {courses.map(c => (
              <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={courseIds.includes(c.id)}
                  onChange={() => edit(() => setCourseIds(ids => toggle(ids, c.id)))}
                />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {notice && (
        <div className="space-y-1">
          <InlineSuccess
            message={notice.message}
            onDismiss={() => setNotice(null)}
            action={notice.undoMoves?.length
              ? { label: 'Undo', onAction: () => handleUndo(notice.undoMoves!) }
              : undefined}
          />
          {notice.skippedCount > 0 && (
            <p className="text-sm text-amber-700">
              {notice.skippedCount === 1
                ? '1 lesson was skipped because it changed since the preview.'
                : `${notice.skippedCount} lessons were skipped because they changed since the preview.`}
            </p>
          )}
        </div>
      )}

      {preview && (
        <div data-testid="shift-preview" className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-2">
          {preview.moves.length === 0 ? (
            <p className="text-slate-600">
              No not-started lessons on or after {formatDate(fromDate)} match these filters.
            </p>
          ) : (
            <>
              <p className="font-medium text-slate-900">
                {plural(preview.moves.length, 'lesson')} for {plural(Object.keys(preview.countsByLearner).length, 'learner')} move{' '}
                {plural(count, 'school day')} later.
              </p>
              <ul className="text-slate-600">
                {Object.entries(preview.countsByLearner).map(([id, n]) => (
                  <li key={id}>{learnerName(id)}: {n}</li>
                ))}
              </ul>
              {preview.pastYearEndCount > 0 && preview.schoolYearEnd && (
                <p className="text-amber-700">
                  {preview.pastYearEndCount === 1 ? '1 lesson' : `${preview.pastYearEndCount} lessons`} will land after the
                  {' '}school year ends ({formatDate(preview.schoolYearEnd)}).
                </p>
              )}
            </>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || preview.moves.length === 0}
            className={primaryButtonClass}
          >
            {busy ? 'Moving…' : 'Confirm'}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={handlePreview} disabled={!canPreview} className={primaryButtonClass}>
          {busy && !preview ? 'Checking…' : 'Preview'}
        </button>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </div>
  )
}
