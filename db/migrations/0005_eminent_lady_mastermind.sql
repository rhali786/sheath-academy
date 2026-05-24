CREATE TABLE "resource_community_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"feedback_id" text NOT NULL,
	"difficulty" text,
	"islamic_note" text,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"parent_id" text NOT NULL,
	"display_parent_id" text,
	"compatibility" text NOT NULL,
	"rating" integer,
	"difficulty" text,
	"actual_time_minutes" integer,
	"islamic_note" text,
	"works_independently" boolean,
	"works_teacher_led" boolean,
	"privacy_level" text DEFAULT 'anonymous' NOT NULL,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp NOT NULL
);
