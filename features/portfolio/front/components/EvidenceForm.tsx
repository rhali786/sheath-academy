'use client'

import { useState, useEffect, useRef } from 'react'
import type { CreateEvidenceItemInput, EvidenceItem, EvidenceType } from '@/features/portfolio/types'
import { portfolioApi } from '../services/api'

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
  /** All enrolled learners (primary + secondary). Falls back to [childId] when absent. */
  learnerIds?: string[]
}

interface LessonOption {
  id: string
  title: string
  dueDate: string
  childId: string
  subjectId: string
}

const MAX_ATTACHMENT_BYTES = 2_097_152
const ALLOWED_ATTACHMENT_MIME = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf',
])

interface Props {
  children: ChildOption[]
  subjects: SubjectOption[]
  lessons: LessonOption[]
  onSave(input: CreateEvidenceItemInput): Promise<EvidenceItem>
  initialChildId?: string | null
  editingItem?: EvidenceItem | null
  onCancelEdit?: () => void
}

interface FormErrors {
  title?: string
  childId?: string
  subjectId?: string
  date?: string
  type?: string
  url?: string
  notes?: string
  attachment?: string
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
  editingItem,
  onCancelEdit,
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  // Sync childId when initialChildId prop changes (handles async child load)
  useEffect(() => {
    if (!editingItem) {
      setChildId(initialChildId ?? '')
      setSubjectId('')
      setLessonTaskId('')
    }
  }, [initialChildId])

  // Pre-fill form when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title)
      setChildId(editingItem.childId)
      setSubjectId(editingItem.subjectId)
      setDate(editingItem.date)
      setType(editingItem.type)
      setNotes(editingItem.notes ?? '')
      setReflection(editingItem.reflection ?? '')
      setUrl(editingItem.url ?? '')
      setLessonTaskId(editingItem.lessonTaskId ?? '')
    } else {
      setTitle('')
      setChildId(initialChildId ?? '')
      setSubjectId('')
      setDate(todayStr())
      setType('')
      setNotes('')
      setReflection('')
      setUrl('')
      setLessonTaskId('')
    }
    setErrors({})
  }, [editingItem])

  // Revoke preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setErrors(prev => ({ ...prev, attachment: 'File too large (max 2 MB)' }))
      return
    }
    if (!ALLOWED_ATTACHMENT_MIME.has(file.type)) {
      setErrors(prev => ({ ...prev, attachment: 'File type not allowed (images and PDF only)' }))
      return
    }

    setErrors(prev => ({ ...prev, attachment: undefined }))
    setAttachmentFile(file)

    // Revoke previous preview before creating a new one
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      previewUrlRef.current = url
      setPreviewUrl(url)
    } else {
      previewUrlRef.current = null
      setPreviewUrl(null)
    }
  }

  const filteredSubjects = childId
    ? subjects.filter(s => (s.learnerIds ?? [s.childId]).includes(childId))
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
      const savedItem = await onSave(input)

      // Step 2: upload file only after record is saved
      if (attachmentFile && savedItem?.id) {
        await portfolioApi.uploadEvidenceAttachment(savedItem.id, attachmentFile)
      }

      if (!editingItem) {
        setTitle('')
        setChildId(initialChildId ?? '')
        setSubjectId('')
        setDate(todayStr())
        setType('')
        setNotes('')
        setReflection('')
        setUrl('')
        setLessonTaskId('')
        setAttachmentFile(null)
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current)
          previewUrlRef.current = null
        }
        setPreviewUrl(null)
      }
    } catch (_err) {
      // save or upload failed — caller handles its own error display
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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{editingItem ? 'Edit Evidence' : 'Add Evidence'}</h3>
        {editingItem && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
          >
            Cancel edit
          </button>
        )}
      </div>

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ev-attachment">
          Attach file (optional)
        </label>
        <input
          id="ev-attachment"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-700"
        />
        {errors.attachment && <p className="text-red-600 text-xs mt-1">{errors.attachment}</p>}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="mt-2 max-h-32 rounded border border-gray-200 object-contain"
          />
        )}
        {attachmentFile && !previewUrl && (
          <p className="text-xs text-gray-500 mt-1">{attachmentFile.name}</p>
        )}
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
        {submitting ? 'Saving...' : editingItem ? 'Update Evidence' : 'Save Evidence'}
      </button>
    </form>
  )
}
