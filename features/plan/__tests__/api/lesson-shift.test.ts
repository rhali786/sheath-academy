/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
  updateLessonDatesIfUnchanged: jest.fn(),
}))

jest.mock('@/features/school-year/server/service', () => ({
  getActiveSchoolYear: jest.fn(),
}))

jest.mock('@/features/settings/server/repository', () => ({
  getHouseholdSetting: jest.fn(),
}))

import { listLessonTaskRows, updateLessonDatesIfUnchanged } from '@/features/plan/server/repository'
import { getActiveSchoolYear } from '@/features/school-year/server/service'
import { getHouseholdSetting } from '@/features/settings/server/repository'
import { PREVIEW, APPLY } from '@/features/plan/api/routes/lesson-shift'
import type { LessonDateMove, ShiftPreview } from '@/features/plan/types'

const mockList = listLessonTaskRows as jest.Mock
const mockUpdate = updateLessonDatesIfUnchanged as jest.Mock
const mockActiveYear = getActiveSchoolYear as jest.Mock
const mockSetting = getHouseholdSetting as jest.Mock

const THANKSGIVING = { id: 'br_tg', name: 'Thanksgiving', startDate: '2026-11-25', endDate: '2026-11-27' }

function row(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id, householdId: 'hh_test', learnerId: 'l1', subjectId: 's_math', title: `Lesson ${id}`,
    dueDate: '2026-11-24', plannedStartDate: null, status: 'not_started', groupId: null,
    ...overrides,
  }
}

function post(path: string, body: unknown) {
  return new Request(`http://localhost/api/plan/lessons/shift/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function preview(body: unknown): Promise<{ res: Response; json: { status: string; data: ShiftPreview; message: string } }> {
  const res = await PREVIEW(post('preview', body))
  return { res, json: await res.json() }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSetting.mockResolvedValue(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  mockActiveYear.mockResolvedValue({ id: 'sy1', startDate: '2026-08-01', endDate: '2026-12-01', breaks: [THANKSGIVING] })
})

describe('POST /api/plan/lessons/shift/preview — shift mode', () => {
  it('moves not-started lessons due on/after fromDate by N school days, skipping the break', async () => {
    mockList.mockResolvedValue([row('a', { dueDate: '2026-11-20' }), row('b', { dueDate: '2026-11-24' })])

    const { res, json } = await preview({ mode: 'shift', fromDate: '2026-11-20', schoolDays: 1 })

    expect(res.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith('hh_test', { status: 'not_started', startDate: '2026-11-20' })
    const byId = Object.fromEntries(json.data.moves.map(m => [m.id, m]))
    expect(byId.a.from).toEqual({ dueDate: '2026-11-20', plannedStartDate: null })
    expect(byId.a.to).toEqual({ dueDate: '2026-11-23', plannedStartDate: null })
    expect(byId.b.to.dueDate).toBe('2026-11-30')
    expect(json.data.countsByLearner).toEqual({ l1: 2 })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('ignores rows that are not not_started or are due before fromDate even if the repository returns them', async () => {
    mockList.mockResolvedValue([
      row('done', { status: 'completed' }),
      row('early', { dueDate: '2026-11-19' }),
      row('keep', { dueDate: '2026-11-23' }),
    ])
    const { json } = await preview({ mode: 'shift', fromDate: '2026-11-20', schoolDays: 1 })
    expect(json.data.moves.map(m => m.id)).toEqual(['keep'])
  })

  it('applies learner and course filters', async () => {
    mockList.mockResolvedValue([
      row('a', { learnerId: 'l1', subjectId: 's_math' }),
      row('b', { learnerId: 'l2', subjectId: 's_math' }),
      row('c', { learnerId: 'l1', subjectId: 's_art' }),
    ])
    const { json } = await preview({
      mode: 'shift', fromDate: '2026-11-20', schoolDays: 1, learnerIds: ['l1'], subjectIds: ['s_math'],
    })
    expect(json.data.moves.map(m => m.id)).toEqual(['a'])
  })

  it('keeps grouped copies of a lesson on the same new date', async () => {
    mockList.mockResolvedValue([
      row('g1', { learnerId: 'l1', groupId: 'grp' }),
      row('g2', { learnerId: 'l2', groupId: 'grp' }),
    ])
    const { json } = await preview({ mode: 'shift', fromDate: '2026-11-20', schoolDays: 3 })
    const [m1, m2] = json.data.moves
    expect(m1.to.dueDate).toBe(m2.to.dueDate)
    expect(json.data.countsByLearner).toEqual({ l1: 1, l2: 1 })
  })

  it('remaps plannedStartDate independently and leaves null alone', async () => {
    mockList.mockResolvedValue([
      row('p', { dueDate: '2026-11-24', plannedStartDate: '2026-11-20' }),
      row('n', { dueDate: '2026-11-24', plannedStartDate: null }),
    ])
    const { json } = await preview({ mode: 'shift', fromDate: '2026-11-20', schoolDays: 1 })
    const byId = Object.fromEntries(json.data.moves.map(m => [m.id, m]))
    expect(byId.p.to).toEqual({ dueDate: '2026-11-30', plannedStartDate: '2026-11-23' })
    expect(byId.n.to.plannedStartDate).toBeNull()
  })

  it('counts moves that land after the school year ends', async () => {
    mockList.mockResolvedValue([row('a', { dueDate: '2026-11-30' }), row('b', { dueDate: '2026-11-20' })])
    const { json } = await preview({ mode: 'shift', fromDate: '2026-11-20', schoolDays: 2 })
    // a: Nov 30 -> Dec 2 (after Dec 1 end); b: Nov 20 -> Nov 24
    expect(json.data.pastYearEndCount).toBe(1)
    expect(json.data.schoolYearEnd).toBe('2026-12-01')
  })

  it('falls back to Mon-Fri and no breaks when settings and school year are missing', async () => {
    mockSetting.mockResolvedValue(undefined)
    mockActiveYear.mockResolvedValue(null)
    mockList.mockResolvedValue([row('a', { dueDate: '2026-11-24' })])
    const { json } = await preview({ mode: 'shift', fromDate: '2026-11-20', schoolDays: 1 })
    expect(json.data.moves[0].to.dueDate).toBe('2026-11-25')
    expect(json.data.schoolYearEnd).toBeNull()
  })

  it.each([
    [{ mode: 'shift', fromDate: '2026-13-01', schoolDays: 1 }],
    [{ mode: 'shift', fromDate: '2026-11-20', schoolDays: 0 }],
    [{ mode: 'shift', fromDate: '2026-11-20', schoolDays: -2 }],
    [{ mode: 'shift', fromDate: '2026-11-20', schoolDays: 1.5 }],
    [{ mode: 'shift', schoolDays: 1 }],
    [{ mode: 'sideways' }],
    [{ mode: 'shift', fromDate: '2026-11-20', schoolDays: 1, learnerIds: 'l1' }],
  ])('400 for invalid request %j', async (body) => {
    const { res, json } = await preview(body)
    expect(res.status).toBe(400)
    expect(json.status).toBe('error')
    expect(mockList).not.toHaveBeenCalled()
  })
})

describe('POST /api/plan/lessons/shift/preview — break mode', () => {
  it('moves lessons from the break start onward by the school days the break removes', async () => {
    mockList.mockResolvedValue([
      row('in', { dueDate: '2026-11-25' }),
      row('after', { dueDate: '2026-12-01' }),
    ])
    const { json } = await preview({ mode: 'break', breakId: 'br_tg' })
    expect(mockList).toHaveBeenCalledWith('hh_test', { status: 'not_started', startDate: '2026-11-25' })
    const byId = Object.fromEntries(json.data.moves.map(m => [m.id, m]))
    expect(byId.in.to.dueDate).toBe('2026-11-30')
    expect(byId.after.to.dueDate).toBe('2026-12-04')
  })

  it('returns no moves when nothing is scheduled in or after the break', async () => {
    mockList.mockResolvedValue([])
    const { json } = await preview({ mode: 'break', breakId: 'br_tg' })
    expect(json.data.moves).toEqual([])
    expect(json.data.countsByLearner).toEqual({})
  })

  it('400 for a break id that is not on the active school year', async () => {
    const { res } = await preview({ mode: 'break', breakId: 'br_missing' })
    expect(res.status).toBe(400)
  })

  it('400 when there is no active school year', async () => {
    mockActiveYear.mockResolvedValue(null)
    const { res } = await preview({ mode: 'break', breakId: 'br_tg' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/plan/lessons/shift/apply', () => {
  const move: LessonDateMove = {
    id: 'a', learnerId: 'l1', subjectId: 's_math', title: 'Lesson a',
    from: { dueDate: '2026-11-20', plannedStartDate: null },
    to: { dueDate: '2026-11-23', plannedStartDate: null },
  }

  it('applies the moves through the repository and reports applied and skipped', async () => {
    mockUpdate.mockResolvedValue({ applied: 1, skipped: ['b'] })
    const res = await APPLY(post('apply', { moves: [move, { ...move, id: 'b' }] }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith('hh_test', [
      { id: 'a', from: move.from, to: move.to },
      { id: 'b', from: move.from, to: move.to },
    ])
    expect(json.data).toEqual({ applied: 1, skipped: ['b'] })
  })

  it.each([
    [{}],
    [{ moves: 'nope' }],
    [{ moves: [{ ...move, to: { dueDate: 'bad', plannedStartDate: null } }] }],
    [{ moves: [{ ...move, id: '' }] }],
  ])('400 for invalid body %j', async (body) => {
    const res = await APPLY(post('apply', body))
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns success with nothing applied for an empty move list', async () => {
    mockUpdate.mockResolvedValue({ applied: 0, skipped: [] })
    const res = await APPLY(post('apply', { moves: [] }))
    expect(res.status).toBe(200)
  })
})
