import { Check } from 'lucide-react'

interface ScoreQuestionProps {
  id: string
  label: string
  helper?: string
  value: number | null
  onChange: (value: number) => void
  lowLabel?: string
  highLabel?: string
  required?: boolean
}

export function ScoreQuestion({
  id,
  label,
  helper,
  value,
  onChange,
  lowLabel = '1',
  highLabel = '5',
  required = true,
}: ScoreQuestionProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-slate-900">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </legend>
      {helper && <p className="text-sm text-slate-500 -mt-1">{helper}</p>}
      <div className="flex justify-between text-xs text-slate-400 px-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby={`${id}-legend`}>
        {[1, 2, 3, 4, 5].map(n => {
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`${id}-score-${n}`}
              onClick={() => onChange(n)}
              className={`relative py-3 rounded-xl border text-sm font-semibold transition-colors ${
                selected
                  ? 'border-forest-900 bg-forest-50 text-forest-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {n}
              {selected && (
                <Check
                  className="absolute top-1 right-1 w-3.5 h-3.5 text-forest-900"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
