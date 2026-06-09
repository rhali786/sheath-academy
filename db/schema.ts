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
  primaryKey,
  customType,
} from 'drizzle-orm/pg-core'

// Drizzle pg-core has no native bytea — define it via customType.
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return 'bytea'
  },
})

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  role: text('role').default('user'),
  username: text('username'),
  usernameNormalized: text('username_normalized').unique(),
  passwordHash: text('password_hash'),
  passwordUpdatedAt: timestamp('password_updated_at'),
  createdVia: text('created_via'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

// ─── Auth.js adapter tables ──────────────────────────────────────────────────

export const accounts = pgTable(
  'auth_accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
  ],
)

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.identifier, t.token] }),
  ],
)

// ─── Households ──────────────────────────────────────────────────────────────

export const households = pgTable('households', {
  id: text('id').primaryKey(),
  // Denormalized owner pointer — kept for backfill safety. Unique constraint
  // dropped to support multiple memberships. household_members is canonical.
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('America/New_York'),
  setupCompletedAt: timestamp('setup_completed_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

// ─── Household Members ────────────────────────────────────────────────────────

export const householdMembers = pgTable(
  'household_members',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'owner' | 'member'
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    unique('household_members_hh_user_unique').on(t.householdId, t.userId),
    index('household_members_user_idx').on(t.userId),
    index('household_members_household_idx').on(t.householdId),
  ],
)

// ─── Household Invitations ────────────────────────────────────────────────────

export const householdInvitations = pgTable(
  'household_invitations',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull().default('member'),
    invitedByUserId: text('invited_by_user_id').notNull().references(() => users.id),
    tokenHash: text('token_hash').notNull().unique(),
    status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'revoked' | 'expired'
    expiresAt: timestamp('expires_at').notNull(),
    acceptedAt: timestamp('accepted_at'),
    createdAt: timestamp('created_at').notNull(),
  },
  (t) => [
    index('household_invitations_household_idx').on(t.householdId),
    index('household_invitations_email_idx').on(t.email),
  ],
)

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
    requiredDays: integer('required_days'),
    requiredHours: integer('required_hours'),
    trackingMethod: text('tracking_method'),
    schoolDays: jsonb('school_days'),
    breaks: jsonb('breaks'),
    termStructure: text('term_structure'),
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

// ─── Personal Todos ───────────────────────────────────────────────────────────

export const personalTodos = pgTable(
  'personal_todos',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    text: text('text').notNull(),
    done: boolean('done').notNull().default(false),
    dueDate: date('due_date'),
    sortOrder: integer('sort_order').notNull().default(0),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('personal_todos_household_done_idx').on(t.householdId, t.done)],
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
    // Admin aggregate: scan by date across all households, group by household_id
    index('lesson_tasks_due_household_idx').on(t.dueDate, t.householdId),
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
    // Admin aggregate: scan by date across all households, group by household_id
    index('attendance_events_date_household_idx').on(t.attendanceDate, t.householdId),
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
    // Admin aggregate: scan by date across all households, group by household_id
    index('quran_sessions_date_household_idx').on(t.sessionDate, t.householdId),
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
    // Admin aggregate: scan by date across all households, group by household_id
    index('portfolio_evidence_date_household_idx').on(t.evidenceDate, t.householdId),
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

// usage_events table removed — admin metrics now read from domain tables directly.

// ─── Product Validation Responses ────────────────────────────────────────────

export const productValidationResponses = pgTable('product_validation_responses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  householdId: text('household_id').references(() => households.id),
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

// ─── Password Reset Tokens ────────────────────────────────────────────────────

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull(),
  },
  (t) => [index('password_reset_tokens_user_idx').on(t.userId)],
)

// ─── Resources Catalog ────────────────────────────────────────────────────

export const resources = pgTable(
  'resources',
  {
    id: text('id').primaryKey(),
    householdId: text('household_id').notNull().references(() => households.id),
    title: text('title').notNull(),
    publisher: text('publisher'),
    author: text('author'),
    edition: text('edition'),
    gradeLevel: text('grade_level'),
    subjectCategory: text('subject_category'),
    isbn: text('isbn'),
    resourceType: text('resource_type').notNull(),
    totalPages: integer('total_pages'),
    totalLessons: integer('total_lessons'),
    totalChapters: integer('total_chapters'),
    verificationStatus: text('verification_status').notNull().default('user-submitted'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('resources_household_idx').on(t.householdId),
    index('resources_household_type_idx').on(t.householdId, t.resourceType),
  ],
)

// ─── Resource Feedback & Community Notes ──────────────────────────────────

export const resourceFeedback = pgTable('resource_feedback', {
  id: text('id').primaryKey(),
  resourceId: text('resource_id').notNull(),
  parentId: text('parent_id').notNull(),
  displayParentId: text('display_parent_id'),
  compatibility: text('compatibility').notNull(),
  rating: integer('rating'),
  difficulty: text('difficulty'),
  actualTimeMinutes: integer('actual_time_minutes'),
  islamicNote: text('islamic_note'),
  worksIndependently: boolean('works_independently'),
  worksTeacherLed: boolean('works_teacher_led'),
  privacyLevel: text('privacy_level').notNull().default('anonymous'),
  status: text('status').notNull().default('pending_review'),
  createdAt: timestamp('created_at').notNull(),
})

export const resourceCommunityNotes = pgTable('resource_community_notes', {
  id: text('id').primaryKey(),
  resourceId: text('resource_id').notNull(),
  feedbackId: text('feedback_id').notNull(),
  difficulty: text('difficulty'),
  islamicNote: text('islamic_note'),
  status: text('status').notNull().default('pending_review'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

// ─── Changelog Entries ───────────────────────────────────────────────────────
// Canonical source of truth for the About-page changelog.
// One row per PR/version milestone. Created by run-daily when the steward PR
// is opened, then flipped from pending -> shipped after merge into dev.
// Feedback rows link back via changelogEntryId.

export const changelogEntries = pgTable('changelog_entries', {
  id: text('id').primaryKey(),
  version: text('version').notNull(),
  label: text('label').notNull(),
  detail: text('detail').notNull().default(''),
  source: text('source').notNull().default('steward'),
  prNumber: integer('pr_number'),
  userCredit: text('user_credit'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull(),
})

// ─── User Feedback ────────────────────────────────────────────────────────────

export const userFeedback = pgTable(
  'user_feedback',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id),
    householdId: text('household_id').references(() => households.id),
    userEmail: text('user_email').notNull(),
    pagePath: text('page_path').notNull(),
    sentiment: text('sentiment').notNull(),
    message: text('message'),
    createdAt: timestamp('created_at').notNull(),

    status: text('status').notNull().default('submitted'),
    featureArea: text('feature_area'),
    feedbackType: text('feedback_type'),
    riskLevel: text('risk_level'),
    confidence: text('confidence'),
    recommendation: text('recommendation'),

    duplicateOfFeedbackId: text('duplicate_of_feedback_id'),

    adminApprovedAt: timestamp('admin_approved_at'),
    adminApprovedByUserId: text('admin_approved_by_user_id'),

    prNumber: integer('pr_number'),
    previewUrl: text('preview_url'),
    uatInstructions: text('uat_instructions'),

    versionResolved: text('version_resolved'),
    resolvedAt: timestamp('resolved_at'),

    // Traceability backlink to changelog_entries (canonical changelog owner).
    // changelog_version/label/user_credit columns remain in the DB for
    // backward compat but are no longer written to by the steward.
    changelogEntryId: text('changelog_entry_id').references(() => changelogEntries.id),
  },
  (t) => [
    index('user_feedback_created_at_idx').on(t.createdAt),
    index('user_feedback_user_status_idx').on(t.userId, t.status),
  ],
)

// ─── Messaging ────────────────────────────────────────────────────────────────

export const conversations = pgTable(
  'conversations',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(), // 'direct' | 'group'
    title: text('title'),
    createdByUserId: text('created_by_user_id').notNull().references(() => users.id),
    lastMessageAt: timestamp('last_message_at'),
    settings: jsonb('settings'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('conversations_last_message_at_idx').on(t.lastMessageAt)],
)

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'admin' | 'member'
    lastReadAt: timestamp('last_read_at'),
    joinedAt: timestamp('joined_at').notNull(),
    leftAt: timestamp('left_at'),
  },
  (t) => [
    unique('conv_participants_conv_user_unique').on(t.conversationId, t.userId),
    index('conv_participants_user_idx').on(t.userId),
    index('conv_participants_conv_idx').on(t.conversationId),
  ],
)

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderUserId: text('sender_user_id').notNull().references(() => users.id),
    body: text('body').notNull().default(''),
    reactions: jsonb('reactions'),
    createdAt: timestamp('created_at').notNull(),
  },
  (t) => [index('messages_conv_created_id_idx').on(t.conversationId, t.createdAt, t.id)],
)

export const messageAttachments = pgTable(
  'message_attachments',
  {
    id: text('id').primaryKey(),
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // 'image'
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    data: bytea('data').notNull(),
    createdAt: timestamp('created_at').notNull(),
  },
  (t) => [index('message_attachments_message_idx').on(t.messageId)],
)

// ─── Portfolio Evidence Attachments ───────────────────────────────────────────

export const portfolioEvidenceAttachments = pgTable(
  'portfolio_evidence_attachments',
  {
    id: text('id').primaryKey(),
    evidenceItemId: text('evidence_item_id')
      .notNull()
      .references(() => portfolioEvidence.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    data: bytea('data').notNull(),
    createdAt: timestamp('created_at').notNull(),
  },
  (t) => [index('portfolio_evidence_attachments_evidence_item_idx').on(t.evidenceItemId)],
)
