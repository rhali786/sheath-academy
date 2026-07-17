ALTER TABLE "lesson_tasks" ADD COLUMN "curriculum" text;--> statement-breakpoint
ALTER TABLE "lesson_tasks" ADD COLUMN "chapter" text;--> statement-breakpoint
ALTER TABLE "lesson_tasks" ADD COLUMN "has_homework" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_tasks" ADD COLUMN "has_assessment" boolean DEFAULT false NOT NULL;