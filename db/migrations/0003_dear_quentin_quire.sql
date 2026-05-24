-- Wave 1: add household_id to product_validation_responses; add admin aggregate indexes.
-- NOTE: usage_events table already exists from 0002_usage_events.sql — not recreated here.

ALTER TABLE "product_validation_responses" ADD COLUMN "household_id" text;--> statement-breakpoint
ALTER TABLE "product_validation_responses" ADD CONSTRAINT "product_validation_responses_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_events_date_household_idx" ON "attendance_events" USING btree ("attendance_date","household_id");--> statement-breakpoint
CREATE INDEX "lesson_tasks_due_household_idx" ON "lesson_tasks" USING btree ("due_date","household_id");--> statement-breakpoint
CREATE INDEX "portfolio_evidence_date_household_idx" ON "portfolio_evidence" USING btree ("evidence_date","household_id");--> statement-breakpoint
CREATE INDEX "quran_sessions_date_household_idx" ON "quran_sessions" USING btree ("session_date","household_id");
