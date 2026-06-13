CREATE TABLE "learning_time_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"subject_id" text,
	"lesson_task_id" text,
	"time_channel_type" text NOT NULL,
	"target_minutes" integer,
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"status" text NOT NULL,
	"started_at" timestamp,
	"paused_at" timestamp,
	"ended_at" timestamp,
	"ended_by" text,
	"outcome" text,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_time_sessions" ADD CONSTRAINT "learning_time_sessions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_time_sessions" ADD CONSTRAINT "learning_time_sessions_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_time_sessions" ADD CONSTRAINT "learning_time_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_time_sessions" ADD CONSTRAINT "learning_time_sessions_lesson_task_id_lesson_tasks_id_fk" FOREIGN KEY ("lesson_task_id") REFERENCES "public"."lesson_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_time_sessions_household_learner_idx" ON "learning_time_sessions" USING btree ("household_id","learner_id");