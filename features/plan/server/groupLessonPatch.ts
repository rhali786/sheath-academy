/**
 * A shared lesson is one row per learner, linked by group_id. When a parent edits one
 * copy with "apply to all learners" ticked, what the lesson *is* follows the group, but
 * *when* it happens stays with this learner unless they also ask to move everyone —
 * moving one sick child's lesson must not move the others. Status, learner and course
 * always belong to this learner's row.
 */

const SCHEDULE_FIELDS = ['dueDate', 'plannedStartDate', 'scheduledStartTime', 'scheduledEndTime'] as const
const ROW_ONLY_FIELDS = ['status', 'sortOrder', 'learnerId', 'subjectId'] as const

export interface GroupLessonPatchOptions {
  applyToGroup?: boolean
  /** Also move date/time for every learner. Ignored unless applyToGroup is set. */
  applyScheduleToGroup?: boolean
}

type Patch = Record<string, unknown>

export function splitGroupLessonPatch(patch: Patch, options: GroupLessonPatchOptions): { group: Patch; row: Patch } {
  const group: Patch = {}
  const row: Patch = {}
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    const rowOnly = (ROW_ONLY_FIELDS as readonly string[]).includes(key)
    const schedule = (SCHEDULE_FIELDS as readonly string[]).includes(key)
    const toGroup = options.applyToGroup && !rowOnly && (!schedule || options.applyScheduleToGroup)
    if (toGroup) group[key] = value
    else row[key] = value
  }
  return { group, row }
}
