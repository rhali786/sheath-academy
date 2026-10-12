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
