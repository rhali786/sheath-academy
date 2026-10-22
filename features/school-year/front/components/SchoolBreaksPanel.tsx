'use client'

import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { schoolYearApi } from '@/features/school-year/front/services/api'
import { plannerApi } from '@/features/plan/front/services/api'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import type { SchoolBreak, SchoolYear } from '@/features/school-year/types'
import type { LessonDateMove } from '@/features/plan/types'

interface SchoolBreaksPanelProps {
  year: SchoolYear
  onYearUpdated: (year: SchoolYear) => void
}

type BreakDraft = Pick<SchoolBreak, 'name' | 'startDate' | 'endDate'>

interface ShiftPrompt {
  breakName: string
  moves: LessonDateMove[]
  inBreakCount: number
  learnerCount: number
}

interface SuccessNotice {
  message: string
  undoMoves?: Pick<LessonDateMove, 'id' | 'from' | 'to'>[]
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function validateDraft(draft: BreakDraft, year: SchoolYear): string | null {
  if (!draft.name.trim()) return 'Give the break a name'
  if (!draft.startDate || !draft.endDate) return 'Choose a start and end date'
  if (draft.endDate < draft.startDate) return 'The end date must be on or after the start date'
  if (draft.startDate < year.startDate || draft.endDate > year.endDate) {
    return `The break must be within the school year (${formatDate(year.startDate)} – ${formatDate(year.endDate)})`
  }
  return null
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-forest-500 focus:outline-none'
const primaryButtonClass = 'px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-50'
const secondaryButtonClass = 'px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50'

function BreakForm({
  initial,
  year,
  onSave,
  onCancel,
}: {
  initial: BreakDraft
  year: SchoolYear
  onSave: (draft: BreakDraft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<BreakDraft>(initial)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = validateDraft(draft, year)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave({ ...draft, name: draft.name.trim() })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not save the break')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-medium text-slate-600">
          Break name
          <input
            type="text"
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Thanksgiving"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Start
          <input
            type="date"
            value={draft.startDate}
            min={year.startDate}
            max={year.endDate}
            onChange={e => setDraft(d => ({ ...d, startDate: e.target.value }))}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          End
          <input
            type="date"
            value={draft.endDate}
            min={draft.startDate || year.startDate}
            max={year.endDate}
            onChange={e => setDraft(d => ({ ...d, endDate: e.target.value }))}
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save break'}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  )
}

/**
 * Settings → School year → Breaks. Breaks are editable records (inline edit, confirm to
 * remove). Saving a break that has lessons on it offers to move them after the break, using
 * the planner's shift engine (preview first, then apply, with Undo).
 */
export function SchoolBreaksPanel({ year, onYearUpdated }: SchoolBreaksPanelProps) {
  const breaks = year.breaks ?? []
  const [showAddForm, setShowAddForm] = useState(breaks.length === 0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessNotice | null>(null)
  const [prompt, setPrompt] = useState<ShiftPrompt | null>(null)
  const [moving, setMoving] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)

  async function saveBreaks(next: SchoolBreak[]): Promise<void> {
    const res = await schoolYearApi.updateSchoolYear(year.id, { breaks: next })
    onYearUpdated(res.data)
  }

  async function offerToMoveLessons(saved: SchoolBreak) {
    try {
      const preview = await plannerApi.previewShift({ mode: 'break', breakId: saved.id })
      const inBreakCount = preview.moves.filter(
        m => m.from.dueDate >= saved.startDate && m.from.dueDate <= saved.endDate,
      ).length
      if (inBreakCount === 0) return
      setMoveError(null)
      setPrompt({
        breakName: saved.name,
        moves: preview.moves,
        inBreakCount,
        learnerCount: Object.keys(preview.countsByLearner).length,
      })
    } catch {
      // Saving the break succeeded; failing to check for lessons must not undo or block that.
    }
  }

  async function handleAdd(draft: BreakDraft) {
    const created: SchoolBreak = { id: `break_${Date.now()}`, ...draft }
    await saveBreaks([...breaks, created])
    setShowAddForm(false)
    await offerToMoveLessons(created)
  }

  async function handleEdit(id: string, draft: BreakDraft) {
    const updated: SchoolBreak = { id, ...draft }
    await saveBreaks(breaks.map(b => (b.id === id ? updated : b)))
    setEditingId(null)
    await offerToMoveLessons(updated)
  }

  async function handleRemove(target: SchoolBreak) {
    await saveBreaks(breaks.filter(b => b.id !== target.id))
    setConfirmRemoveId(null)
    setSuccess({ message: `${target.name} removed` })
  }

  async function handleMoveLessons() {
    if (!prompt) return
    setMoving(true)
    setMoveError(null)
    try {
      const moves = prompt.moves.map(m => ({ id: m.id, from: m.from, to: m.to }))
      const result = await plannerApi.applyShift(moves)
      const applied = moves.filter(m => !result.skipped.includes(m.id))
      setPrompt(null)
      setSuccess({
        message: `${plural(result.applied, 'lesson')} moved`,
        undoMoves: applied.map(m => ({ id: m.id, from: m.to, to: m.from })),
      })
    } catch (err) {
      setMoveError(err instanceof Error && err.message ? err.message : 'Could not move the lessons')
    } finally {
      setMoving(false)
    }
  }

  async function handleUndo(undoMoves: Pick<LessonDateMove, 'id' | 'from' | 'to'>[]) {
    setSuccess(null)
    try {
      const result = await plannerApi.applyShift(undoMoves)
      setSuccess({ message: `${plural(result.applied, 'lesson')} moved back` })
    } catch (err) {
      setMoveError(err instanceof Error && err.message ? err.message : 'Could not undo the move')
    }
  }

  return (
    <div data-testid="school-breaks-panel" className="mb-4 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Breaks</h3>
          <p className="text-xs text-slate-500">Holidays and time off. Lessons are never scheduled on these days.</p>
        </div>
        {breaks.length > 0 && (
          <button
            type="button"
            onClick={() => { setShowAddForm(v => !v); setEditingId(null) }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-forest-700 hover:bg-forest-50"
          >
            {showAddForm ? 'Cancel' : <><Plus className="w-3 h-3" aria-hidden="true" /> Add break</>}
          </button>
        )}
      </div>

      {success && (
        <InlineSuccess
          message={success.message}
          onDismiss={() => setSuccess(null)}
          action={success.undoMoves?.length
            ? { label: 'Undo', onAction: () => handleUndo(success.undoMoves!) }
            : undefined}
        />
      )}

      {prompt && (
        <div data-testid="break-shift-prompt" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">
            {plural(prompt.inBreakCount, 'lesson')} fall in {prompt.breakName}. Move them after the break?
          </p>
          <p className="text-amber-800 mt-1">
            {plural(prompt.moves.length, 'lesson')} for {plural(prompt.learnerCount, 'learner')} will shift later to make room.
          </p>
          {moveError && <p className="text-red-600 mt-2" role="alert">{moveError}</p>}
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={handleMoveLessons} disabled={moving} className={primaryButtonClass}>
              {moving ? 'Moving…' : 'Move lessons'}
            </button>
            <button type="button" onClick={() => setPrompt(null)} disabled={moving} className={secondaryButtonClass}>
              Not now
            </button>
          </div>
        </div>
      )}

      {!prompt && moveError && <p className="text-sm text-red-600" role="alert">{moveError}</p>}

      {showAddForm && (
        <div data-testid="add-break-form" className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <BreakForm
            initial={{ name: '', startDate: '', endDate: '' }}
            year={year}
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {breaks.length === 0 ? (
        <p className="text-sm text-slate-400">No breaks yet.</p>
      ) : (
        <ul className="space-y-2">
          {breaks.map(b => (
            <li key={b.id} className="text-sm">
              {editingId === b.id ? (
                <div data-testid={`edit-break-${b.id}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <BreakForm
                    initial={{ name: b.name, startDate: b.startDate, endDate: b.endDate }}
                    year={year}
                    onSave={draft => handleEdit(b.id, draft)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : confirmRemoveId === b.id ? (
                <InlineConfirm
                  message={`Remove ${b.name}?`}
                  detail="Lessons already moved for this break stay where they are."
                  confirmLabel="Remove"
                  onConfirm={() => handleRemove(b)}
                  onCancel={() => setConfirmRemoveId(null)}
                />
              ) : (
                <div data-testid={`break-${b.id}`} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700 truncate">{b.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{formatDate(b.startDate)} – {formatDate(b.endDate)}</span>
                    <button
                      type="button"
                      aria-label={`Edit ${b.name}`}
                      onClick={() => { setEditingId(b.id); setShowAddForm(false); setConfirmRemoveId(null) }}
                      className="text-slate-400 hover:text-forest-700"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${b.name}`}
                      onClick={() => { setConfirmRemoveId(b.id); setEditingId(null) }}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
