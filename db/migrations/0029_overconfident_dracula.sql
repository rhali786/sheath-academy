CREATE TABLE "autonomy_unlocks" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"badge_id" text NOT NULL,
	"unlocked_at" timestamp NOT NULL,
	"granted_by" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_award_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"badge_award_id" text NOT NULL,
	"evidence_id" text NOT NULL,
	"added_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_awards" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"badge_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"verified_at" timestamp,
	"approved_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "badge_awards_id_household_uq" UNIQUE("id","household_id")
);
--> statement-breakpoint
CREATE TABLE "badge_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"criteria" text NOT NULL,
	"emblem_key" text NOT NULL,
	"grade_bands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verification_requirement" text DEFAULT 'none' NOT NULL,
	"is_starter" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"visibility" text DEFAULT 'household' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_settings" (
	"household_id" text PRIMARY KEY NOT NULL,
	"platform_badges_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "autonomy_unlocks" ADD CONSTRAINT "autonomy_unlocks_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_unlocks" ADD CONSTRAINT "autonomy_unlocks_badge_id_badge_definitions_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badge_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_unlocks" ADD CONSTRAINT "autonomy_unlocks_learner_household_fk" FOREIGN KEY ("learner_id","household_id") REFERENCES "public"."learners"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_evidence" ADD CONSTRAINT "portfolio_evidence_id_household_uq" UNIQUE("id","household_id");--> statement-breakpoint
ALTER TABLE "badge_award_evidence" ADD CONSTRAINT "badge_award_evidence_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_award_evidence" ADD CONSTRAINT "badge_award_evidence_award_household_fk" FOREIGN KEY ("badge_award_id","household_id") REFERENCES "public"."badge_awards"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_award_evidence" ADD CONSTRAINT "badge_award_evidence_evidence_household_fk" FOREIGN KEY ("evidence_id","household_id") REFERENCES "public"."portfolio_evidence"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_badge_id_badge_definitions_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badge_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_learner_household_fk" FOREIGN KEY ("learner_id","household_id") REFERENCES "public"."learners"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_definitions" ADD CONSTRAINT "badge_definitions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_settings" ADD CONSTRAINT "badge_settings_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "autonomy_unlocks_household_learner_idx" ON "autonomy_unlocks" USING btree ("household_id","learner_id");--> statement-breakpoint
CREATE INDEX "badge_award_evidence_award_idx" ON "badge_award_evidence" USING btree ("badge_award_id");--> statement-breakpoint
CREATE INDEX "badge_awards_household_learner_idx" ON "badge_awards" USING btree ("household_id","learner_id");--> statement-breakpoint
CREATE INDEX "badge_awards_badge_idx" ON "badge_awards" USING btree ("badge_id");--> statement-breakpoint
CREATE INDEX "badge_definitions_household_idx" ON "badge_definitions" USING btree ("household_id");