CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"title" text NOT NULL,
	"publisher" text,
	"author" text,
	"edition" text,
	"grade_level" text,
	"subject_category" text,
	"isbn" text,
	"resource_type" text NOT NULL,
	"total_pages" integer,
	"total_lessons" integer,
	"total_chapters" integer,
	"verification_status" text DEFAULT 'user-submitted' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resources_household_idx" ON "resources" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "resources_household_type_idx" ON "resources" USING btree ("household_id","resource_type");