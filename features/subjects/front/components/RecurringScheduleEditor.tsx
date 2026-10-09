'use client'

import type { DayOfWeek } from '@/features/lib/types'
import type { RecurringScheduleBlock } from '@/features/subjects/types'

/**
 * A course's recurring weekly time(s) — shared by the create form (SubjectForm) and
 * the edit dialog (SubjectEditDialog). Before this was shared, a course's time could
 * only be set when it was created (UAT 4.6: "change the course time" was impossible).
 */

const ALL_DAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export interface ScheduleBlockDraft {
  daysOfWeek: DayOfWeek[]
  startTime: string
  endTime: string
}

export function emptyBlock(): ScheduleBlockDraft {
  return { daysOfWeek: [], startTime: '', endTime: '' }
}

/** A block is only submitted once it has at least one day and both times set. */
export function isCompleteBlock(b: ScheduleBlockDraft): b is RecurringScheduleBlock {
  return b.daysOfWeek.length > 0 && !!b.startTime && !!b.endTime
}

/** Editor state for an existing course's schedule (enabled when it has one). */
export function draftFromSchedule(schedule: RecurringScheduleBlock[] | undefined | null): {
  enabled: boolean
  blocks: ScheduleBlockDraft[]
} {
  if (!schedule || schedule.length === 0) return { enabled: false, blocks: [emptyBlock()] }
  return { enabled: true, blocks: schedule.map(b => ({ ...b, daysOfWeek: [...b.daysOfWeek] })) }
}

interface RecurringScheduleEditorProps {
  /** Unique per editor instance — the add form and edit dialog can be open together. */
  idPrefix: string
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  blocks: ScheduleBlockDraft[]
  onBlocksChange: (blocks: ScheduleBlockDraft[]) => void
}

export function RecurringScheduleEditor({ idPrefix, enabled, onEnabledChange, blocks, onBlocksChange }: RecurringScheduleEditorProps) {
  function toggleBlockDay(index: number, day: DayOfWeek) {
    onBlocksChange(
      blocks.map((b, i) =>
        i !== index
          ? b
          : { ...b, daysOfWeek: b.daysOfWeek.includes(day) ? b.daysOfWeek.filter(d => d !== day) : [...b.daysOfWeek, day] }
      )
    )
  }

  function updateBlockTime(index: number, field: 'startTime' | 'endTime', value: string) {
    onBlocksChange(blocks.map((b, i) => (i !== index ? b : { ...b, [field]: value })))
  }

  function addBlock() {
    onBlocksChange([...blocks, emptyBlock()])
  }

  function removeBlock(index: number) {
    onBlocksChange(blocks.length <= 1 ? [emptyBlock()] : blocks.filter((_, i) => i !== index))
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onEnabledChange(!enabled)}
        aria-pressed={enabled}
        className="text-xs font-medium text-forest-800 hover:underline"
        data-testid="recurring-schedule-toggle"
      >
        {enabled ? 'Remove recurring weekly schedule' : '+ Add recurring weekly schedule (optional)'}
      </button>

      {enabled && (
        <div className="mt-2 space-y-3" data-testid="recurring-schedule-editor">
          {blocks.map((block, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-2" data-testid={`recurring-block-${index}`}>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={block.daysOfWeek.includes(day)}
                      onChange={() => toggleBlockDay(index, day)}
                      className="rounded"
                      data-testid={`recurring-day-${day}-${index}`}
                    />
                    <span className="text-xs text-slate-600">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${idPrefix}-recurring-start-${index}`} className="block text-xs font-medium text-slate-600 mb-1">
                    Start time
                  </label>
                  <input
                    id={`${idPrefix}-recurring-start-${index}`}
                    type="time"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    value={block.startTime}
                    onChange={(e) => updateBlockTime(index, 'startTime', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={`${idPrefix}-recurring-end-${index}`} className="block text-xs font-medium text-slate-600 mb-1">
                    End time
                  </label>
                  <input
                    id={`${idPrefix}-recurring-end-${index}`}
                    type="time"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    value={block.endTime}
                    onChange={(e) => updateBlockTime(index, 'endTime', e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeBlock(index)}
                className="text-xs text-red-600 hover:underline"
                data-testid={`recurring-remove-block-${index}`}
              >
                Remove time block
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBlock}
            className="text-xs text-forest-800 hover:underline"
            data-testid="recurring-add-block"
          >
            + Add another time block
          </button>
        </div>
      )}
    </div>
  )
}
