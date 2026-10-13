import { splitGroupLessonPatch } from '@/features/plan/server/groupLessonPatch'

// A shared lesson is one row per learner. What the lesson *is* can follow the group;
// *when* it happens, its status, and who/which course it belongs to are per learner.
const edit = {
  title: 'Fractions review',
  description: 'Pages 10-12',
  curriculum: 'Saxon 5/4',
  chapter: 'Ch 12',
  estimatedDuration: '30min',
  dueDate: '2026-10-14',
  plannedStartDate: null,
  scheduledStartTime: '13:00',
  scheduledEndTime: '13:30',
  status: 'completed',
  sortOrder: 2,
  learnerId: 'l_hawa',
  subjectId: 's_math',
}

describe('splitGroupLessonPatch', () => {
  it('without the group box, everything applies to this learner only', () => {
    const { group, row } = splitGroupLessonPatch(edit, {})
    expect(group).toEqual({})
    expect(row).toEqual(edit)
  })

  it('with the group box, details go to the group but date and time stay with this learner', () => {
    const { group, row } = splitGroupLessonPatch(edit, { applyToGroup: true })
    expect(group).toEqual({
      title: 'Fractions review',
      description: 'Pages 10-12',
      curriculum: 'Saxon 5/4',
      chapter: 'Ch 12',
      estimatedDuration: '30min',
    })
    expect(row).toEqual({
      dueDate: '2026-10-14',
      plannedStartDate: null,
      scheduledStartTime: '13:00',
      scheduledEndTime: '13:30',
      status: 'completed',
      sortOrder: 2,
      learnerId: 'l_hawa',
      subjectId: 's_math',
    })
  })

  it('"move for everyone" also sends the date and time to the group', () => {
    const { group, row } = splitGroupLessonPatch(edit, { applyToGroup: true, applyScheduleToGroup: true })
    expect(group).toMatchObject({
      title: 'Fractions review',
      dueDate: '2026-10-14',
      plannedStartDate: null,
      scheduledStartTime: '13:00',
      scheduledEndTime: '13:30',
    })
    expect(row).toEqual({ status: 'completed', sortOrder: 2, learnerId: 'l_hawa', subjectId: 's_math' })
  })

  it('never sends status, learner or course to the group', () => {
    const { group } = splitGroupLessonPatch(edit, { applyToGroup: true, applyScheduleToGroup: true })
    expect(group).not.toHaveProperty('status')
    expect(group).not.toHaveProperty('learnerId')
    expect(group).not.toHaveProperty('subjectId')
  })

  it('"move for everyone" without the group box does nothing extra', () => {
    const { group, row } = splitGroupLessonPatch(edit, { applyScheduleToGroup: true })
    expect(group).toEqual({})
    expect(row).toEqual(edit)
  })

  it('leaves out fields that were not sent', () => {
    const { group, row } = splitGroupLessonPatch({ title: 'Only the title', dueDate: undefined }, { applyToGroup: true })
    expect(group).toEqual({ title: 'Only the title' })
    expect(row).toEqual({})
  })
})

// UAT 2.4 (Amir, 2026-10-12): A was moved to tomorrow; B's time was changed with "move
// for everyone" ticked, and A was pulled back to today. The editor sends every field, so
// only what differs from the copy being edited is what the parent changed — and only
// that is copied to the other learners.
describe('splitGroupLessonPatch with the copy being edited', () => {
  const bRow = {
    title: 'UAT Shared 3', description: null, curriculum: null, chapter: null, estimatedDuration: '30min',
    hasHomework: false, hasAssessment: false,
    dueDate: '2026-10-12', plannedStartDate: null, scheduledStartTime: null, scheduledEndTime: null,
    status: 'not_started', sortOrder: 0, learnerId: 'l_b', subjectId: 's_math',
  }
  // What the Edit lesson window sends after only the time was set to 2:00–2:30 PM.
  const timeOnly = {
    title: 'UAT Shared 3', description: '', curriculum: '', chapter: '', estimatedDuration: '30min',
    hasHomework: false, hasAssessment: false,
    dueDate: '2026-10-12', plannedStartDate: null, scheduledStartTime: '14:00', scheduledEndTime: '14:30',
    status: 'not_started', learnerId: 'l_b', subjectId: 's_math',
  }

  it('a time change moves only the time for everyone, so a learner on another day keeps their day', () => {
    const { group } = splitGroupLessonPatch(timeOnly, { applyToGroup: true, applyScheduleToGroup: true }, bRow)
    expect(group).toEqual({ scheduledStartTime: '14:00', scheduledEndTime: '14:30' })
  })

  it('start and end go together, so every learner gets the same window', () => {
    const current = { ...bRow, scheduledStartTime: '13:00', scheduledEndTime: '14:30' }
    const patch = { ...timeOnly, scheduledStartTime: '14:00', scheduledEndTime: '14:30' }
    const { group } = splitGroupLessonPatch(patch, { applyToGroup: true, applyScheduleToGroup: true }, current)
    expect(group).toEqual({ scheduledStartTime: '14:00', scheduledEndTime: '14:30' })
  })

  it('a date change moves everyone to that date, with "Available from" alongside it', () => {
    const patch = { ...timeOnly, scheduledStartTime: null, scheduledEndTime: null, dueDate: '2026-10-15' }
    const { group } = splitGroupLessonPatch(patch, { applyToGroup: true, applyScheduleToGroup: true }, bRow)
    expect(group).toEqual({ dueDate: '2026-10-15', plannedStartDate: null })
  })

  it('clearing the time for everyone sends the cleared time to the group', () => {
    const current = { ...bRow, scheduledStartTime: '13:00', scheduledEndTime: '13:30' }
    const patch = { ...timeOnly, scheduledStartTime: null, scheduledEndTime: null }
    const { group } = splitGroupLessonPatch(patch, { applyToGroup: true, applyScheduleToGroup: true }, current)
    expect(group).toEqual({ scheduledStartTime: null, scheduledEndTime: null })
  })

  it('details the parent left alone are not copied, so another learner’s own title survives', () => {
    const patch = { ...timeOnly, scheduledStartTime: null, scheduledEndTime: null, description: 'Bring the workbook' }
    const { group } = splitGroupLessonPatch(patch, { applyToGroup: true }, bRow)
    expect(group).toEqual({ description: 'Bring the workbook' })
  })

  it('treats a blank field and an empty one as the same ("" vs null, false vs null)', () => {
    const current = { ...bRow, hasHomework: null }
    const { group } = splitGroupLessonPatch({ ...timeOnly, scheduledStartTime: null, scheduledEndTime: null }, { applyToGroup: true, applyScheduleToGroup: true }, current)
    expect(group).toEqual({})
  })

  it('this learner’s copy still gets everything it was sent', () => {
    const { group, row } = splitGroupLessonPatch(timeOnly, { applyToGroup: true, applyScheduleToGroup: true }, bRow)
    expect({ ...row, ...group }).toEqual(timeOnly)
  })
})
