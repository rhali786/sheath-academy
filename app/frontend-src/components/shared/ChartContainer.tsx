
interface ChartContainerProps {
  children: React.ReactNode
  height?: number
  title?: string
}

export function ChartContainer({ children, height = 350, title }: ChartContainerProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }} className="w-full">
        {children}
      </div>
    </div>
  )
}
