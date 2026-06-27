import { validateLessonWindow, ValidationResult } from '@/features/plan/server/validation'

describe('validateLessonWindow', () => {
  it('returns valid when plannedStartDate is before dueDate', () => {
    const result: ValidationResult = validateLessonWindow('2026-06-01', '2026-06-07')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns valid when plannedStartDate equals dueDate (single-day window)', () => {
    const result = validateLessonWindow('2026-06-07', '2026-06-07')
    expect(result.valid).toBe(true)
  })

  it('returns invalid when plannedStartDate is after dueDate', () => {
    const result = validateLessonWindow('2026-06-08', '2026-06-07')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/before or equal/)
  })

  it('returns valid when plannedStartDate is null (falls back to dueDate)', () => {
    const result = validateLessonWindow(null, '2026-06-07')
    expect(result.valid).toBe(true)
  })

  it('returns valid when plannedStartDate is undefined', () => {
    const result = validateLessonWindow(undefined, '2026-06-07')
    expect(result.valid).toBe(true)
  })

  it('returns invalid when dueDate is missing', () => {
    const result = validateLessonWindow('2026-06-01', '')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/dueDate/)
  })

  it('shifts both dates preserving window span', () => {
    const delta = 3
    const prevStart = '2026-06-01'
    const prevDue = '2026-06-07'
    const newDue = '2026-06-10'
    // span = 6 days; newStart should be newDue - 6 = 2026-06-04
    const { shiftedStart } = computeShiftedWindow(prevStart, prevDue, newDue)
    expect(shiftedStart).toBe('2026-06-04')
    // Then validate the result
    expect(validateLessonWindow(shiftedStart, newDue).valid).toBe(true)
    void delta
  })
})

// helper defined here to test the window-shift arithmetic independently
function computeShiftedWindow(
  prevStart: string,
  prevDue: string,
  newDue: string,
): { shiftedStart: string } {
  const spanMs = new Date(prevDue).getTime() - new Date(prevStart).getTime()
  const newDueMs = new Date(newDue).getTime()
  const shiftedStartMs = newDueMs - spanMs
  return { shiftedStart: new Date(shiftedStartMs).toISOString().slice(0, 10) }
}
