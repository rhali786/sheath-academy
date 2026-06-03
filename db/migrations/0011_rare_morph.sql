ALTER TABLE "user_feedback" ADD COLUMN "status" text DEFAULT 'submitted' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "feature_area" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "feedback_type" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "risk_level" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "confidence" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "duplicate_of_feedback_id" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "admin_approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "admin_approved_by_user_id" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "pr_number" integer;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "preview_url" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "uat_instructions" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "version_resolved" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "changelog_version" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "changelog_label" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "changelog_user_credit" text;--> statement-breakpoint
CREATE INDEX "user_feedback_user_status_idx" ON "user_feedback" USING btree ("user_id","status");