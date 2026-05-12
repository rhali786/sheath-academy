'use client'

import { useContext_Dashboard } from '../context'

export function ChildSelector() {
  const { children, selectedChildId, setSelectedChildId } = useContext_Dashboard()

  if (children.length < 2) {
    return null
  }

  return (
    <div className="flex items-center gap-2" data-testid="child-selector">
      <label htmlFor="child-selector-select" className="text-xs font-medium text-slate-600 whitespace-nowrap">
        Viewing
      </label>
      <select
        id="child-selector-select"
        className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-800 min-w-[10rem]"
        value={selectedChildId ?? ''}
        onChange={(e) => {
          const v = e.target.value
          setSelectedChildId(v === '' ? null : v)
        }}
      >
        <option value="">All children</option>
        {children.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
