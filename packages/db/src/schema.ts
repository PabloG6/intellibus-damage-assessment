import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import type { MultiPolygon } from "geojson";
import { user } from "../auth.schema";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  organizationId: varchar("organization_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: text("id").primaryKey(),
  datasetName: text("dataset_name").notNull(),
  geometry: jsonb("geometry").$type<MultiPolygon>().notNull(),
  centroidLng: doublePrecision("centroid_lng").notNull(),
  centroidLat: doublePrecision("centroid_lat").notNull(),
  minLng: doublePrecision("min_lng").notNull(),
  minLat: doublePrecision("min_lat").notNull(),
  maxLng: doublePrecision("max_lng").notNull(),
  maxLat: doublePrecision("max_lat").notNull(),
  damagePct0m: doublePrecision("damage_pct_0m").notNull(),
  damagePct10m: doublePrecision("damage_pct_10m").notNull(),
  damagePct20m: doublePrecision("damage_pct_20m").notNull(),
  builtPct0m: doublePrecision("built_pct_0m").notNull(),
  unknownPct: doublePrecision("unknown_pct").notNull(),
  damaged: boolean("damaged").notNull(),
  severity: text("severity").notNull(),
  formattedAddress: text("formatted_address"),
  placeId: text("place_id"),
  addressResolution: text("address_resolution").notNull().default("missing"),
  importedAt: timestamp("imported_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  enrichedAt: timestamp("enriched_at", { withTimezone: true }),
});

export const networkProbes = pgTable(
  "network_probes",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    facilityType: text("facility_type").notNull(),
    lng: doublePrecision("lng").notNull(),
    lat: doublePrecision("lat").notNull(),
    areaLabel: text("area_label").notNull(),
    status: text("status").notNull().default("offline"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    lastStatusChangeAt: timestamp("last_status_change_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    uptimePct: doublePrecision("uptime_pct").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("network_probes_owner_user_uidx").on(table.ownerUserId),
    index("network_probes_status_idx").on(table.status),
  ],
);
