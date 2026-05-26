ALTER TABLE "changelog_entries" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
UPDATE "changelog_entries" SET "status" = 'shipped';
