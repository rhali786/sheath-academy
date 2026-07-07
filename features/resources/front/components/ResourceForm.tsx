'use client'

import { useState } from 'react'
import type { ResourceType } from '@/features/resources/types'

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'textbook',      label: 'Textbook' },
  { value: 'workbook',      label: 'Workbook' },
  { value: 'online-course', label: 'Online Course' },
  { value: 'quran-text',    label: 'Quran Text' },
  { value: 'reader',        label: 'Reader' },
  { value: 'other',         label: 'Other' },
]

export interface ResourceCourseOption {
  id: string
  name: string
}

interface ResourceFormProps {
  workspaceId: string
  /** Enrolled (active) courses available to link this resource to. Omit or pass [] to hide the section. */
  courses?: ResourceCourseOption[]
  onSubmit: (data: {
    workspaceId: string
    title: string
    resourceType: ResourceType
    publisher?: string
    author?: string
    edition?: string
    gradeLevel?: string
    subjectCategory?: string
    isbn?: string
    totalPages?: number
    totalLessons?: number
    totalChapters?: number
    /** IDs of enrolled courses selected to link this resource to. */
    courseIds?: string[]
  }) => Promise<void>
  onCancel?: () => void
}

export function ResourceForm({ workspaceId, courses = [], onSubmit, onCancel }: ResourceFormProps) {
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState<ResourceType>('textbook')
  const [publisher, setPublisher] = useState('')
  const [author, setAuthor] = useState('')
  const [edition, setEdition] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [subjectCategory, setSubjectCategory] = useState('')
  const [isbn, setIsbn] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [totalChapters, setTotalChapters] = useState('')
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const canGenerate = totalPages.length > 0 || totalChapters.length > 0

  function toggleCourse(courseId: string) {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        workspaceId,
        title: title.trim(),
        resourceType,
        publisher: publisher.trim() || undefined,
        author: author.trim() || undefined,
        edition: edition.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
        subjectCategory: subjectCategory.trim() || undefined,
        isbn: isbn.trim() || undefined,
        totalPages: totalPages ? parseInt(totalPages, 10) : undefined,
        totalChapters: totalChapters ? parseInt(totalChapters, 10) : undefined,
        courseIds: selectedCourseIds,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="resource-form" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Saxon Math 7/6"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          data-testid="resource-title-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Resource type</label>
        <select
          value={resourceType}
          onChange={e => setResourceType(e.target.value as ResourceType)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          data-testid="resource-type-select"
        >
          {RESOURCE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Publisher</label>
          <input
            type="text"
            value={publisher}
            onChange={e => setPublisher(e.target.value)}
            placeholder="e.g. Saxon Publishers"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            data-testid="resource-publisher-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            data-testid="resource-author-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Edition</label>
          <input
            type="text"
            value={edition}
            onChange={e => setEdition(e.target.value)}
            placeholder="e.g. 3rd"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            data-testid="resource-edition-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Grade level</label>
          <input
            type="text"
            value={gradeLevel}
            onChange={e => setGradeLevel(e.target.value)}
            placeholder="e.g. 6th–7th"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject category</label>
          <input
            type="text"
            value={subjectCategory}
            onChange={e => setSubjectCategory(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
          <input
            type="text"
            value={isbn}
            onChange={e => setIsbn(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            data-testid="resource-isbn-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Total pages</label>
          <input
            type="number"
            min="1"
            value={totalPages}
            onChange={e => setTotalPages(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            data-testid="resource-total-pages-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Total chapters</label>
          <input
            type="number"
            min="1"
            value={totalChapters}
            onChange={e => setTotalChapters(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            data-testid="resource-total-chapters-input"
          />
        </div>
      </div>

      {canGenerate && (
        <p className="text-xs text-forest-700 font-medium" data-testid="lesson-generation-hint">
          Lesson generation available — save this resource to generate lessons from it.
        </p>
      )}

      {courses.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Link to enrolled course(s)
          </label>
          <div className="flex flex-col gap-2" data-testid="resource-course-options">
            {courses.map(course => (
              <label key={course.id} className="flex items-center gap-2 cursor-pointer min-h-[32px]">
                <input
                  type="checkbox"
                  checked={selectedCourseIds.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                  className="rounded"
                  data-testid={`resource-course-checkbox-${course.id}`}
                />
                <span className="text-sm text-slate-700">{course.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save resource'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
