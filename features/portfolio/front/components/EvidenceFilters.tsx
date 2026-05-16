'use client'

import type { EvidenceType } from '@/features/portfolio/types'

interface Child {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  childId: string
}

interface Props {
  children: Child[]
  subjects: Subject[]
  selectedChildId: string | null
  selectedSubjectId: string | null
  selectedType: EvidenceType | null
  startDate: string | null
  endDate: string | null
  onChildChange(id: string | null): void
  onSubjectChange(id: string | null): void
  onTypeChange(type: EvidenceType | null): void
  onStartDateChange(date: string | null): void
  onEndDateChange(date: string | null): void
}

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'writing_sample', label: 'Writing Sample' },
  { value: 'project', label: 'Project' },
  { value: 'recitation', label: 'Recitation' },
  { value: 'other', label: 'Other' },
]

export function EvidenceFilters({
  children,
  subjects,
  selectedChildId,
  selectedSubjectId,
  selectedType,
  startDate,
  endDate,
  onChildChange,
  onSubjectChange,
  onTypeChange,
  onStartDateChange,
  onEndDateChange,
}: Props) {
  const filteredSubjects = selectedChildId
    ? subjects.filter(s => s.childId === selectedChildId)
    : subjects

  function handleChildChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value || null
    onChildChange(val)
    onSubjectChange(null)
  }

  function handleSubjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onSubjectChange(e.target.value || null)
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="filter-child">
          Child
        </label>
        <select
          id="filter-child"
          value={selectedChildId ?? ''}
          onChange={handleChildChange}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All children</option>
          {children.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="filter-subject">
          Subject
        </label>
        <select
          id="filter-subject"
          value={selectedSubjectId ?? ''}
          onChange={handleSubjectChange}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All subjects</option>
          {filteredSubjects.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="filter-type">
          Type
        </label>
        <select
          id="filter-type"
          value={selectedType ?? ''}
          onChange={e => onTypeChange((e.target.value || null) as EvidenceType | null)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">All types</option>
          {EVIDENCE_TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="filter-start-date">
          Start date
        </label>
        <input
          id="filter-start-date"
          type="date"
          value={startDate ?? ''}
          onChange={e => onStartDateChange(e.target.value || null)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="filter-end-date">
          End date
        </label>
        <input
          id="filter-end-date"
          type="date"
          value={endDate ?? ''}
          onChange={e => onEndDateChange(e.target.value || null)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>
    </div>
  )
}
