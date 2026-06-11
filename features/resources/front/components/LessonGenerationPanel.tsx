'use client'

import { useState } from 'react'
import type { Resource, LessonGenerationStrategy, GeneratedLesson } from '@/features/resources/types'
import { resourcesApi } from '../services/api'
import { plannerApi } from '@/features/plan/front/services/api'
import { useHousehold } from '@/features/household/front/context'

const STRATEGIES: { value: LessonGenerationStrategy; label: string }[] = [
  { value: 'byChapter', label: 'By chapter' },
  { value: 'byLesson',  label: 'By lesson' },
  { value: 'byPage',    label: 'By page' },
  { value: 'bySurah',   label: 'By surah' },
  { value: 'byModule',  label: 'By module' },
]

interface LessonGenerationPanelProps {
  resource: Resource
  startDate?: string
  onGenerate?: (lessons: GeneratedLesson[]) => void
}

export function LessonGenerationPanel({ resource, startDate, onGenerate }: LessonGenerationPanelProps) {
  const { studentProfiles, allSubjects } = useHousehold()
  const [strategy, setStrategy] = useState<LessonGenerationStrategy>('byChapter')
  const [chapters, setChapters] = useState(String(resource.totalChapters ?? ''))
  const [schoolDays, setSchoolDays] = useState('36')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedLesson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function toggleLearner(id: string) {
    setSelectedLearnerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    setSelectedCourseId('')
  }

  const filteredCourses = allSubjects.filter(
    s => s.isActive && s.learnerIds.some(id => selectedLearnerIds.includes(id))
  )

  const canSave = selectedLearnerIds.length > 0 && !!selectedCourseId && generated.length > 0 && !saved

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setSaveMessage(null)
    setSaveError(null)
    setSaved(false)
    try {
      const res = await resourcesApi.generateLessons({
        resource,
        strategy,
        chapters: chapters ? parseInt(chapters, 10) : undefined,
        schoolDays: parseInt(schoolDays, 10) || 36,
        startDate,
      })
      setGenerated(res.data)
      onGenerate?.(res.data)
    } catch {
      setError('Failed to generate lessons.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!canSave) return
    const subjectId = selectedCourseId
    const householdId = studentProfiles.find(c => selectedLearnerIds.includes(c.id))?.householdId ?? ''
    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)
    try {
      for (const childId of selectedLearnerIds) {
        for (const lesson of generated) {
          await plannerApi.createLesson({
            childId,
            subjectId,
            householdId,
            title: lesson.title,
            description: lesson.description,
            dueDate: lesson.dueDate,
            status: 'not_started',
            order: lesson.order,
          })
        }
      }
      setSaveMessage(`${generated.length} lesson${generated.length === 1 ? '' : 's'} added to the planner`)
      setSaved(true)
    } catch {
      setSaveError('Failed to save lessons to the planner.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div data-testid="lesson-generation-panel" className="space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Generate lessons</p>

      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Strategy</label>
          <select
            value={strategy}
            onChange={e => setStrategy(e.target.value as LessonGenerationStrategy)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            data-testid="generation-strategy-select"
          >
            {STRATEGIES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        {strategy === 'byChapter' && (
          <div>
            <label className="block text-xs text-slate-600 mb-1">Chapters</label>
            <input
              type="number"
              min="1"
              value={chapters}
              onChange={e => setChapters(e.target.value)}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              data-testid="generation-chapters-input"
            />
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-600 mb-1">School days</label>
          <input
            type="number"
            min="1"
            value={schoolDays}
            onChange={e => setSchoolDays(e.target.value)}
            className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            data-testid="generation-school-days-input"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="px-3 py-1.5 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-50"
        data-testid="generate-lessons-button"
      >
        {generating ? 'Generating…' : 'Generate lessons'}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {generated.length > 0 && (
        <div className="border border-slate-200 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-slate-600">{generated.length} lessons generated:</p>
          {generated.map(l => (
            <div key={l.order} className="text-xs text-slate-700 flex justify-between">
              <span>{l.title}</span>
              <span className="text-slate-400">{l.dueDate}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div>
          <p className="block text-xs text-slate-600 mb-1">Learner(s)</p>
          <div className="flex flex-wrap gap-2">
            {studentProfiles.map(child => (
              <label key={child.id} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLearnerIds.includes(child.id)}
                  onChange={() => toggleLearner(child.id)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">{child.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="generation-course-select" className="block text-xs text-slate-600 mb-1">
            Course
          </label>
          <select
            id="generation-course-select"
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            data-testid="generation-course-select"
          >
            <option value="">Select a course…</option>
            {filteredCourses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
      </div>

      {generated.length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="px-3 py-1.5 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-50"
          data-testid="save-to-plan-button"
        >
          {saving ? 'Saving…' : 'Save to plan'}
        </button>
      )}

      {saveMessage && <p className="text-xs text-green-700">{saveMessage}</p>}
      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
    </div>
  )
}
