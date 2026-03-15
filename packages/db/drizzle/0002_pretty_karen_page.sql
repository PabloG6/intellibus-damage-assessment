ALTER TABLE "incidents" ADD COLUMN "formatted_address" text;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "place_id" text;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "address_resolution" text DEFAULT 'missing' NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "enriched_at" timestamp with time zone;