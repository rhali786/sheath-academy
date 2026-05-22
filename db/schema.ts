import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
  unique,
  jsonb,
  numeric,
} from 'drizzle-orm/pg-core'

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

// ─── Households ──────────────────────────────────────────────────────────────

export const households = pgTable('households', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('America/New_York'),
  setupCompletedAt: timestamp('setup_completed_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

// ─── Learners ─────────────────────────────────────────────────────────────────

export const learners = pgTable(
  'learners',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    name: text('name').notNull(),
    displayColor: text('display_color'),
    gradeLevel: text('grade_level'),
    isActive: boolean('is_active').notNull().default(true),
    archivedAt: timestamp('archived_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('learners_household_active_idx').on(t.householdId, t.isActive)],
)

// ─── School Years ─────────────────────────────────────────────────────────────

export const schoolYears = pgTable(
  'school_years',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    name: text('name').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('school_years_household_active_idx').on(t.householdId, t.isActive)],
)

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const subjects = pgTable(
  'subjects',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    learnerId: text('learner_id').references(() => learners.id),
    name: text('name').notNull(),
    category: text('category').notNull().default('core'),
    description: text('description'),
    color: text('color'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('subjects_household_active_idx').on(t.householdId, t.isActive)],
)

// ─── Lesson Tasks ─────────────────────────────────────────────────────────────

export const lessonTasks = pgTable(
  'lesson_tasks',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    learnerId: text('learner_id').notNull().references(() => learners.id),
    subjectId: text('subject_id').references(() => subjects.id),
    title: text('title').notNull(),
    description: text('description'),
    notes: text('notes'),
    dueDate: date('due_date'),
    status: text('status').notNull().default('not_started'),
    sortOrder: integer('sort_order').notNull().default(0),
    completedAt: timestamp('completed_at'),
    skippedAt: timestamp('skipped_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('lesson_tasks_household_learner_due_idx').on(t.householdId, t.learnerId, t.dueDate),
    index('lesson_tasks_household_subject_idx').on(t.householdId, t.subjectId),
    index('lesson_tasks_household_status_idx').on(t.householdId, t.status),
  ],
)

// ─── Attendance Events ────────────────────────────────────────────────────────

export const attendanceEvents = pgTable(
  'attendance_events',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    learnerId: text('learner_id').notNull().references(() => learners.id),
    attendanceDate: date('attendance_date').notNull(),
    occurredAt: timestamp('occurred_at'),
    status: text('status').notNull(),
    minutes: integer('minutes'),
    notes: text('notes'),
    voidedAt: timestamp('voided_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('attendance_events_household_learner_date_idx').on(
      t.householdId,
      t.learnerId,
      t.attendanceDate,
    ),
    index('attendance_events_household_date_idx').on(t.householdId, t.attendanceDate),
  ],
)

// ─── Qur'an Sessions ──────────────────────────────────────────────────────────

export const quranSessions = pgTable(
  'quran_sessions',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    learnerId: text('learner_id').notNull().references(() => learners.id),
    sessionDate: date('session_date').notNull(),
    sessionType: text('session_type').notNull(),
    surah: text('surah'),
    fromAyah: integer('from_ayah'),
    toAyah: integer('to_ayah'),
    durationMinutes: integer('duration_minutes'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('quran_sessions_household_learner_date_idx').on(
      t.householdId,
      t.learnerId,
      t.sessionDate,
    ),
    index('quran_sessions_household_date_idx').on(t.householdId, t.sessionDate),
  ],
)

// ─── Portfolio Evidence ───────────────────────────────────────────────────────

export const portfolioEvidence = pgTable(
  'portfolio_evidence',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    learnerId: text('learner_id').notNull().references(() => learners.id),
    subjectId: text('subject_id').references(() => subjects.id),
    lessonTaskId: text('lesson_task_id').references(() => lessonTasks.id),
    quranSessionId: text('quran_session_id').references(() => quranSessions.id),
    attendanceEventId: text('attendance_event_id').references(() => attendanceEvents.id),
    title: text('title').notNull(),
    description: text('description'),
    evidenceType: text('evidence_type').notNull(),
    url: text('url'),
    evidenceDate: date('evidence_date').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('portfolio_evidence_household_learner_date_idx').on(
      t.householdId,
      t.learnerId,
      t.evidenceDate,
    ),
    index('portfolio_evidence_household_subject_idx').on(t.householdId, t.subjectId),
  ],
)

// ─── User Settings ────────────────────────────────────────────────────────────

export const userSettings = pgTable(
  'user_settings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    unique('user_settings_user_key_unique').on(t.userId, t.key),
    index('user_settings_user_key_idx').on(t.userId, t.key),
  ],
)

// ─── Household Settings ───────────────────────────────────────────────────────

export const householdSettings = pgTable(
  'household_settings',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    unique('household_settings_household_key_unique').on(t.householdId, t.key),
    index('household_settings_household_key_idx').on(t.householdId, t.key),
  ],
)

// ─── Product Validation Responses ────────────────────────────────────────────

export const productValidationResponses = pgTable('product_validation_responses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  tenantId: text('tenant_id'),
  respondentName: text('respondent_name'),
  respondentEmail: text('respondent_email').notNull(),
  respondentType: text('respondent_type').notNull(),
  householdOrProgramType: text('household_or_program_type'),
  usageDuration: text('usage_duration').notNull(),
  usedFeatureAreas: text('used_feature_areas').array().notNull().default([]),
  previousPainScore: integer('previous_pain_score').notNull(),
  improvementScore: integer('improvement_score').notNull(),
  easeScore: integer('ease_score').notNull(),
  trustScore: integer('trust_score').notNull(),
  retentionScore: integer('retention_score').notNull(),
  payScore: integer('pay_score').notNull(),
  referralScore: integer('referral_score').notNull(),
  positioningClarityScore: integer('positioning_clarity_score').notNull(),
  reasonableMonthlyPriceBucket: text('reasonable_monthly_price_bucket').notNull(),
  pricingNotes: text('pricing_notes'),
  replacedWhat: text('replaced_what').notNull(),
  mostUseful: text('most_useful').notNull(),
  confusingOrBurdensome: text('confusing_or_burdensome').notNull(),
  mustHaveChange: text('must_have_change').notNull(),
  lostAccessReaction: text('lost_access_reaction').notNull(),
  recommendTo: text('recommend_to').notNull(),
  referralMessage: text('referral_message').notNull(),
  additionalNotes: text('additional_notes'),
  mayContact: boolean('may_contact').notNull().default(false),
  mayQuoteAnonymized: boolean('may_quote_anonymized').notNull().default(false),
  mayQuoteWithName: boolean('may_quote_with_name').notNull().default(false),
  forkTestFitScore: numeric('fork_test_fit_score', { precision: 4, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})
