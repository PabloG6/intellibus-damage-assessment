import { z } from "zod";

export const NETWORK_PARTY_NAME = "network";
export const NETWORK_ROOM_ID = "yardwatch-network";
export const PROBE_HEARTBEAT_INTERVAL_MS = 8_000;
export const PROBE_ONLINE_THRESHOLD_MS = 16_000;
export const PROBE_OFFLINE_THRESHOLD_MS = 40_000;
export const PROBE_UPTIME_WINDOW_MS = 15 * 60 * 1_000;
export const PROBE_UPTIME_BUCKET_MS = 30_000;
export const PROBE_UPTIME_BUCKET_COUNT =
  PROBE_UPTIME_WINDOW_MS / PROBE_UPTIME_BUCKET_MS;
export const REALTIME_TOKEN_TTL_MS = 10 * 60 * 1_000;
export const PARTYKIT_SERVICE_SECRET_HEADER = "x-yardwatch-service-secret";

export const probeStatusSchema = z.enum(["online", "degraded", "offline"]);
export type ProbeStatus = z.infer<typeof probeStatusSchema>;

export const facilityTypeSchema = z.enum([
  "hospital",
  "school",
  "police",
  "fire_station",
  "utility",
]);
export type FacilityType = z.infer<typeof facilityTypeSchema>;

export const networkProbeSchema = z.object({
  id: z.string(),
  label: z.string(),
  facilityType: facilityTypeSchema,
  lngLat: z.tuple([z.number(), z.number()]),
  areaLabel: z.string(),
  status: probeStatusSchema,
  lastSeen: z.string().nullable(),
  uptimePct: z.number().min(0).max(1),
});
export type NetworkProbe = z.infer<typeof networkProbeSchema>;

export const networkProbeIdentitySchema = networkProbeSchema.pick({
  id: true,
  label: true,
  facilityType: true,
  lngLat: true,
  areaLabel: true,
});
export type NetworkProbeIdentity = z.infer<typeof networkProbeIdentitySchema>;

export const probeRegistrationInputSchema = z.object({
  label: z.string().trim().min(2).max(120),
  facilityType: facilityTypeSchema,
  lngLat: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  areaLabel: z.string().trim().min(2).max(120),
});
export type ProbeRegistrationInput = z.infer<typeof probeRegistrationInputSchema>;

export const heartbeatMessageSchema = z.object({
  type: z.literal("heartbeat"),
  probeId: z.string(),
  sentAt: z.string().datetime().optional(),
});
export type HeartbeatMessage = z.infer<typeof heartbeatMessageSchema>;

export const probeUpdatedMessageSchema = z.object({
  type: z.literal("probe.updated"),
  probe: networkProbeSchema,
});
export type ProbeUpdatedMessage = z.infer<typeof probeUpdatedMessageSchema>;

export const heartbeatAckMessageSchema = z.object({
  type: z.literal("ack"),
  probeId: z.string(),
  receivedAt: z.string(),
  status: probeStatusSchema,
});
export type HeartbeatAckMessage = z.infer<typeof heartbeatAckMessageSchema>;

export const realtimeTokenPayloadSchema = z.object({
  role: z.literal("reporter"),
  room: z.string(),
  exp: z.number().int().positive(),
  probe: networkProbeIdentitySchema,
});
export type RealtimeTokenPayload = z.infer<typeof realtimeTokenPayloadSchema>;

export const ingestPresenceInputSchema = z.object({
  probeId: z.string(),
  status: probeStatusSchema,
  lastSeen: z.string().datetime().nullable(),
  uptimePct: z.number().min(0).max(1),
});
export type IngestPresenceInput = z.infer<typeof ingestPresenceInputSchema>;

export interface ProbeRegistrationDraft {
  id: string;
  ownerUserId: string;
  label: string;
  facilityType: FacilityType;
  lng: number;
  lat: number;
  areaLabel: string;
  status: ProbeStatus;
  lastSeenAt: Date | null;
  lastStatusChangeAt: Date;
  uptimePct: number;
  createdAt: Date;
  updatedAt: Date;
}

export function buildProbeId(ownerUserId: string) {
  const normalized = ownerUserId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `probe-${normalized || "owner"}`;
}

export function upsertProbeDraft(
  existing: ProbeRegistrationDraft | null,
  ownerUserId: string,
  input: ProbeRegistrationInput,
  now = new Date(),
): ProbeRegistrationDraft {
  if (existing) {
    return {
      ...existing,
      label: input.label,
      facilityType: input.facilityType,
      lng: input.lngLat[0],
      lat: input.lngLat[1],
      areaLabel: input.areaLabel,
      updatedAt: now,
    };
  }

  return {
    id: buildProbeId(ownerUserId),
    ownerUserId,
    label: input.label,
    facilityType: input.facilityType,
    lng: input.lngLat[0],
    lat: input.lngLat[1],
    areaLabel: input.areaLabel,
    status: "offline",
    lastSeenAt: null,
    lastStatusChangeAt: now,
    uptimePct: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function classifyProbeStatus(
  lastSeenAt: Date | number | string | null | undefined,
  now = Date.now(),
): ProbeStatus {
  if (!lastSeenAt) {
    return "offline";
  }

  const lastSeenMs =
    lastSeenAt instanceof Date
      ? lastSeenAt.getTime()
      : typeof lastSeenAt === "number"
        ? lastSeenAt
        : new Date(lastSeenAt).getTime();

  if (!Number.isFinite(lastSeenMs)) {
    return "offline";
  }

  const ageMs = now - lastSeenMs;
  if (ageMs <= PROBE_ONLINE_THRESHOLD_MS) {
    return "online";
  }

  if (ageMs <= PROBE_OFFLINE_THRESHOLD_MS) {
    return "degraded";
  }

  return "offline";
}

export function pruneHeartbeatBuckets(
  buckets: number[],
  now = Date.now(),
): number[] {
  const minBucket = Math.floor((now - PROBE_UPTIME_WINDOW_MS) / PROBE_UPTIME_BUCKET_MS);
  const seen = new Set<number>();

  return buckets
    .map((bucket) => Math.floor(bucket))
    .filter((bucket) => bucket >= minBucket)
    .sort((left, right) => left - right)
    .filter((bucket) => {
      if (seen.has(bucket)) {
        return false;
      }

      seen.add(bucket);
      return true;
    });
}

export function bucketIndexFromTimestamp(timestamp = Date.now()) {
  return Math.floor(timestamp / PROBE_UPTIME_BUCKET_MS);
}

export function registerHeartbeatBucket(
  buckets: number[],
  timestamp = Date.now(),
): number[] {
  return pruneHeartbeatBuckets([...buckets, bucketIndexFromTimestamp(timestamp)], timestamp);
}

export function computeRollingUptimePct(
  buckets: number[],
  now = Date.now(),
): number {
  const normalized = pruneHeartbeatBuckets(buckets, now);
  return Math.min(1, normalized.length / PROBE_UPTIME_BUCKET_COUNT);
}

export function normalizePartyKitHost(value: string) {
  const normalizedValue = value.trim();
  const parsed = new URL(
    normalizedValue.includes("://") ? normalizedValue : `https://${normalizedValue}`,
  );

  return parsed.host;
}

const encoder = new TextEncoder();

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4 || 4)) % 4),
    "=",
  );

  return atob(padded);
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const bytes = Array.from(new Uint8Array(signature), (byte) =>
    String.fromCharCode(byte),
  ).join("");

  return encodeBase64Url(bytes);
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

export async function signRealtimeToken(
  payload: RealtimeTokenPayload,
  secret: string,
) {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = await signValue(body, secret);
  return `${body}.${signature}`;
}

export async function verifyRealtimeToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signValue(encodedPayload, secret);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = realtimeTokenPayloadSchema.parse(
      JSON.parse(decodeBase64Url(encodedPayload)),
    );

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
