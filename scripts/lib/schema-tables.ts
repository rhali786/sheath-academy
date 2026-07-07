/**
 * All application tables from db/schema.ts — used by prod backup/status scripts.
 */
import type { PgTable } from 'drizzle-orm/pg-core'
import { getTableName } from 'drizzle-orm'
import * as schema from '@/db/schema'

export type SchemaTableRef = {
  key: string
  table: PgTable
  name: string
}

/** Ordered for readable export logs (rough dependency order). */
export const SCHEMA_TABLES: SchemaTableRef[] = [
  { key: 'users', table: schema.users, name: getTableName(schema.users) },
  { key: 'accounts', table: schema.accounts, name: getTableName(schema.accounts) },
  { key: 'verificationTokens', table: schema.verificationTokens, name: getTableName(schema.verificationTokens) },
  { key: 'households', table: schema.households, name: getTableName(schema.households) },
  { key: 'householdMembers', table: schema.householdMembers, name: getTableName(schema.householdMembers) },
  { key: 'householdInvitations', table: schema.householdInvitations, name: getTableName(schema.householdInvitations) },
  { key: 'learners', table: schema.learners, name: getTableName(schema.learners) },
  { key: 'schoolYears', table: schema.schoolYears, name: getTableName(schema.schoolYears) },
  { key: 'subjects', table: schema.subjects, name: getTableName(schema.subjects) },
  { key: 'subjectLearners', table: schema.subjectLearners, name: getTableName(schema.subjectLearners) },
  { key: 'subjectResources', table: schema.subjectResources, name: getTableName(schema.subjectResources) },
  { key: 'learningTimeSessions', table: schema.learningTimeSessions, name: getTableName(schema.learningTimeSessions) },
  { key: 'personalTodos', table: schema.personalTodos, name: getTableName(schema.personalTodos) },
  { key: 'lessonTasks', table: schema.lessonTasks, name: getTableName(schema.lessonTasks) },
  { key: 'attendanceEvents', table: schema.attendanceEvents, name: getTableName(schema.attendanceEvents) },
  { key: 'quranSessions', table: schema.quranSessions, name: getTableName(schema.quranSessions) },
  { key: 'portfolioEvidence', table: schema.portfolioEvidence, name: getTableName(schema.portfolioEvidence) },
  { key: 'portfolioEvidenceAttachments', table: schema.portfolioEvidenceAttachments, name: getTableName(schema.portfolioEvidenceAttachments) },
  { key: 'userSettings', table: schema.userSettings, name: getTableName(schema.userSettings) },
  { key: 'householdSettings', table: schema.householdSettings, name: getTableName(schema.householdSettings) },
  { key: 'productValidationResponses', table: schema.productValidationResponses, name: getTableName(schema.productValidationResponses) },
  { key: 'passwordResetTokens', table: schema.passwordResetTokens, name: getTableName(schema.passwordResetTokens) },
  { key: 'resources', table: schema.resources, name: getTableName(schema.resources) },
  { key: 'resourceFeedback', table: schema.resourceFeedback, name: getTableName(schema.resourceFeedback) },
  { key: 'resourceCommunityNotes', table: schema.resourceCommunityNotes, name: getTableName(schema.resourceCommunityNotes) },
  { key: 'changelogEntries', table: schema.changelogEntries, name: getTableName(schema.changelogEntries) },
  { key: 'userFeedback', table: schema.userFeedback, name: getTableName(schema.userFeedback) },
  { key: 'conversations', table: schema.conversations, name: getTableName(schema.conversations) },
  { key: 'conversationParticipants', table: schema.conversationParticipants, name: getTableName(schema.conversationParticipants) },
  { key: 'messages', table: schema.messages, name: getTableName(schema.messages) },
  { key: 'messageAttachments', table: schema.messageAttachments, name: getTableName(schema.messageAttachments) },
]

/** Tables that indicate recent migrations landed on prod. */
export const KEY_SCHEMA_TABLES: SchemaTableRef[] = [
  SCHEMA_TABLES.find(t => t.key === 'subjectLearners')!,
  SCHEMA_TABLES.find(t => t.key === 'conversations')!,
  SCHEMA_TABLES.find(t => t.key === 'messages')!,
  SCHEMA_TABLES.find(t => t.key === 'lessonTasks')!,
  SCHEMA_TABLES.find(t => t.key === 'personalTodos')!,
]
