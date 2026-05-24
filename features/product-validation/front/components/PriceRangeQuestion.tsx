import type { ValidationPriceBucket } from '@/features/product-validation/types'

const BUCKETS: { value: ValidationPriceBucket; label: string }[] = [
  { value: '0', label: '$0' },
  { value: '5', label: '$5' },
  { value: '10', label: '$10' },
  { value: '15', label: '$15' },
  { value: '20', label: '$20' },
  { value: '30', label: '$30' },
  { value: '50', label: '$50' },
  { value: '75', label: '$75' },
  { value: '100_plus', label: '$100+' },
]

interface PriceRangeQuestionProps {
  value: ValidationPriceBucket | null
  onChange: (value: ValidationPriceBucket) => void
}

export function PriceRangeQuestion({ value, onChange }: PriceRangeQuestionProps) {
  const index = value ? BUCKETS.findIndex(b => b.value === value) : 0
  const display = BUCKETS[index]?.label ?? '$0'

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-slate-900">
        Monthly price that feels reasonable
        <span className="text-red-500 ml-0.5">*</span>
      </legend>
      <p className="text-sm text-slate-500">
        Research only — not a checkout or commitment. What monthly price would feel reasonable if
        Sheath Academy became part of your regular homeschool or tutoring workflow?
      </p>
      <p className="text-2xl font-bold text-forest-900 tabular-nums" aria-live="polite">
        {display}
        <span className="text-sm font-normal text-slate-500"> / month</span>
      </p>
      <input
        type="range"
        min={0}
        max={BUCKETS.length - 1}
        step={1}
        value={index}
        onChange={e => onChange(BUCKETS[Number(e.target.value)].value)}
        className="w-full accent-forest-900"
        aria-label="Reasonable monthly price"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>$0</span>
        <span>$100+</span>
      </div>
    </fieldset>
  )
}
