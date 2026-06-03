CREATE TABLE "changelog_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"label" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'steward' NOT NULL,
	"pr_number" integer,
	"user_credit" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "household_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "household_members_hh_user_unique" UNIQUE("household_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "households" DROP CONSTRAINT "households_user_id_unique";--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "recommendation" text;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD COLUMN "changelog_entry_id" text;--> statement-breakpoint
ALTER TABLE "household_invitations" ADD CONSTRAINT "household_invitations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_invitations" ADD CONSTRAINT "household_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "household_invitations_household_idx" ON "household_invitations" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "household_invitations_email_idx" ON "household_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "household_members_user_idx" ON "household_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "household_members_household_idx" ON "household_members" USING btree ("household_id");--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_changelog_entry_id_changelog_entries_id_fk" FOREIGN KEY ("changelog_entry_id") REFERENCES "public"."changelog_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" DROP COLUMN "changelog_version";--> statement-breakpoint
ALTER TABLE "user_feedback" DROP COLUMN "changelog_label";--> statement-breakpoint
ALTER TABLE "user_feedback" DROP COLUMN "changelog_user_credit";--> statement-breakpoint
-- Backfill: create one owner membership per existing household from the
-- denormalized households.user_id column. ON CONFLICT is a safety net for
-- re-runs (e.g. if the migration is applied twice in testing).
INSERT INTO "household_members" ("id", "household_id", "user_id", "role", "created_at", "updated_at")
SELECT
  'hm_backfill_' || "id",
  "id",
  "user_id",
  'owner',
  NOW(),
  NOW()
FROM "households"
ON CONFLICT ("household_id", "user_id") DO NOTHING;