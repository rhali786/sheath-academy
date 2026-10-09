'use client'

/**
 * A lesson's own start/end time — shared by every lesson editor (the add/edit form
 * and the LessonCard inline editor) so they cannot drift apart again (UAT 4.5:
 * the inline editor, reached from the Calendar and Planner, had no time fields).
 *
 * Values are the 24-hour "HH:MM" strings the rest of the system stores; '' = no
 * time of its own, i.e. the lesson uses its course's recurring time.
 */

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

/** Splits a 24-hour "HH:MM" string into 12-hour parts. Empty/undefined input yields a blank hour. */
function timeToParts(time: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  if (!time) return { hour: '', minute: '00', period: 'AM' }
  const [hStr, mStr] = time.split(':')
  const h24 = parseInt(hStr, 10)
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return { hour: String(h12), minute: mStr ?? '00', period }
}

/** Combines 12-hour parts back into the 24-hour "HH:MM" string the rest of the app expects. An empty hour yields ''. */
function partsToTime(hour: string, minute: string, period: 'AM' | 'PM'): string {
  if (!hour) return ''
  let h = parseInt(hour, 10) % 12
  if (period === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${minute}`
}

interface TimePicker12hProps {
  idPrefix: string
  label: string
  value: string
  onChange: (value: string) => void
}

/** Custom 12-hour time control (hour/minute/period selects) that stores/reads the same 24-hour "HH:MM" string the rest of the system expects. */
function TimePicker12h({ idPrefix, label, value, onChange }: TimePicker12hProps) {
  const parts = timeToParts(value)

  function update(next: Partial<{ hour: string; minute: string; period: 'AM' | 'PM' }>) {
    const hour = next.hour ?? parts.hour
    const minute = next.minute ?? parts.minute
    const period = next.period ?? parts.period
    onChange(partsToTime(hour, minute, period))
  }

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label} <span className="text-slate-400 font-normal">(optional)</span>
      </span>
      <div className="flex items-center gap-1">
        <select
          id={`${idPrefix}-hour`}
          aria-label={`${label} hour`}
          value={parts.hour}
          onChange={e => update({ hour: e.target.value })}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          <option value="">--</option>
          {HOURS_12.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-slate-400" aria-hidden="true">:</span>
        <select
          id={`${idPrefix}-minute`}
          aria-label={`${label} minute`}
          value={parts.minute}
          onChange={e => update({ minute: e.target.value })}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          {MINUTES_5.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          id={`${idPrefix}-period`}
          aria-label={`${label} period`}
          value={parts.period}
          onChange={e => update({ period: e.target.value as 'AM' | 'PM' })}
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}

/** Returns the error to show for a start/end pair, or null when it is valid (both set, or both blank). */
export function validateLessonTimes(start: string, end: string): string | null {
  const s = start.trim()
  const e = end.trim()
  if (Boolean(s) !== Boolean(e)) return 'Enter both a start and end time, or leave both blank'
  if (s && e && e <= s) return 'End time must be after start time'
  return null
}

interface LessonTimeFieldsProps {
  /** Unique per editor instance — several editors can be open on one page. */
  idPrefix: string
  start: string
  end: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  error?: string
}

export function LessonTimeFields({ idPrefix, start, end, onStartChange, onEndChange, error }: LessonTimeFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <TimePicker12h idPrefix={`${idPrefix}-start`} label="Start time" value={start} onChange={onStartChange} />
      <TimePicker12h idPrefix={`${idPrefix}-end`} label="End time" value={end} onChange={onEndChange} />
      {error && <p className="text-xs text-red-600 -mt-2 sm:col-span-2">{error}</p>}
    </div>
  )
}
