'use client'

export type PlannerView = 'planner' | 'matrix'

interface PlannerViewToggleProps {
  view: PlannerView
  onChange: (view: PlannerView) => void
  /**
   * Opens the full calendar view (the existing /plan/schedule Week/Month calendar).
   * Calendar is a separate route, not a persisted planner/matrix in-page view, so it
   * navigates rather than setting `view` — it is never the selected tab on this page.
   */
  onOpenCalendar?: () => void
}

const OPTIONS: { id: PlannerView; label: string }[] = [
  { id: 'planner', label: 'Weekly Planner' },
  { id: 'matrix', label: 'Planning Matrix' },
]

export function PlannerViewToggle({ view, onChange, onOpenCalendar }: PlannerViewToggleProps) {
  const tabClass = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-forest-500 ${
      active
        ? 'border-forest-900 text-forest-900 bg-slate-50'
        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
    }`

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
          className={tabClass(view === opt.id)}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
      {onOpenCalendar && (
        <button
          type="button"
          role="tab"
          aria-selected={false}
          data-testid="planner-view-tab-calendar"
          className={tabClass(false)}
          onClick={onOpenCalendar}
        >
          Calendar
        </button>
      )}
    </div>
  )
}
