'use client'

import type { EvidenceItem } from '@/features/portfolio/types'
import { EvidenceListItem } from './EvidenceListItem'

interface Props {
  items: EvidenceItem[]
  childMap: Record<string, string>
  subjectMap: Record<string, string>
  loading: boolean
  error: string | null
  hasActiveFilters?: boolean
  onEdit?: (item: EvidenceItem) => void
}

export function EvidenceList({ items, childMap, subjectMap, loading, error, hasActiveFilters, onEdit }: Props) {
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
          onEdit={onEdit}
        />
      ))}
      {items.length === 50 && (
        <p className="text-xs text-slate-400 text-center pt-1">Showing 50 most recent items.</p>
      )}
    </div>
  )
}
