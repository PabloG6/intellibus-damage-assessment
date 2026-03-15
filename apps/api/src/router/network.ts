import { TRPCError } from "@trpc/server";
import { asc, eq, networkProbes } from "@workspace/db";
import type { Database } from "../db";
import {
  ingestPresenceInputSchema,
  NETWORK_ROOM_ID,
  normalizePartyKitHost,
  PARTYKIT_SERVICE_SECRET_HEADER,
  PROBE_HEARTBEAT_INTERVAL_MS,
  REALTIME_TOKEN_TTL_MS,
  signRealtimeToken,
  upsertProbeDraft,
  probeRegistrationInputSchema,
  type NetworkProbe,
} from "../network";
import { authProcedure, publicProcedure, router } from "../trpc";

function toPublicProbe(
  row: typeof networkProbes.$inferSelect,
): NetworkProbe {
  return {
    id: row.id,
    label: row.label,
    facilityType: row.facilityType as NetworkProbe["facilityType"],
    lngLat: [row.lng, row.lat],
    areaLabel: row.areaLabel,
    status: row.status as NetworkProbe["status"],
    lastSeen: row.lastSeenAt?.toISOString() ?? null,
    uptimePct: row.uptimePct,
  };
}

async function getProbeByOwner(
  db: Database,
  ownerUserId: string,
) {
  const [probe] = await db
    .select()
    .from(networkProbes)
    .where(eq(networkProbes.ownerUserId, ownerUserId))
    .limit(1);

  return probe ?? null;
}

const serviceProcedure = publicProcedure.use(({ ctx, next }) => {
  const expectedSecret = ctx.env.PARTYKIT_SERVICE_SECRET;
  const providedSecret = ctx.req.headers.get(PARTYKIT_SERVICE_SECRET_HEADER);

  if (!expectedSecret || providedSecret !== expectedSecret) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid service credentials",
    });
  }

  return next();
});

export const networkRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(networkProbes)
      .orderBy(asc(networkProbes.label));

    return rows.map(toPublicProbe);
  }),

  mine: authProcedure.query(async ({ ctx }) => {
    const probe = await getProbeByOwner(ctx.db, ctx.auth.userId);
    return probe ? toPublicProbe(probe) : null;
  }),

  upsertMine: authProcedure
    .input(probeRegistrationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const existing = await getProbeByOwner(ctx.db, ctx.auth.userId);
      const draft = upsertProbeDraft(
        existing
          ? {
              id: existing.id,
              ownerUserId: existing.ownerUserId,
              label: existing.label,
              facilityType: existing.facilityType as NetworkProbe["facilityType"],
              lng: existing.lng,
              lat: existing.lat,
              areaLabel: existing.areaLabel,
              status: existing.status as NetworkProbe["status"],
              lastSeenAt: existing.lastSeenAt,
              lastStatusChangeAt: existing.lastStatusChangeAt,
              uptimePct: existing.uptimePct,
              createdAt: existing.createdAt,
              updatedAt: existing.updatedAt,
            }
          : null,
        ctx.auth.userId,
        input,
        now,
      );

      if (existing) {
        const [updated] = await ctx.db
          .update(networkProbes)
          .set({
            label: draft.label,
            facilityType: draft.facilityType,
            lng: draft.lng,
            lat: draft.lat,
            areaLabel: draft.areaLabel,
            updatedAt: draft.updatedAt,
          })
          .where(eq(networkProbes.id, existing.id))
          .returning();

        return toPublicProbe(updated);
      }

      const [created] = await ctx.db
        .insert(networkProbes)
        .values({
          id: draft.id,
          ownerUserId: draft.ownerUserId,
          label: draft.label,
          facilityType: draft.facilityType,
          lng: draft.lng,
          lat: draft.lat,
          areaLabel: draft.areaLabel,
          status: draft.status,
          lastSeenAt: draft.lastSeenAt,
          lastStatusChangeAt: draft.lastStatusChangeAt,
          uptimePct: draft.uptimePct,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
        })
        .returning();

      return toPublicProbe(created);
    }),

  realtimeConfig: authProcedure.query(async ({ ctx }) => {
    const probe = await getProbeByOwner(ctx.db, ctx.auth.userId);
    if (!probe) {
      return null;
    }

    if (!ctx.env.PARTYKIT_URL || !ctx.env.REALTIME_TOKEN_SECRET) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Realtime service is not configured",
      });
    }

    const token = await signRealtimeToken(
      {
        role: "reporter",
        room: NETWORK_ROOM_ID,
        exp: Date.now() + REALTIME_TOKEN_TTL_MS,
        probe: {
          id: probe.id,
          label: probe.label,
          facilityType: probe.facilityType as NetworkProbe["facilityType"],
          lngLat: [probe.lng, probe.lat],
          areaLabel: probe.areaLabel,
        },
      },
      ctx.env.REALTIME_TOKEN_SECRET,
    );

    return {
      host: normalizePartyKitHost(ctx.env.PARTYKIT_URL),
      room: NETWORK_ROOM_ID,
      probeId: probe.id,
      token,
      heartbeatIntervalMs: PROBE_HEARTBEAT_INTERVAL_MS,
    };
  }),

  ingestPresence: serviceProcedure
    .input(ingestPresenceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(networkProbes)
        .where(eq(networkProbes.id, input.probeId))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Probe registration not found",
        });
      }

      const now = new Date();
      const nextStatusChangeAt =
        existing.status === input.status
          ? existing.lastStatusChangeAt
          : now;

      const [updated] = await ctx.db
        .update(networkProbes)
        .set({
          status: input.status,
          lastSeenAt: input.lastSeen ? new Date(input.lastSeen) : null,
          uptimePct: input.uptimePct,
          lastStatusChangeAt: nextStatusChangeAt,
          updatedAt: now,
        })
        .where(eq(networkProbes.id, input.probeId))
        .returning();

      return {
        ok: true,
        probe: toPublicProbe(updated),
      };
    }),
});
