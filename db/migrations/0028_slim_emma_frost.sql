CREATE TABLE "compliance_deadlines" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"school_year_id" text NOT NULL,
	"label" text NOT NULL,
	"due_date" date NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"requirement_type" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"school_year_id" text NOT NULL,
	"requirement_type" text NOT NULL,
	"override_value" numeric(8, 2) NOT NULL,
	"reason" text,
	"applied_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_rulesets" (
	"id" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"pathway_key" text NOT NULL,
	"requirement_type" text NOT NULL,
	"value" numeric(8, 2),
	"unit" text DEFAULT 'days' NOT NULL,
	"source_url" text,
	"last_verified_at" timestamp,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"school_year_id" text NOT NULL,
	"status" text DEFAULT 'drafted' NOT NULL,
	"submitted_at" timestamp,
	"accepted_at" timestamp,
	"snapshot_json" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_compliance_config" (
	"household_id" text PRIMARY KEY NOT NULL,
	"active_ruleset_id" text,
	"pathway_key" text,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
-- Add composite UNIQUE to school_years FIRST so composite FKs below can reference it
ALTER TABLE "school_years" ADD CONSTRAINT "school_years_id_household_uq" UNIQUE("id","household_id");--> statement-breakpoint
ALTER TABLE "compliance_deadlines" ADD CONSTRAINT "compliance_deadlines_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_deadlines" ADD CONSTRAINT "compliance_deadlines_school_year_household_fk" FOREIGN KEY ("school_year_id","household_id") REFERENCES "public"."school_years"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_overrides" ADD CONSTRAINT "compliance_overrides_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_overrides" ADD CONSTRAINT "compliance_overrides_school_year_household_fk" FOREIGN KEY ("school_year_id","household_id") REFERENCES "public"."school_years"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_submissions" ADD CONSTRAINT "compliance_submissions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_submissions" ADD CONSTRAINT "compliance_submissions_school_year_household_fk" FOREIGN KEY ("school_year_id","household_id") REFERENCES "public"."school_years"("id","household_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_compliance_config" ADD CONSTRAINT "household_compliance_config_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_compliance_config" ADD CONSTRAINT "household_compliance_config_active_ruleset_id_compliance_rulesets_id_fk" FOREIGN KEY ("active_ruleset_id") REFERENCES "public"."compliance_rulesets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "compliance_deadlines_household_year_idx" ON "compliance_deadlines" USING btree ("household_id","school_year_id");--> statement-breakpoint
CREATE INDEX "compliance_overrides_household_year_idx" ON "compliance_overrides" USING btree ("household_id","school_year_id");--> statement-breakpoint
CREATE INDEX "compliance_rulesets_state_pathway_idx" ON "compliance_rulesets" USING btree ("state","pathway_key");--> statement-breakpoint
CREATE INDEX "compliance_submissions_household_year_idx" ON "compliance_submissions" USING btree ("household_id","school_year_id");