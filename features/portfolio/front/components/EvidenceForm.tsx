'use client'

import { useState } from 'react'
import type { CreateEvidenceItemInput, EvidenceType } from '@/features/portfolio/types'

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'writing_sample', label: 'Writing Sample' },
  { value: 'project', label: 'Project' },
  { value: 'recitation', label: 'Recitation' },
  { value: 'other', label: 'Other' },
]

interface ChildOption {
  id: string
  name: string
}

interface SubjectOption {
  id: string
  name: string
  childId: string
}

interface LessonOption {
  id: string
  title: string
  dueDate: string
  childId: string
  subjectId: string
}

interface Props {
  children: ChildOption[]
  subjects: SubjectOption[]
  lessons: LessonOption[]
  onSave(input: CreateEvidenceItemInput): Promise<void>
  initialChildId?: string | null
}

interface FormErrors {
  title?: string
  childId?: string
  subjectId?: string
  date?: string
  type?: string
  url?: string
  notes?: string
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function EvidenceForm({
  children,
  subjects,
  lessons,
  onSave,
  initialChildId,
}: Props) {
  const [title, setTitle] = useState('')
  const [childId, setChildId] = useState(initialChildId ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(todayStr)
  const [type, setType] = useState<EvidenceType | ''>('')
  const [notes, setNotes] = useState('')
  const [reflection, setReflection] = useState('')
  const [url, setUrl] = useState('')
  const [lessonTaskId, setLessonTaskId] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const filteredSubjects = childId
    ? subjects.filter(s => s.childId === childId)
    : subjects

  const filteredLessons = childId
    ? lessons.filter(l => l.childId === childId && (subjectId ? l.subjectId === subjectId : true))
    : []

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!childId) errs.childId = 'Child is required'
    if (!subjectId) errs.subjectId = 'Subject is required'
    if (!date) errs.date = 'Date is required'
    if (!type) errs.type = 'Type is required'
    if (type === 'link' && !url.trim()) errs.url = 'URL is required for link type'
    if (type === 'note' && !notes.trim() && !url.trim()) {
      errs.notes = 'Notes or URL is required for note type'
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const input: CreateEvidenceItemInput = {
        title: title.trim(),
        childId,
        subjectId,
        date,
        type: type as EvidenceType,
        notes: notes.trim() || undefined,
        reflection: reflection.trim() || undefined,
        url: url.trim() || undefined,
        lessonTaskId: lessonTaskId || undefined,
      }
      await onSave(input)
      setTitle('')
      setChildId(initialChildId ?? '')
      setSubjectId('')
      setDate(todayStr())
      setType('')
      setNotes('')
      setReflection('')
      setUrl('')
      setLessonTaskId('')
    } finally {
      setSubmitting(false)
    }
  }

  function handleChildChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setChildId(e.target.value)
    setSubjectId('')
    setLessonTaskId('')
  }

  function handleSubjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSubjectId(e.target.value)
    setLessonTaskId('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-800">Add Evidence</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="ev-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Evidence title"
        />
        {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-child">
          Child <span className="text-red-500">*</span>
        </label>
        <select
          id="ev-child"
          value={childId}
          onChange={handleChildChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Select child</option>
          {children.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.childId && <p className="text-red-600 text-xs mt-1">{errors.childId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-subject">
          Subject <span className="text-red-500">*</span>
        </label>
        <select
          id="ev-subject"
          value={subjectId}
          onChange={handleSubjectChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Select subject</option>
          {filteredSubjects.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.subjectId && <p className="text-red-600 text-xs mt-1">{errors.subjectId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-date">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          id="ev-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-type">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          id="ev-type"
          value={type}
          onChange={e => setType(e.target.value as EvidenceType | '')}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Select type</option>
          {EVIDENCE_TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.type && <p className="text-red-600 text-xs mt-1">{errors.type}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-notes">
          Notes
        </label>
        <textarea
          id="ev-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={3}
          placeholder="Optional notes about this evidence"
        />
        {errors.notes && <p className="text-red-600 text-xs mt-1">{errors.notes}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-reflection">
          Parent reflection
        </label>
        <textarea
          id="ev-reflection"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={3}
          placeholder="Why does this show learning or growth?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-url">
          URL
        </label>
        <input
          id="ev-url"
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="https://..."
        />
        {errors.url && <p className="text-red-600 text-xs mt-1">{errors.url}</p>}
      </div>

      {filteredLessons.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-lesson">
            Linked Lesson (optional)
          </label>
          <select
            id="ev-lesson"
            value={lessonTaskId}
            onChange={e => setLessonTaskId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {filteredLessons.map(l => (
              <option key={l.id} value={l.id}>
                {l.title} ({l.dueDate})
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save Evidence'}
      </button>
    </form>
  )
}
