CREATE TABLE "network_probes" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"label" text NOT NULL,
	"facility_type" text NOT NULL,
	"lng" double precision NOT NULL,
	"lat" double precision NOT NULL,
	"area_label" text NOT NULL,
	"status" text DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"last_status_change_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uptime_pct" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "network_probes" ADD CONSTRAINT "network_probes_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "network_probes_owner_user_uidx" ON "network_probes" USING btree ("owner_user_id");
--> statement-breakpoint
CREATE INDEX "network_probes_status_idx" ON "network_probes" USING btree ("status");
