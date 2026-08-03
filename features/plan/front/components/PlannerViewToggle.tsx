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

/**
 * Display-mode control for the Weekly Planner ("By learner" list view only — Planning Matrix
 * already shows every learner combined by construction, so this toggle is out of scope there).
 * "By learner" (default) is the existing stacked-per-child layout; "By day" groups every
 * learner's lessons for a given date together in one column, color-coded via learnerColor().
 * This is intentionally a separate, small control from PlannerViewToggle above — it toggles a
 * display mode *within* the Weekly Planner view, not which top-level view (planner/matrix) is
 * shown, and must not be confused with or replace the existing two-tab semantics.
 */
export type PlannerDisplayMode = 'byLearner' | 'byDay'

interface DisplayModeToggleProps {
  mode: PlannerDisplayMode
  onChange: (mode: PlannerDisplayMode) => void
}

const DISPLAY_MODE_OPTIONS: { id: PlannerDisplayMode; label: string }[] = [
  { id: 'byLearner', label: 'By learner' },
  { id: 'byDay', label: 'By day' },
]

export function DisplayModeToggle({ mode, onChange }: DisplayModeToggleProps) {
  const optionClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500 ${
      active ? 'bg-forest-900 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
    }`

  return (
    <div
      className="inline-flex gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200"
      role="group"
      aria-label="Weekly Planner display mode"
    >
      {DISPLAY_MODE_OPTIONS.map(opt => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={mode === opt.id}
          data-testid={`planner-display-mode-${opt.id}`}
          className={optionClass(mode === opt.id)}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
