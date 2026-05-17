import type { EvidenceItem, CreateEvidenceItemInput, EvidenceType } from '../types'
import { evidenceStore } from './store'
import { SEED_EVIDENCE } from './seed'
import { generateEvidenceId, resetIdCounter } from './ids'
import { validateEvidenceInput } from './validation'
import type { ValidationError } from './validation'
import { getStudentProfile } from '@/features/children/server/service'
import { getSubject } from '@/features/subjects/server/service'
import { getLessonTask } from '@/features/plan/server/service'

const deps = { getStudentProfile, getSubject, getLessonTask }

export function listEvidenceItems(filters?: {
  childId?: string
  subjectId?: string
  lessonTaskId?: string
  type?: EvidenceType
  startDate?: string
  endDate?: string
}): EvidenceItem[] {
  let items = evidenceStore.getAll()
  if (filters?.childId) {
    items = items.filter(i => i.childId === filters.childId)
  }
  if (filters?.subjectId) {
    items = items.filter(i => i.subjectId === filters.subjectId)
  }
  if (filters?.lessonTaskId) {
    items = items.filter(i => i.lessonTaskId === filters.lessonTaskId)
  }
  if (filters?.type) {
    items = items.filter(i => i.type === filters.type)
  }
  if (filters?.startDate) {
    items = items.filter(i => i.date >= filters.startDate!)
  }
  if (filters?.endDate) {
    items = items.filter(i => i.date <= filters.endDate!)
  }
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return sorted.slice(0, 50)
}

export function getEvidenceItemById(id: string): EvidenceItem | undefined {
  return evidenceStore.getById(id)
}

export function createEvidenceItem(
  input: CreateEvidenceItemInput
): { item: EvidenceItem | null; errors: ValidationError[] } {
  const errors = validateEvidenceInput(input, deps)
  if (errors.length > 0) {
    return { item: null, errors }
  }
  const now = new Date().toISOString()
  const item: EvidenceItem = {
    id: generateEvidenceId(),
    title: input.title.trim(),
    childId: input.childId,
    subjectId: input.subjectId,
    date: input.date,
    type: input.type,
    notes: input.notes,
    reflection: input.reflection?.trim() || undefined,
    url: input.url,
    lessonTaskId: input.lessonTaskId,
    createdBy: 'system',
    createdAt: now,
    updatedAt: now,
  }
  evidenceStore.insert(item)
  return { item, errors: [] }
}

export function updateEvidenceItem(
  id: string,
  patch: Partial<CreateEvidenceItemInput>
): { item: EvidenceItem | null; errors: ValidationError[] } {
  const existing = evidenceStore.getById(id)
  if (!existing) {
    return { item: null, errors: [{ field: 'id', message: 'Evidence item not found' }] }
  }
  const merged: CreateEvidenceItemInput = {
    title: patch.title ?? existing.title,
    childId: patch.childId ?? existing.childId,
    subjectId: patch.subjectId ?? existing.subjectId,
    date: patch.date ?? existing.date,
    type: patch.type ?? existing.type,
    notes: patch.notes !== undefined ? patch.notes : existing.notes,
    reflection: patch.reflection !== undefined ? patch.reflection?.trim() || undefined : existing.reflection,
    url: patch.url !== undefined ? patch.url : existing.url,
    lessonTaskId: patch.lessonTaskId !== undefined ? patch.lessonTaskId : existing.lessonTaskId,
  }
  const errors = validateEvidenceInput(merged, deps)
  if (errors.length > 0) {
    return { item: null, errors }
  }
  const updated = evidenceStore.update(id, {
    ...merged,
    updatedAt: new Date().toISOString(),
  })
  return { item: updated, errors: [] }
}

export function deleteEvidenceItem(id: string): boolean {
  return evidenceStore.remove(id)
}

export function listEvidenceByChild(childId: string): EvidenceItem[] {
  return listEvidenceItems({ childId })
}

export function listEvidenceBySubject(
  childId: string | undefined,
  subjectId: string
): EvidenceItem[] {
  return evidenceStore
    .getAll()
    .filter(i => i.subjectId === subjectId && (childId === undefined || i.childId === childId))
}

export function listEvidenceByLessonTask(lessonTaskId: string): EvidenceItem[] {
  return listEvidenceItems({ lessonTaskId })
}

// Evidence items are historical records preserved for reporting; no isActive field.
export function archiveByChildId(_childId: string): void {}

export function resetEvidenceStore(): void {
  evidenceStore.reset(SEED_EVIDENCE)
  resetIdCounter()
}
