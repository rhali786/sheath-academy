import type { FeatureArea, UsageEventType } from '@/features/admin-metrics/types'
import { trackUsageEvent } from './trackUsage'

export async function trackUserActive(
  userId: string,
  householdId: string,
  featureArea: FeatureArea,
): Promise<void> {
  await trackUsageEvent({
    eventType: 'user_active',
    userId,
    householdId,
    featureArea,
  })
}

export async function trackLearnerCreated(
  userId: string,
  householdId: string,
  learnerId: string,
): Promise<void> {
  await trackUsageEvent({
    eventType: 'learner_created',
    userId,
    householdId,
    learnerId,
    featureArea: 'learners',
    entityType: 'learner',
    entityId: learnerId,
  })
  await trackUserActive(userId, householdId, 'learners')
}

export async function trackLessonCompleted(
  userId: string,
  householdId: string,
  learnerId: string,
  lessonId: string,
): Promise<void> {
  await trackUsageEvent({
    eventType: 'lesson_completed',
    userId,
    householdId,
    learnerId,
    featureArea: 'planner',
    entityType: 'lesson',
    entityId: lessonId,
  })
  await trackUsageEvent({
    eventType: 'session_completed',
    userId,
    householdId,
    learnerId,
    featureArea: 'planner',
    entityType: 'lesson',
    entityId: lessonId,
  })
  await trackUserActive(userId, householdId, 'planner')
}

export async function trackSessionStarted(
  userId: string,
  householdId: string,
  learnerId: string,
  entityId: string,
  featureArea: FeatureArea = 'planner',
): Promise<void> {
  await trackUsageEvent({
    eventType: 'session_started',
    userId,
    householdId,
    learnerId,
    featureArea,
    entityId,
  })
  await trackUserActive(userId, householdId, featureArea)
}

export async function trackAttendanceLogged(
  userId: string,
  householdId: string,
  learnerId: string,
  recordId: string,
): Promise<void> {
  await trackUsageEvent({
    eventType: 'session_completed',
    userId,
    householdId,
    learnerId,
    featureArea: 'attendance',
    entityType: 'attendance',
    entityId: recordId,
  })
  await trackUserActive(userId, householdId, 'attendance')
}

export async function trackQuranRecord(
  userId: string,
  householdId: string,
  learnerId: string,
  sessionId: string,
): Promise<void> {
  await trackUsageEvent({
    eventType: 'quran_record_created',
    userId,
    householdId,
    learnerId,
    featureArea: 'quran',
    entityType: 'quran_session',
    entityId: sessionId,
  })
  await trackUserActive(userId, householdId, 'quran')
}

export async function trackEvidenceCreated(
  userId: string,
  householdId: string,
  learnerId: string,
  evidenceId: string,
): Promise<void> {
  await trackUsageEvent({
    eventType: 'evidence_created',
    userId,
    householdId,
    learnerId,
    featureArea: 'portfolio',
    entityType: 'evidence',
    entityId: evidenceId,
  })
  await trackUserActive(userId, householdId, 'portfolio')
}

export async function trackReportGenerated(
  userId: string,
  householdId: string,
): Promise<void> {
  await trackUsageEvent({
    eventType: 'report_generated',
    userId,
    householdId,
    featureArea: 'reports',
  })
  await trackUserActive(userId, householdId, 'reports')
}

export async function trackFamilyCreated(userId: string, householdId: string): Promise<void> {
  await trackUsageEvent({
    eventType: 'family_created',
    userId,
    householdId,
    featureArea: 'account',
  })
}
