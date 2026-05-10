interface QuranProgressRingProps {
  streak: number
  juzProgress?: number  // 0–30; drives the arc fill
  size?: number
}

export function QuranProgressRing({ streak, juzProgress = 0, size = 88 }: QuranProgressRingProps) {
  const cx = size / 2
  const cy = size / 2
  const radius = cx - 9
  const circumference = 2 * Math.PI * radius
  const progress = Math.min((juzProgress || 0) / 30, 1)
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${streak} day streak`}
    >
      {/* Track ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#dcf0e5" strokeWidth="7" />

      {/* Progress arc — only rendered when there's something to show */}
      {progress > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#1a5c3a"
          strokeWidth="7"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${strokeDashoffset}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}

      {/* Streak number */}
      <text
        x={cx}
        y={cy - size * 0.07}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.24}
        fontWeight="700"
        fill="#1a5c3a"
        fontFamily="var(--font-inter), Inter, sans-serif"
      >
        {streak}
      </text>

      {/* Label */}
      <text
        x={cx}
        y={cy + size * 0.2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.12}
        fill="#94a3b8"
        fontFamily="var(--font-inter), Inter, sans-serif"
        letterSpacing="0.5"
      >
        days
      </text>
    </svg>
  )
}
