interface ChartContainerProps {
  children: React.ReactNode
  height?: number
  title?: string
}

export function ChartContainer({ children, height = 280, title }: ChartContainerProps) {
  return (
    <div className="w-full">
      {title && (
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">{title}</p>
      )}
      <div style={{ height: `${height}px` }} className="w-full">
        {children}
      </div>
    </div>
  )
}
