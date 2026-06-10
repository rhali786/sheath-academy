export interface ChartLegendItem {
  label: string
  color: string
  count?: number
}

interface ChartLegendProps {
  items: ChartLegendItem[]
  testId?: string
}

/** Small horizontal legend: color swatch + label, with an optional per-series count. */
export function ChartLegend({ items, testId }: ChartLegendProps) {
  if (items.length === 0) return null
  return (
    <ul data-testid={testId} className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-2 text-xs text-slate-600">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-medium">{item.label}</span>
          {typeof item.count === 'number' && (
            <span className="text-slate-400">{item.count}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
