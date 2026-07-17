ALTER TABLE "household_members" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "learners" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "learners" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "learners" ADD COLUMN "dob" date;--> statement-breakpoint
ALTER TABLE "learners" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "learners" ADD CONSTRAINT "learners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;