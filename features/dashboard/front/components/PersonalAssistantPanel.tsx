'use client'

import Link from 'next/link'
import { Sparkles, CalendarClock, BookPlus, ShieldCheck } from 'lucide-react'
import type { AssistantInsight } from '../lib/assistantRules'

const CHECKLIST = [
  { label: 'Reschedule lessons', href: '/plan', icon: CalendarClock },
  { label: 'Add enrichment', href: '/lessons', icon: BookPlus },
  { label: 'Check compliance', href: '/settings?tab=records-compliance', icon: ShieldCheck },
] as const

interface PersonalAssistantPanelProps {
  insight?: AssistantInsight | null
}

const FALLBACK_INSIGHT = {
  title: 'No major schedule risks',
  message: 'Today looks balanced. Use Review Suggestions if you want to make small improvements.',
  href: '/plan',
} satisfies Pick<AssistantInsight, 'title' | 'message' | 'href'>

export function PersonalAssistantPanel({ insight = null }: PersonalAssistantPanelProps) {
  const activeInsight = insight ?? FALLBACK_INSIGHT

  return (
    <section
      className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 mb-6"
      data-testid="personal-assistant-panel"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-violet-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" aria-hidden="true" />
          Personal Assistant
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
          Beta
        </span>
      </div>

      <div className="rounded-lg border border-violet-100 bg-white/80 p-3 mb-4">
        <p className="text-xs font-semibold text-violet-800 mb-1">{activeInsight.title}</p>
        <p className="text-xs text-slate-600 leading-relaxed">
          {activeInsight.message}
        </p>
      </div>

      <Link
        href={activeInsight.href}
        className="block w-full text-center text-sm font-medium py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors mb-4"
        data-testid="personal-assistant-review"
      >
        Review Suggestions
      </Link>

      <ul className="space-y-2">
        {CHECKLIST.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-violet-800 transition-colors"
            >
              <Icon className="h-4 w-4 text-violet-500 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
