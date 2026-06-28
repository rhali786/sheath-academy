CREATE TABLE "lesson_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_task_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"step_text" text NOT NULL,
	"type" text DEFAULT 'instruction' NOT NULL,
	"done_criteria" text,
	"quantity" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_steps" ADD CONSTRAINT "lesson_steps_lesson_task_id_lesson_tasks_id_fk" FOREIGN KEY ("lesson_task_id") REFERENCES "public"."lesson_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_steps_lesson_task_idx" ON "lesson_steps" USING btree ("lesson_task_id");