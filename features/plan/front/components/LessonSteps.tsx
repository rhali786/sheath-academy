'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import { plannerApi } from '@/features/plan/front/services/api'
import type { LessonStep, LessonStepType } from '@/features/plan/types'

const STEP_TYPES: { value: LessonStepType; label: string }[] = [
  { value: 'instruction', label: 'Instruction' },
  { value: 'reading', label: 'Reading' },
  { value: 'practice', label: 'Practice' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'assessment', label: 'Assessment' },
]

function StepForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { stepText: string; type: string }
  submitLabel: string
  onSubmit: (values: { stepText: string; type: string }) => Promise<void>
  onCancel: () => void
}) {
  const [stepText, setStepText] = useState(initial?.stepText ?? '')
  const [type, setType] = useState(initial?.type ?? 'instruction')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!stepText.trim()) {
      setError('Step text is required.')
      return
    }
    setPending(true)
    try {
      await onSubmit({ stepText: stepText.trim(), type })
    } catch {
      setError('Could not save. Please try again.')
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <input
        aria-label="Step text"
        type="text"
        placeholder="Step description"
        value={stepText}
        onChange={e => setStepText(e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700"
      />
      <div className="flex items-center justify-between gap-2">
        <select
          aria-label="Step type"
          value={type}
          onChange={e => setType(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
        >
          {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={pending} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={pending} className="rounded-lg bg-forest-900 px-2 py-1 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50">{pending ? 'Saving…' : submitLabel}</button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </form>
  )
}

export function LessonSteps({ lessonTaskId }: { lessonTaskId: string }) {
  const [steps, setSteps] = useState<LessonStep[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadError(false)
    plannerApi.listSteps(lessonTaskId)
      .then(setSteps)
      .catch(() => { setSteps([]); setLoadError(true) })
  }, [lessonTaskId])

  useEffect(() => { load() }, [load])

  async function handleAdd(values: { stepText: string; type: string }) {
    await plannerApi.createStep(lessonTaskId, values)
    setShowAddForm(false)
    setSuccess('Step added')
    load()
  }

  async function handleEdit(stepId: string, values: { stepText: string; type: string }) {
    await plannerApi.updateStep(lessonTaskId, stepId, values)
    setEditingId(null)
    setSuccess('Step updated')
    load()
  }

  async function handleDelete(stepId: string) {
    await plannerApi.deleteStep(lessonTaskId, stepId)
    setConfirmDeleteId(null)
    setSuccess('Step deleted')
    load()
  }

  return (
    <div data-testid={`lesson-steps-${lessonTaskId}`} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          {steps === null ? 'Loading steps…' : steps.length === 0 ? 'No steps yet' : 'Steps'}
        </span>
        <button
          type="button"
          data-testid={`add-step-toggle-${lessonTaskId}`}
          onClick={() => { setShowAddForm(v => !v); setEditingId(null) }}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-forest-700 hover:bg-forest-50"
        >
          <Plus className="w-3 h-3" /> {showAddForm ? 'Cancel' : 'Add step'}
        </button>
      </div>

      {loadError && <p className="text-xs text-red-600" role="alert">Could not load steps. Please try again.</p>}

      {success && <InlineSuccess message={success} onDismiss={() => setSuccess(null)} />}

      {showAddForm && (
        <div data-testid={`add-step-form-${lessonTaskId}`}>
          <StepForm submitLabel="Add step" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {steps !== null && steps.length > 0 && (
        <ol className="space-y-1 list-decimal list-inside">
          {steps.map(step => (
            <li key={step.id} className="text-sm text-slate-700">
              {editingId === step.id ? (
                <StepForm
                  submitLabel="Save"
                  initial={{ stepText: step.stepText, type: step.type }}
                  onSubmit={values => handleEdit(step.id, values)}
                  onCancel={() => setEditingId(null)}
                />
              ) : confirmDeleteId === step.id ? (
                <InlineConfirm
                  message="Delete this step?"
                  detail={step.stepText}
                  confirmLabel="Delete"
                  onConfirm={() => handleDelete(step.id)}
                  onCancel={() => setConfirmDeleteId(null)}
                />
              ) : (
                <span className="inline-flex w-full items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="truncate">{step.stepText}</span>
                    <span className="ml-2 text-xs text-slate-400 capitalize">{step.type}</span>
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <button type="button" aria-label="Edit step" onClick={() => { setEditingId(step.id); setShowAddForm(false) }} className="text-slate-400 hover:text-forest-700">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button type="button" aria-label="Delete step" onClick={() => setConfirmDeleteId(step.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
