
interface MetricCardProps {
  label: string
  value: string | number
  statusColor: 'green' | 'amber' | 'red' | 'blue' | 'gray'
}

const colorMap = {
  green: { bg: 'bg-green-50', badge: 'badge-green', icon: 'text-green-600' },
  amber: { bg: 'bg-amber-50', badge: 'badge-amber', icon: 'text-amber-600' },
  red: { bg: 'bg-red-50', badge: 'badge-red', icon: 'text-red-600' },
  blue: { bg: 'bg-blue-50', badge: 'badge-blue', icon: 'text-blue-600' },
  gray: { bg: 'bg-gray-50', badge: 'badge-gray', icon: 'text-gray-600' },
}

export function MetricCard({ label, value, statusColor }: MetricCardProps) {
  const colors = colorMap[statusColor]

  return (
    <div className={`card ${colors.bg}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className={`text-2xl font-bold ${colors.icon}`}>{value}</p>
      </div>
    </div>
  )
}
