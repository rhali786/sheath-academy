import { getAssistantInsight } from '@/features/dashboard/front/lib/assistantRules'
import type { LessonTask } from '@/features/plan/types'
import type { Alert } from '@/features/alerts/types'
import type { SubjectCourse } from '@/features/subjects/types'

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'lesson_1',
    childId: 'child_1',
    subjectId: 'subject_1',
    householdId: 'household_1',
    title: 'Math practice',
    dueDate: '2026-05-24',
    status: 'not_started',
    order: 1,
    createdAt: '2026-05-24T00:00:00Z',
    updatedAt: '2026-05-24T00:00:00Z',
    ...overrides,
  }
}

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert_1',
    childId: null,
    type: 'pending_lessons',
    status: 'open',
    severity: 'high',
    title: '2 overdue lessons',
    message: 'Complete or reschedule overdue work.',
    sourceFeature: 'planner',
    createdAt: '2026-05-24T00:00:00Z',
    ...overrides,
  }
}

const subjects: SubjectCourse[] = [
  {
    id: 'subject_1',
    childId: 'child_1',
    learnerIds: ['child_1'],
    name: 'Science',
    category: 'Science',
    isActive: true,
    order: 1,
    createdAt: '2026-05-24T00:00:00Z',
  },
]

describe('getAssistantInsight', () => {
  test('returns overdue insight for selected child planner alerts first', () => {
    const insight = getAssistantInsight({
      selectedDate: '2026-05-24',
      selectedChildId: 'child_1',
      lessons: [makeLesson()],
      alerts: [makeAlert({ childId: 'child_1', childName: 'Amina' })],
      subjects,
    })

    expect(insight?.title).toBe('Overdue lessons need attention')
    expect(insight?.href).toBe('/plan')
  })

  test('returns compliance insight when records/compliance alert is open', () => {
    const insight = getAssistantInsight({
      selectedDate: '2026-05-24',
      selectedChildId: null,
      lessons: [makeLesson()],
      alerts: [
        makeAlert({
          sourceFeature: 'records',
          type: 'records_compliance',
          title: 'Missing records',
          message: 'Quarterly records are incomplete.',
          href: '/settings?tab=records-compliance',
        }),
      ],
      subjects,
    })

    expect(insight?.title).toBe('Compliance follow-up needed')
    expect(insight?.href).toBe('/settings?tab=records-compliance')
  })

  test('returns schedule imbalance insight when one subject dominates the day', () => {
    const insight = getAssistantInsight({
      selectedDate: '2026-05-24',
      selectedChildId: null,
      lessons: [
        makeLesson({ id: 'lesson_1', title: 'Science reading' }),
        makeLesson({ id: 'lesson_2', title: 'Science notebook', order: 2 }),
      ],
      alerts: [],
      subjects,
    })

    expect(insight?.title).toBe('Schedule Imbalance')
    expect(insight?.href).toBe('/plan')
    expect(insight?.message).toMatch(/Science/)
  })

  test('returns null when there are no actionable assistant signals', () => {
    const insight = getAssistantInsight({
      selectedDate: '2026-05-24',
      selectedChildId: null,
      lessons: [makeLesson()],
      alerts: [],
      subjects,
    })

    expect(insight).toBeNull()
  })
})
