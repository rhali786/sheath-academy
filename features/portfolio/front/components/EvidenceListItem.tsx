'use client'

import type { EvidenceItem, EvidenceType } from '@/features/portfolio/types'

const TYPE_LABELS: Record<EvidenceType, string> = {
  note: 'Note',
  link: 'Link',
  writing_sample: 'Writing Sample',
  project: 'Project',
  recitation: 'Recitation',
  other: 'Other',
}

const TYPE_COLORS: Record<EvidenceType, string> = {
  note: 'bg-blue-100 text-blue-800',
  link: 'bg-purple-100 text-purple-800',
  writing_sample: 'bg-green-100 text-green-800',
  project: 'bg-yellow-100 text-yellow-800',
  recitation: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

interface Props {
  item: EvidenceItem
  childName: string
  subjectName: string
}

export function EvidenceListItem({ item, childName, subjectName }: Props) {
  const notesPreview = item.notes && item.notes.length > 80
    ? item.notes.slice(0, 80) + '…'
    : item.notes

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${TYPE_COLORS[item.type]}`}
        >
          {TYPE_LABELS[item.type]}
        </span>
      </div>

      <div className="flex gap-4 text-xs text-gray-500">
        <span>{childName}</span>
        <span>{subjectName}</span>
        <span>{item.date}</span>
      </div>

      {notesPreview && (
        <p className="text-sm text-gray-600">{notesPreview}</p>
      )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline break-all"
        >
          {item.url}
        </a>
      )}

      {item.lessonTaskId && (
        <div className="text-xs text-gray-400 italic">Linked to lesson</div>
      )}
    </div>
  )
}
