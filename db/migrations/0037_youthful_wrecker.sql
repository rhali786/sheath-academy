ALTER TABLE "badge_awards" ADD COLUMN "progress_current" integer;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD COLUMN "progress_target" integer;--> statement-breakpoint
ALTER TABLE "badge_definitions" ADD COLUMN "image_url" text;