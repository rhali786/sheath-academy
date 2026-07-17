'use client'

export type PlannerView = 'planner' | 'matrix'

interface PlannerViewToggleProps {
  view: PlannerView
  onChange: (view: PlannerView) => void
}

const OPTIONS: { id: PlannerView; label: string }[] = [
  { id: 'planner', label: 'Weekly Planner' },
  { id: 'matrix', label: 'Planning Matrix' },
]

export function PlannerViewToggle({ view, onChange }: PlannerViewToggleProps) {
  return (
    <div
      className="inline-flex gap-1 border-b border-slate-200"
      role="tablist"
      aria-label="Planner view"
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={view === opt.id}
          data-testid={`planner-view-tab-${opt.id}`}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-forest-500 ${
            view === opt.id
              ? 'border-forest-900 text-forest-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
