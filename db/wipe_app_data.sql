-- One-time data wipe. Run once before db:seed:demo.
-- FK-safe order: children before parents.
-- This is NOT a drizzle migration — run directly via psql:
--   psql $DATABASE_URL < db/wipe_app_data.sql
TRUNCATE
  message_attachments,
  messages,
  conversation_participants,
  conversations,
  portfolio_evidence,
  lesson_tasks,
  attendance_events,
  quran_sessions,
  subjects,
  school_years,
  household_settings,
  user_settings,
  learners,
  product_validation_responses,
  auth_accounts,
  verification_tokens,
  households,
  users
CASCADE;
