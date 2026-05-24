CREATE TABLE IF NOT EXISTS "usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text NOT NULL,
	"household_id" text NOT NULL,
	"learner_id" text,
	"feature_area" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"metadata" jsonb,
	"occurred_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_household_occurred_idx" ON "usage_events" USING btree ("household_id","occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_user_occurred_idx" ON "usage_events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_type_occurred_idx" ON "usage_events" USING btree ("event_type","occurred_at");
