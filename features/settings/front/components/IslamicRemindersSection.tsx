'use client'

import type { IslamicEventName } from '@/features/islamic-calendar/types'
import { useIslamicReminderSettings } from '@/features/islamic-calendar/front/lib/useIslamicReminderSettings'

const REMINDER_LABELS: Record<IslamicEventName, string> = {
  'Ramadan': 'Ramadan',
  'Eid al-Fitr': 'Eid al-Fitr',
  'Eid al-Adha': 'Eid al-Adha',
  'Day of Arafah': 'Day of Arafah',
  'Ashura': 'Ashura (10 Muharram)',
  'White Days': 'White Days (13th–15th of each month)',
  'Sacred Month': 'Sacred Months (Muharram, Rajab, Dhul-Qi\'dah, Dhul-Hijjah)',
}

const ALL_REMINDERS = Object.keys(REMINDER_LABELS) as IslamicEventName[]

export function IslamicRemindersSection() {
  const { enabled, toggle } = useIslamicReminderSettings()

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Islamic calendar reminders</h3>
      <p className="text-xs text-slate-500 mb-3">
        Choose which Islamic events appear on your Today dashboard.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 max-w-md">
        {ALL_REMINDERS.map(name => (
          <label key={name} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled[name]}
              onChange={() => toggle(name)}
              className="w-4 h-4 rounded border-slate-300 text-forest-900 focus:ring-forest-900"
            />
            <span className="text-sm text-slate-700">{REMINDER_LABELS[name]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
