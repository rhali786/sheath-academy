ALTER TABLE "subjects" ADD COLUMN "school_year_id" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subjects_household_school_year_idx" ON "subjects" USING btree ("household_id","school_year_id");--> statement-breakpoint
UPDATE subjects SET school_year_id = (
  SELECT sy.id FROM school_years sy
  WHERE sy.household_id = subjects.household_id AND sy.is_active = true LIMIT 1
) WHERE school_year_id IS NULL;