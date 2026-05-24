ALTER TABLE "subjects" ADD COLUMN "learner_id" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "category" text DEFAULT 'core' NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;