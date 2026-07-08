'use client'

import { useState } from 'react'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { childColors } from '@/features/dashboard/front/theme'

export function LearnerSwitcher() {
  const { studentProfiles } = useHousehold()
  const { selectedChildId, setSelectedChildId } = useLearner()
  const [open, setOpen] = useState(false)

  const activeLearners = studentProfiles.filter((c) => c.isActive !== false)
  if (activeLearners.length < 2) return null

  const selectedIndex = activeLearners.findIndex((c) => c.id === selectedChildId)
  const selectedLearner = selectedIndex >= 0 ? activeLearners[selectedIndex] : null
  const displayName = selectedLearner?.name ?? 'All children'
  const avatarColor = selectedLearner
    ? childColors[selectedIndex % childColors.length]
    : childColors[childColors.length - 1]
  const avatarInitial = selectedLearner ? selectedLearner.name.slice(0, 1).toUpperCase() : 'A'

  function choose(childId: string | null) {
    setSelectedChildId(childId)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Viewing learner"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="learner-switcher"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {avatarInitial}
        </span>
        <span className="max-w-[120px] truncate">{displayName}</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-0.5">
          Learner
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Learners"
          className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1"
        >
          <button
            role="option"
            aria-selected={selectedChildId === null}
            type="button"
            onClick={() => choose(null)}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${selectedChildId === null ? 'font-medium text-slate-900' : 'text-slate-600'}`}
          >
            All children
          </button>
          {activeLearners.map((c, i) => (
            <button
              key={c.id}
              role="option"
              aria-selected={c.id === selectedChildId}
              type="button"
              onClick={() => choose(c.id)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${c.id === selectedChildId ? 'font-medium text-slate-900' : 'text-slate-600'}`}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                style={{ backgroundColor: childColors[i % childColors.length] }}
              >
                {c.name.slice(0, 1).toUpperCase()}
              </span>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
