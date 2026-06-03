import type { Alert } from '@/features/alerts/types'
import type { LessonTask } from '@/features/plan/types'
import type { SubjectCourse } from '@/features/subjects/types'

export interface AssistantInsight {
  title: string
  message: string
  href: string
  source: 'planner' | 'records' | 'schedule'
}

interface AssistantInsightInput {
  selectedDate: string
  selectedChildId: string | null
  lessons: LessonTask[]
  alerts: Alert[]
  subjects: SubjectCourse[]
}

function filterScopedAlerts(alerts: Alert[], selectedChildId: string | null): Alert[] {
  const openAlerts = alerts.filter((alert) => alert.status === 'open')
  if (!selectedChildId) return openAlerts
  return openAlerts.filter((alert) => alert.childId === null || alert.childId === selectedChildId)
}

function getSubjectName(subjectId: string, subjectsById: Map<string, SubjectCourse>): string {
  return subjectsById.get(subjectId)?.name ?? 'This subject'
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function getAssistantInsight({
  selectedDate,
  selectedChildId,
  lessons,
  alerts,
  subjects,
}: AssistantInsightInput): AssistantInsight | null {
  const scopedAlerts = filterScopedAlerts(alerts, selectedChildId)

  const plannerAlert = scopedAlerts.find((alert) => alert.sourceFeature === 'planner')
  if (plannerAlert) {
    return {
      title: 'Overdue lessons need attention',
      message: plannerAlert.message,
      href: '/plan',
      source: 'planner',
    }
  }

  const complianceAlert = scopedAlerts.find((alert) =>
    alert.sourceFeature === 'records' ||
    alert.type.includes('compliance') ||
    alert.href?.includes('records-compliance'),
  )
  if (complianceAlert) {
    return {
      title: 'Compliance follow-up needed',
      message: complianceAlert.message,
      href: complianceAlert.href ?? '/settings?tab=records-compliance',
      source: 'records',
    }
  }

  const dayLessons = lessons.filter((lesson) => lesson.dueDate === selectedDate)
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]))
  const bySubject = new Map<string, number>()

  for (const lesson of dayLessons) {
    bySubject.set(lesson.subjectId, (bySubject.get(lesson.subjectId) ?? 0) + 1)
  }

  let dominantSubjectId: string | null = null
  let dominantCount = 0
  for (const [subjectId, count] of bySubject.entries()) {
    if (count > dominantCount) {
      dominantSubjectId = subjectId
      dominantCount = count
    }
  }

  if (dominantSubjectId && dominantCount >= 2) {
    const subjectName = getSubjectName(dominantSubjectId, subjectsById)
    return {
      title: 'Schedule Imbalance',
      message: `${subjectName} appears ${pluralize(dominantCount, 'time')} on ${selectedDate}. Consider spreading it across the week.`,
      href: '/plan',
      source: 'schedule',
    }
  }

  return null
}
