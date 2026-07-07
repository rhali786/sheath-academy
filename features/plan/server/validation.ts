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
