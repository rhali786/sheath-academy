import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonDateMove, ShiftApplyResult, ShiftLessonsRequest, ShiftPreview } from '@/features/plan/types'
import { applyShift, previewShift, ShiftRequestError } from '@/features/plan/server/shiftService'

const MAX_MOVES = 5000

function errorResponse(message: string, status = 400): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ status: 'error', data: null, message, timestamp: new Date().toISOString() }, { status })
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const parsed = new Date(y, m - 1, d)
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(v => typeof v === 'string')
}

function parseShiftRequest(body: unknown): ShiftLessonsRequest | string {
  if (!body || typeof body !== 'object') return 'Request body is required'
  const b = body as Record<string, unknown>
  if (b.learnerIds !== undefined && !isStringArray(b.learnerIds)) return 'learnerIds must be an array of ids'
  if (b.subjectIds !== undefined && !isStringArray(b.subjectIds)) return 'subjectIds must be an array of ids'
  const filters = { learnerIds: b.learnerIds as string[] | undefined, subjectIds: b.subjectIds as string[] | undefined }

  if (b.mode === 'shift') {
    if (!isDate(b.fromDate)) return 'fromDate must be a valid YYYY-MM-DD date'
    if (typeof b.schoolDays !== 'number' || !Number.isInteger(b.schoolDays) || b.schoolDays < 1) {
      return 'schoolDays must be a whole number of at least 1'
    }
    return { mode: 'shift', fromDate: b.fromDate, schoolDays: b.schoolDays, ...filters }
  }
  if (b.mode === 'break') {
    if (typeof b.breakId !== 'string' || !b.breakId) return 'breakId is required'
    return { mode: 'break', breakId: b.breakId, ...filters }
  }
  return "mode must be 'shift' or 'break'"
}

function isLessonDates(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return isDate(v.dueDate) && (v.plannedStartDate === null || isDate(v.plannedStartDate))
}

function parseMoves(body: unknown): Pick<LessonDateMove, 'id' | 'from' | 'to'>[] | string {
  const moves = (body as Record<string, unknown> | null)?.moves
  if (!Array.isArray(moves)) return 'moves must be an array'
  if (moves.length > MAX_MOVES) return `At most ${MAX_MOVES} lessons can be moved at once`
  const parsed: Pick<LessonDateMove, 'id' | 'from' | 'to'>[] = []
  for (const m of moves) {
    if (!m || typeof m !== 'object' || typeof m.id !== 'string' || !m.id || !isLessonDates(m.from) || !isLessonDates(m.to)) {
      return 'Each move needs an id and valid from/to dates'
    }
    parsed.push({ id: m.id, from: m.from, to: m.to })
  }
  return parsed
}

/** POST /api/plan/lessons/shift/preview — read-only: what a shift would move. */
export async function PREVIEW(request: Request): Promise<NextResponse<ApiResponse<ShiftPreview | null>>> {
  const body = await request.json().catch(() => null)
  const parsed = parseShiftRequest(body)
  if (typeof parsed === 'string') return errorResponse(parsed)

  const { householdId } = getRequestAuthCtx()
  try {
    const preview = await previewShift(householdId, parsed)
    return NextResponse.json({ status: 'success', data: preview, message: 'Shift preview', timestamp: new Date().toISOString() })
  } catch (err) {
    if (err instanceof ShiftRequestError) return errorResponse(err.message)
    throw err
  }
}

/** POST /api/plan/lessons/shift/apply — moves exactly the previewed lessons (or undoes them). */
export async function APPLY(request: Request): Promise<NextResponse<ApiResponse<ShiftApplyResult | null>>> {
  const body = await request.json().catch(() => null)
  const moves = parseMoves(body)
  if (typeof moves === 'string') return errorResponse(moves)

  const { householdId } = getRequestAuthCtx()
  const result = await applyShift(householdId, moves)
  return NextResponse.json({ status: 'success', data: result, message: `${result.applied} lessons moved`, timestamp: new Date().toISOString() })
}
