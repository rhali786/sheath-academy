ALTER TABLE "school_years" ADD COLUMN "required_days" integer;--> statement-breakpoint
ALTER TABLE "school_years" ADD COLUMN "required_hours" integer;--> statement-breakpoint
ALTER TABLE "school_years" ADD COLUMN "tracking_method" text;--> statement-breakpoint
ALTER TABLE "school_years" ADD COLUMN "school_days" jsonb;--> statement-breakpoint
ALTER TABLE "school_years" ADD COLUMN "breaks" jsonb;--> statement-breakpoint
ALTER TABLE "school_years" ADD COLUMN "term_structure" text;