/** @jest-environment node */

/**
 * Cascade architecture: circular imports prevent wiring the cascade inside
 * service functions (children ↔ subjects ↔ planner). The cascade is triggered
 * at the API route level instead. These tests verify:
 *   1. Each `archiveByChildId` / `archiveBySubjectId` function works correctly.
 *   2. Calling them in sequence (as the API route does) produces the right state.
 */

import {
  createStudentProfile,
  archiveStudentProfile,
  resetStore as resetChildrenStore,
} from '@/features/children/server/service'
import {
  createSubject,
  getSubjects,
  archiveByChildId as archiveSubjectsByChildId,
  archiveSubject,
  resetStore as resetSubjectsStore,
} from '@/features/subjects/server/service'
import {
  archiveByChildId as archiveAttendanceByChildId,
  resetStore as resetAttendanceStore,
} from '@/features/attendance/server/service'
import {
  archiveByChildId as archivePlannerByChildId,
  archiveBySubjectId as archivePlannerBySubjectId,
  resetStore as resetPlannerStore,
} from '@/features/plan/server/service'
import {
  archiveByChildId as archivePortfolioByChildId,
  resetEvidenceStore,
} from '@/features/portfolio/server/service'

function makeChild(name: string) {
  return createStudentProfile({
    householdId: 'hh_test',
    name,
    gradeLabel: 'G1',
    username: name.toLowerCase().replace(/ /g, '_'),
    password: 'pw',
  })
}

beforeEach(() => {
  resetChildrenStore()
  resetSubjectsStore()
  resetAttendanceStore()
  resetPlannerStore()
  resetEvidenceStore()
})

// ── B1: subjects cascade ────────────────────────────────────────────────────

describe('B1 — archiveByChildId (subjects service)', () => {
  it('sets isActive=false on every subject belonging to that child', () => {
    const child = makeChild('Alice')
    createSubject({ childId: child.id, name: 'Math', category: 'core' })
    createSubject({ childId: child.id, name: 'Science', category: 'core' })

    archiveSubjectsByChildId(child.id)

    expect(getSubjects(child.id).every(s => s.isActive === false)).toBe(true)
  })

  it('does not touch subjects of a different child', () => {
    const childA = makeChild('Alice')
    const childB = makeChild('Bob')
    createSubject({ childId: childA.id, name: 'Math', category: 'core' })
    createSubject({ childId: childB.id, name: 'Art', category: 'enrichment' })

    archiveSubjectsByChildId(childA.id)

    expect(getSubjects(childB.id).every(s => s.isActive === true)).toBe(true)
  })
})

describe('B1 — full cascade (as performed by the API route)', () => {
  it('archiving a child then their subjects leaves the child inactive and subjects inactive', () => {
    const child = makeChild('Alice')
    createSubject({ childId: child.id, name: 'Math', category: 'core' })

    // Simulate what the ARCHIVE route handler does:
    const archived = archiveStudentProfile(child.id)
    archiveSubjectsByChildId(child.id)
    archiveAttendanceByChildId(child.id)
    archivePlannerByChildId(child.id)
    archivePortfolioByChildId(child.id)

    expect(archived?.isActive).toBe(false)
    expect(getSubjects(child.id).every(s => s.isActive === false)).toBe(true)
  })

  it('cascade does not affect a sibling child', () => {
    const childA = makeChild('Alice')
    const childB = makeChild('Bob')
    createSubject({ childId: childA.id, name: 'Math', category: 'core' })
    createSubject({ childId: childB.id, name: 'Art', category: 'enrichment' })

    archiveStudentProfile(childA.id)
    archiveSubjectsByChildId(childA.id)

    expect(getSubjects(childB.id).every(s => s.isActive === true)).toBe(true)
  })
})

// ── B1: stub functions ───────────────────────────────────────────────────────

describe('B1 — archive stubs on attendance, planner, portfolio services', () => {
  it('attendance archiveByChildId is callable without throwing', () => {
    expect(() => archiveAttendanceByChildId('any')).not.toThrow()
  })

  it('planner archiveByChildId is callable without throwing', () => {
    expect(() => archivePlannerByChildId('any')).not.toThrow()
  })

  it('portfolio archiveByChildId is callable without throwing', () => {
    expect(() => archivePortfolioByChildId('any')).not.toThrow()
  })
})

// ── B2: subject → planner cascade ───────────────────────────────────────────

describe('B2 — archiveBySubjectId (planner service stub)', () => {
  it('is callable without throwing', () => {
    expect(() => archivePlannerBySubjectId('any')).not.toThrow()
  })

  it('full cascade: archiving a subject marks it inactive and fires planner stub', () => {
    const child = makeChild('Alice')
    const subject = createSubject({ childId: child.id, name: 'Math', category: 'core' })!

    // Simulate what the subject ARCHIVE route handler does:
    const archived = archiveSubject(subject.id)
    archivePlannerBySubjectId(subject.id)

    expect(archived?.isActive).toBe(false)
  })
})
