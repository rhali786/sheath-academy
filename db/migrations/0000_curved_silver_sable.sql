CREATE TABLE "attendance_events" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"attendance_date" date NOT NULL,
	"occurred_at" timestamp,
	"status" text NOT NULL,
	"minutes" integer,
	"notes" text,
	"voided_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "household_settings_household_key_unique" UNIQUE("household_id","key")
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"setup_completed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "households_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"name" text NOT NULL,
	"display_color" text,
	"grade_level" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"subject_id" text,
	"title" text NOT NULL,
	"description" text,
	"notes" text,
	"due_date" date,
	"status" text DEFAULT 'not_started' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"skipped_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"subject_id" text,
	"lesson_task_id" text,
	"quran_session_id" text,
	"attendance_event_id" text,
	"title" text NOT NULL,
	"description" text,
	"evidence_type" text NOT NULL,
	"url" text,
	"evidence_date" date NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_validation_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"tenant_id" text,
	"respondent_name" text,
	"respondent_email" text NOT NULL,
	"respondent_type" text NOT NULL,
	"household_or_program_type" text,
	"usage_duration" text NOT NULL,
	"used_feature_areas" text[] DEFAULT '{}' NOT NULL,
	"previous_pain_score" integer NOT NULL,
	"improvement_score" integer NOT NULL,
	"ease_score" integer NOT NULL,
	"trust_score" integer NOT NULL,
	"retention_score" integer NOT NULL,
	"pay_score" integer NOT NULL,
	"referral_score" integer NOT NULL,
	"positioning_clarity_score" integer NOT NULL,
	"reasonable_monthly_price_bucket" text NOT NULL,
	"pricing_notes" text,
	"replaced_what" text NOT NULL,
	"most_useful" text NOT NULL,
	"confusing_or_burdensome" text NOT NULL,
	"must_have_change" text NOT NULL,
	"lost_access_reaction" text NOT NULL,
	"recommend_to" text NOT NULL,
	"referral_message" text NOT NULL,
	"additional_notes" text,
	"may_contact" boolean DEFAULT false NOT NULL,
	"may_quote_anonymized" boolean DEFAULT false NOT NULL,
	"may_quote_with_name" boolean DEFAULT false NOT NULL,
	"fork_test_fit_score" numeric(4, 2) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quran_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"session_date" date NOT NULL,
	"session_type" text NOT NULL,
	"surah" text,
	"from_ayah" integer,
	"to_ayah" integer,
	"duration_minutes" integer,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_years" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_settings_user_key_unique" UNIQUE("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'user',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_settings" ADD CONSTRAINT "household_settings_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learners" ADD CONSTRAINT "learners_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_tasks" ADD CONSTRAINT "lesson_tasks_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_tasks" ADD CONSTRAINT "lesson_tasks_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_tasks" ADD CONSTRAINT "lesson_tasks_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_evidence" ADD CONSTRAINT "portfolio_evidence_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_evidence" ADD CONSTRAINT "portfolio_evidence_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_evidence" ADD CONSTRAINT "portfolio_evidence_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_evidence" ADD CONSTRAINT "portfolio_evidence_lesson_task_id_lesson_tasks_id_fk" FOREIGN KEY ("lesson_task_id") REFERENCES "public"."lesson_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_evidence" ADD CONSTRAINT "portfolio_evidence_quran_session_id_quran_sessions_id_fk" FOREIGN KEY ("quran_session_id") REFERENCES "public"."quran_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_evidence" ADD CONSTRAINT "portfolio_evidence_attendance_event_id_attendance_events_id_fk" FOREIGN KEY ("attendance_event_id") REFERENCES "public"."attendance_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_validation_responses" ADD CONSTRAINT "product_validation_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_sessions" ADD CONSTRAINT "quran_sessions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_sessions" ADD CONSTRAINT "quran_sessions_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_years" ADD CONSTRAINT "school_years_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_events_household_learner_date_idx" ON "attendance_events" USING btree ("household_id","learner_id","attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_events_household_date_idx" ON "attendance_events" USING btree ("household_id","attendance_date");--> statement-breakpoint
CREATE INDEX "household_settings_household_key_idx" ON "household_settings" USING btree ("household_id","key");--> statement-breakpoint
CREATE INDEX "learners_household_active_idx" ON "learners" USING btree ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "lesson_tasks_household_learner_due_idx" ON "lesson_tasks" USING btree ("household_id","learner_id","due_date");--> statement-breakpoint
CREATE INDEX "lesson_tasks_household_subject_idx" ON "lesson_tasks" USING btree ("household_id","subject_id");--> statement-breakpoint
CREATE INDEX "lesson_tasks_household_status_idx" ON "lesson_tasks" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "portfolio_evidence_household_learner_date_idx" ON "portfolio_evidence" USING btree ("household_id","learner_id","evidence_date");--> statement-breakpoint
CREATE INDEX "portfolio_evidence_household_subject_idx" ON "portfolio_evidence" USING btree ("household_id","subject_id");--> statement-breakpoint
CREATE INDEX "quran_sessions_household_learner_date_idx" ON "quran_sessions" USING btree ("household_id","learner_id","session_date");--> statement-breakpoint
CREATE INDEX "quran_sessions_household_date_idx" ON "quran_sessions" USING btree ("household_id","session_date");--> statement-breakpoint
CREATE INDEX "school_years_household_active_idx" ON "school_years" USING btree ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "subjects_household_active_idx" ON "subjects" USING btree ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "user_settings_user_key_idx" ON "user_settings" USING btree ("user_id","key");