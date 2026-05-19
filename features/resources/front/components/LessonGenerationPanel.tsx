'use client'

import { useState } from 'react'
import type { Resource, LessonGenerationStrategy, GeneratedLesson } from '@/features/resources/types'
import { resourcesApi } from '../services/api'

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
  const [strategy, setStrategy] = useState<LessonGenerationStrategy>('byChapter')
  const [chapters, setChapters] = useState(String(resource.totalChapters ?? ''))
  const [schoolDays, setSchoolDays] = useState('36')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedLesson[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
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
    </div>
  )
}
