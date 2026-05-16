import type { CreateEvidenceItemInput, EvidenceType } from '../types'

export interface ValidationDeps {
  getStudentProfile(id: string): { id: string } | null
  getSubject(id: string): { id: string; childId: string } | null
  getLessonTask(id: string): { id: string; childId: string } | undefined
}

export interface ValidationError {
  field: string
  message: string
}

const VALID_TYPES: EvidenceType[] = [
  'note',
  'link',
  'writing_sample',
  'project',
  'recitation',
  'other',
]

export function validateEvidenceInput(
  input: CreateEvidenceItemInput,
  deps: ValidationDeps
): ValidationError[] {
  const errors: ValidationError[] = []

  const trimmedTitle = (input.title ?? '').trim()
  if (!trimmedTitle) {
    errors.push({ field: 'title', message: 'Title is required' })
  } else if (trimmedTitle.length > 120) {
    errors.push({ field: 'title', message: 'Title must be 120 characters or fewer' })
  }

  if (!input.childId || !deps.getStudentProfile(input.childId)) {
    errors.push({ field: 'childId', message: 'Child not found' })
  }

  const subject = input.subjectId ? deps.getSubject(input.subjectId) : null
  if (!subject) {
    errors.push({ field: 'subjectId', message: 'Subject not found' })
  } else if (subject.childId !== input.childId) {
    errors.push({ field: 'subjectId', message: 'Subject does not belong to the selected child' })
  }

  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.push({ field: 'date', message: 'Date must be in YYYY-MM-DD format' })
  }

  if (!VALID_TYPES.includes(input.type)) {
    errors.push({ field: 'type', message: `Type must be one of: ${VALID_TYPES.join(', ')}` })
  }

  if (input.url) {
    if (!input.url.startsWith('http://') && !input.url.startsWith('https://')) {
      errors.push({ field: 'url', message: 'URL must start with http:// or https://' })
    }
  }

  if (input.type === 'link' && !input.url) {
    errors.push({ field: 'url', message: 'URL is required for link type evidence' })
  }

  if (input.type === 'note' && !input.notes && !input.url) {
    errors.push({ field: 'notes', message: 'Notes or URL is required for note type evidence' })
  }

  if (input.lessonTaskId) {
    const lessonTask = deps.getLessonTask(input.lessonTaskId)
    if (!lessonTask) {
      errors.push({ field: 'lessonTaskId', message: 'Lesson task not found' })
    } else if (lessonTask.childId !== input.childId) {
      errors.push({ field: 'lessonTaskId', message: 'Lesson task does not belong to the selected child' })
    }
  }

  return errors
}
