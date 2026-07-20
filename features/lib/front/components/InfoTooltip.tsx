'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
  testId?: string
}

/**
 * Small "i" icon that shows an explanatory tooltip on hover or keyboard focus.
 * Unlike a native title="" attribute (easy to miss, no visible affordance), this renders a
 * visible floating panel so the explanation actually reads as a tooltip.
 */
export function InfoTooltip({ text, testId }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More information"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        data-testid={testId}
        className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-forest-500 rounded-full"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-56 rounded-lg bg-slate-900 text-white text-xs leading-snug px-2.5 py-1.5 shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  )
}
