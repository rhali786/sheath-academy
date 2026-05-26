CREATE TABLE "changelog_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"label" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'steward' NOT NULL,
	"pr_number" integer,
	"user_credit" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "changelog_entry_id" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_changelog_entry_id_changelog_entries_id_fk" FOREIGN KEY ("changelog_entry_id") REFERENCES "public"."changelog_entries"("id") ON DELETE no action ON UPDATE no action;
