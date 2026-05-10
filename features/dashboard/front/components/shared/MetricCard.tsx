interface MetricCardProps {
  label: string
  value: string | number
  statusColor: 'green' | 'amber' | 'red' | 'blue' | 'gray'
}

const colorMap = {
  green: { numeral: 'text-forest-900', bar: 'bg-forest-700' },
  amber: { numeral: 'text-amber-700',  bar: 'bg-amber-500' },
  red:   { numeral: 'text-red-600',    bar: 'bg-red-500' },
  blue:  { numeral: 'text-sky-600',    bar: 'bg-sky-500' },
  gray:  { numeral: 'text-slate-500',  bar: 'bg-slate-400' },
}

export function MetricCard({ label, value, statusColor }: MetricCardProps) {
  const c = colorMap[statusColor]

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 leading-none">
        {label}
      </p>
      <p className={`text-4xl font-bold leading-none tabular-nums ${c.numeral}`}>
        {value}
      </p>
      <div className={`mt-4 h-0.5 w-8 rounded-full ${c.bar}`} />
    </div>
  )
}
