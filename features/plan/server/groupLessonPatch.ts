/**
 * A shared lesson is one row per learner, linked by group_id. When a parent edits one
 * copy with "apply to all learners" ticked, what the lesson *is* follows the group, but
 * *when* it happens stays with this learner unless they also ask to move everyone —
 * moving one sick child's lesson must not move the others. Status, learner and course
 * always belong to this learner's row.
 *
 * The editors send every field on save, not just the ones the parent touched. So, given the
 * copy being edited, only fields that differ from it — what the parent actually changed —
 * are copied to the other learners. Otherwise "move the time for everyone" also copied this
 * learner's untouched date and undid another learner's own day (UAT 2.4), and a group edit
 * of the description reset another learner's own title.
 */

const SCHEDULE_FIELDS = ['dueDate', 'plannedStartDate', 'scheduledStartTime', 'scheduledEndTime'] as const
const ROW_ONLY_FIELDS = ['status', 'sortOrder', 'learnerId', 'subjectId'] as const

export interface GroupLessonPatchOptions {
  applyToGroup?: boolean
  /** Also move date/time for every learner. Ignored unless applyToGroup is set. */
  applyScheduleToGroup?: boolean
}

/** Fields that only make sense together: a new start time goes out with its end time. */
const PAIRED_FIELDS: Record<string, string> = {
  scheduledStartTime: 'scheduledEndTime',
  scheduledEndTime: 'scheduledStartTime',
  dueDate: 'plannedStartDate',
  plannedStartDate: 'dueDate',
}

type Patch = Record<string, unknown>

/** Blank is blank: '' from a cleared input, null in the row, false for an unticked box. */
function sameValue(a: unknown, b: unknown): boolean {
  const blank = (v: unknown) => v === undefined || v === null || v === '' || v === false
  return (blank(a) && blank(b)) || a === b
}

/**
 * @param current the copy being edited, as stored. Without it every sent field counts as
 *   changed.
 */
export function splitGroupLessonPatch(
  patch: Patch,
  options: GroupLessonPatchOptions,
  current?: Patch,
): { group: Patch; row: Patch } {
  const changed = (key: string) => !current || !sameValue(patch[key], current[key])
  const group: Patch = {}
  const row: Patch = {}
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    const rowOnly = (ROW_ONLY_FIELDS as readonly string[]).includes(key)
    const schedule = (SCHEDULE_FIELDS as readonly string[]).includes(key)
    const partner = PAIRED_FIELDS[key]
    const edited = changed(key) || (partner !== undefined && patch[partner] !== undefined && changed(partner))
    const toGroup = options.applyToGroup && !rowOnly && (!schedule || options.applyScheduleToGroup) && edited
    if (toGroup) group[key] = value
    else row[key] = value
  }
  return { group, row }
}
