CREATE TABLE "portfolio_evidence_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"evidence_item_id" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portfolio_evidence_attachments" ADD CONSTRAINT "portfolio_evidence_attachments_evidence_item_id_portfolio_evidence_id_fk" FOREIGN KEY ("evidence_item_id") REFERENCES "public"."portfolio_evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portfolio_evidence_attachments_evidence_item_idx" ON "portfolio_evidence_attachments" USING btree ("evidence_item_id");