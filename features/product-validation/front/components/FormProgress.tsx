interface FormProgressProps {
  step: number
  totalSteps: number
  sectionLabel: string
}

export function FormProgress({ step, totalSteps, sectionLabel }: FormProgressProps) {
  const pct = Math.round((step / totalSteps) * 100)
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span className="font-semibold uppercase tracking-widest">
          Step {step} of {totalSteps}
        </span>
        <span>{sectionLabel}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden" aria-hidden="true">
        <div
          className="h-full bg-forest-900 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
