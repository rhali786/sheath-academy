'use client'

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
  onChildChange(id: string | null): void
  onSubjectChange(id: string | null): void
}

export function EvidenceFilters({
  children,
  subjects,
  selectedChildId,
  selectedSubjectId,
  onChildChange,
  onSubjectChange,
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
    </div>
  )
}
