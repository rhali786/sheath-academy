export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Enforces plannedStartDate <= dueDate (US1, L5).
 * Null/undefined plannedStartDate is treated as dueDate (single-day, always valid).
 */
export function validateLessonWindow(
  plannedStartDate: string | null | undefined,
  dueDate: string,
): ValidationResult {
  if (!dueDate) {
    return { valid: false, error: 'dueDate is required' }
  }
  if (!plannedStartDate) {
    return { valid: true }
  }
  if (plannedStartDate > dueDate) {
    return { valid: false, error: 'plannedStartDate must be before or equal to dueDate' }
  }
  return { valid: true }
}

/**
 * Enforces the scheduledStartTime/scheduledEndTime override pair: both set or
 * neither (a single time with no matching start/end is meaningless for a
 * duration), and when both are set, end must be strictly after start.
 * Values are 'HH:MM' 24-hour strings.
 */
export function validateScheduleTimeWindow(
  scheduledStartTime: string | null | undefined,
  scheduledEndTime: string | null | undefined,
): ValidationResult {
  const hasStart = scheduledStartTime !== null && scheduledStartTime !== undefined && scheduledStartTime !== ''
  const hasEnd = scheduledEndTime !== null && scheduledEndTime !== undefined && scheduledEndTime !== ''

  if (!hasStart && !hasEnd) {
    return { valid: true }
  }
  if (hasStart !== hasEnd) {
    return { valid: false, error: 'scheduledStartTime and scheduledEndTime must both be set or both be cleared' }
  }
  if (scheduledEndTime! <= scheduledStartTime!) {
    return { valid: false, error: 'scheduledEndTime must be after scheduledStartTime' }
  }
  return { valid: true }
}

/**
 * Compute new plannedStartDate when a lesson is dragged to a new dueDate.
 * Preserves the window span so plannedStartDate <= dueDate holds by construction.
 */
export function shiftLessonWindow(
  prevPlannedStartDate: string | null | undefined,
  prevDueDate: string,
  newDueDate: string,
): { plannedStartDate: string | null; dueDate: string } {
  if (!prevPlannedStartDate) {
    return { plannedStartDate: null, dueDate: newDueDate }
  }
  const spanMs = new Date(prevDueDate).getTime() - new Date(prevPlannedStartDate).getTime()
  const newDueMs = new Date(newDueDate).getTime()
  const newStartMs = newDueMs - spanMs
  const newStart = new Date(newStartMs).toISOString().slice(0, 10)
  return { plannedStartDate: newStart, dueDate: newDueDate }
}
