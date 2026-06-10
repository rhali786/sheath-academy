'use client'

import type { EvidenceItem, CreateEvidenceItemInput } from '@/features/portfolio/types'
import { EvidenceListItem } from './EvidenceListItem'

interface ChildOption { id: string; name: string }
interface SubjectOption { id: string; name: string; childId: string }
interface LessonOption { id: string; title: string; dueDate: string; childId: string; subjectId: string }

interface Props {
  items: EvidenceItem[]
  childMap: Record<string, string>
  subjectMap: Record<string, string>
  loading: boolean
  error: string | null
  hasActiveFilters?: boolean
  /** When provided, enables inline edit expansion on each card */
  onUpdate?: (id: string, patch: Partial<CreateEvidenceItemInput>) => Promise<void>
  /** When provided, enables inline delete confirmation on each card */
  onDelete?: (id: string) => Promise<void>
  /** When provided, shows attachment remove button on each card */
  onDeleteAttachment?: (attachmentId: string) => Promise<void>
  /** When provided, shows file input in edit mode on each card */
  onUploadAttachment?: (evidenceId: string, file: File) => Promise<void>
  /** Legacy: called when card is clicked (top-form pattern) */
  onEdit?: (item: EvidenceItem) => void
  /** Options for the edit form dropdowns */
  childOptions?: ChildOption[]
  subjects?: SubjectOption[]
  lessons?: LessonOption[]
}

export function EvidenceList({ items, childMap, subjectMap, loading, error, hasActiveFilters, onUpdate, onDelete, onDeleteAttachment, onUploadAttachment, onEdit, childOptions, subjects, lessons }: Props) {
  if (loading) {
    return <p className="text-gray-500 text-sm py-4">Loading portfolio...</p>
  }

  if (error) {
    return <p className="text-red-600 text-sm py-4">{error}</p>
  }

  if (items.length === 0) {
    return hasActiveFilters ? (
      <div className="text-center py-8 text-gray-500 text-sm space-y-1">
        <p>No evidence matches these filters.</p>
        <p>Try changing the child, subject, type, or date range.</p>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500 text-sm space-y-1">
        <p>No portfolio evidence yet.</p>
        <p>Add a note or link to preserve proof of learning.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <EvidenceListItem
          key={item.id}
          item={item}
          childName={childMap[item.childId] ?? item.childId}
          subjectName={subjectMap[item.subjectId] ?? item.subjectId}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDeleteAttachment={onDeleteAttachment}
          onUploadAttachment={onUploadAttachment}
          onEdit={onEdit}
          childOptions={childOptions}
          subjects={subjects}
          lessons={lessons}
        />
      ))}
      {items.length === 50 && (
        <p className="text-xs text-slate-400 text-center pt-1">Showing 50 most recent items.</p>
      )}
    </div>
  )
}
