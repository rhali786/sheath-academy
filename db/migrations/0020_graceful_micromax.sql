CREATE TABLE "subject_learners" (
	"subject_id" text NOT NULL,
	"learner_id" text NOT NULL,
	CONSTRAINT "subject_learners_subject_id_learner_id_pk" PRIMARY KEY("subject_id","learner_id")
);
--> statement-breakpoint
ALTER TABLE "subject_learners" ADD CONSTRAINT "subject_learners_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_learners" ADD CONSTRAINT "subject_learners_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;