CREATE TABLE "subject_resources" (
	"subject_id" text NOT NULL,
	"resource_id" text NOT NULL,
	CONSTRAINT "subject_resources_subject_id_resource_id_pk" PRIMARY KEY("subject_id","resource_id")
);
--> statement-breakpoint
ALTER TABLE "subject_resources" ADD CONSTRAINT "subject_resources_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_resources" ADD CONSTRAINT "subject_resources_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subject_resources_resource_idx" ON "subject_resources" USING btree ("resource_id");