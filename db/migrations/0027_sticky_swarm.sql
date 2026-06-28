-- Add composite UNIQUE constraints first so the composite FKs on scores can reference them
ALTER TABLE "learners" ADD CONSTRAINT "learners_id_household_uq" UNIQUE("id","household_id");--> statement-breakpoint
ALTER TABLE "lesson_tasks" ADD CONSTRAINT "lesson_tasks_id_household_uq" UNIQUE("id","household_id");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_id_household_uq" UNIQUE("id","household_id");--> statement-breakpoint
CREATE TABLE "scores" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"subject_id" text,
	"lesson_task_id" text,
	"state" text DEFAULT 'not_graded' NOT NULL,
	"numeric_value" numeric(5, 2),
	"source" text DEFAULT 'parent' NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"comment" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "grading_scale_id" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "aggregation_rule_id" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "is_formal_course" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "credit_hours" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "term_model" text;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_learner_household_fk" FOREIGN KEY ("learner_id","household_id") REFERENCES "public"."learners"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_subject_household_fk" FOREIGN KEY ("subject_id","household_id") REFERENCES "public"."subjects"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_lesson_task_household_fk" FOREIGN KEY ("lesson_task_id","household_id") REFERENCES "public"."lesson_tasks"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scores_household_learner_subject_idx" ON "scores" USING btree ("household_id","learner_id","subject_id");--> statement-breakpoint
CREATE INDEX "scores_lesson_task_idx" ON "scores" USING btree ("lesson_task_id");
