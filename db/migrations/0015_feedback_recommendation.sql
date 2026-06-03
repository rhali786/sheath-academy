ALTER TABLE "user_feedback"
ADD COLUMN IF NOT EXISTS "recommendation" text;
