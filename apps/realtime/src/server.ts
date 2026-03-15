import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@workspace/api/router";
import {
  PARTYKIT_SERVICE_SECRET_HEADER,
  PROBE_HEARTBEAT_INTERVAL_MS,
  PROBE_OFFLINE_THRESHOLD_MS,
  PROBE_ONLINE_THRESHOLD_MS,
  PROBE_UPTIME_BUCKET_MS,
  classifyProbeStatus,
  computeRollingUptimePct,
  heartbeatMessageSchema,
  NETWORK_ROOM_ID,
  NETWORK_PARTY_NAME,
  NETWORK_PARTY_NAME as PARTY_NAME,
  NETWORK_ROOM_ID as ROOM_ID,
  probeUpdatedMessageSchema,
  registerHeartbeatBucket,
  type NetworkProbe,
  type NetworkProbeIdentity,
  verifyRealtimeToken,
} from "@workspace/api/network";
import type * as Party from "partykit/server";
import superjson from "superjson";

const STORAGE_KEY = "probe-state";
const PERSIST_INTERVAL_MS = 60_000;

interface ReporterConnectionState {
  role: "reporter";
  probe: NetworkProbeIdentity;
}

interface ObserverConnectionState {
  role: "observer";
}

type ConnectionState = ReporterConnectionState | ObserverConnectionState;

interface StoredProbeState extends NetworkProbe {
  heartbeatBuckets: number[];
  lastPersistedAt: number | null;
}

function roundUptime(value: number) {
  return Math.round(value * 1_000) / 1_000;
}

function getEnvValue(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

function getReporterParams(url: string) {
  const requestUrl = new URL(url);
  return {
    role: requestUrl.searchParams.get("role") ?? "observer",
    token: requestUrl.searchParams.get("token"),
  };
}

function toPublicProbe(state: StoredProbeState): NetworkProbe {
  return {
    id: state.id,
    label: state.label,
    facilityType: state.facilityType,
    lngLat: state.lngLat,
    areaLabel: state.areaLabel,
    status: state.status,
    lastSeen: state.lastSeen,
    uptimePct: state.uptimePct,
  };
}

export default class NetworkRoom implements Party.Server {
  private probes = new Map<string, StoredProbeState>();

  constructor(readonly room: Party.Room) {}

  private get apiClient() {
    const apiUrl = getEnvValue(this.room.env, "API_URL");
    const serviceSecret = getEnvValue(this.room.env, "PARTYKIT_SERVICE_SECRET");

    if (!apiUrl || !serviceSecret) {
      throw new Error("Missing API_URL or PARTYKIT_SERVICE_SECRET for realtime");
    }

    return createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${apiUrl}/api/trpc`,
          transformer: superjson,
          headers() {
            return {
              [PARTYKIT_SERVICE_SECRET_HEADER]: serviceSecret,
            };
          },
        }),
      ],
    });
  }

  async onStart() {
    const stored =
      (await this.room.storage.get<StoredProbeState[]>(STORAGE_KEY)) ?? [];

    this.probes = new Map(stored.map((probe) => [probe.id, probe]));
    await this.reconcileState(Date.now());
  }

  async onConnect(
    connection: Party.Connection<ConnectionState>,
    ctx: Party.ConnectionContext,
  ) {
    const { role, token } = getReporterParams(ctx.request.url);

    if (role === "reporter" && token) {
      const secret = getEnvValue(this.room.env, "REALTIME_TOKEN_SECRET");
      if (!secret) {
        connection.close(1011, "Realtime token secret is missing");
        return;
      }

      const payload = await verifyRealtimeToken(token, secret);
      if (!payload) {
        connection.close(4403, "Reporter token is invalid");
        return;
      }

      connection.setState({
        role: "reporter",
        probe: payload.probe,
      });
    } else {
      connection.setState({ role: "observer" });
    }

    for (const probe of this.probes.values()) {
      connection.send(
        JSON.stringify(
          probeUpdatedMessageSchema.parse({
            type: "probe.updated",
            probe: toPublicProbe(probe),
          }),
        ),
      );
    }
  }

  async onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Party.Connection<ConnectionState>,
  ) {
    if (typeof message !== "string") {
      return;
    }

    if (sender.state?.role !== "reporter") {
      return;
    }

    let parsedMessage: ReturnType<typeof heartbeatMessageSchema.safeParse>;
    try {
      parsedMessage = heartbeatMessageSchema.safeParse(JSON.parse(message));
    } catch {
      return;
    }

    if (!parsedMessage.success) {
      return;
    }

    if (parsedMessage.data.probeId !== sender.state.probe.id) {
      return;
    }

    const now = Date.now();
    const existing = this.probes.get(parsedMessage.data.probeId);
    const heartbeatBuckets = registerHeartbeatBucket(
      existing?.heartbeatBuckets ?? [],
      now,
    );
    const uptimePct = roundUptime(computeRollingUptimePct(heartbeatBuckets, now));
    const nextState: StoredProbeState = {
      id: sender.state.probe.id,
      label: sender.state.probe.label,
      facilityType: sender.state.probe.facilityType,
      lngLat: [sender.state.probe.lngLat[0], sender.state.probe.lngLat[1]],
      areaLabel: sender.state.probe.areaLabel,
      status: "online",
      lastSeen: new Date(now).toISOString(),
      uptimePct,
      heartbeatBuckets,
      lastPersistedAt: existing?.lastPersistedAt ?? null,
    };

    const shouldBroadcast =
      !existing ||
      existing.status !== nextState.status ||
      existing.lastSeen !== nextState.lastSeen ||
      existing.uptimePct !== nextState.uptimePct ||
      existing.label !== nextState.label ||
      existing.areaLabel !== nextState.areaLabel ||
      existing.lngLat[0] !== nextState.lngLat[0] ||
      existing.lngLat[1] !== nextState.lngLat[1];

    this.probes.set(nextState.id, nextState);

    if (shouldBroadcast) {
      this.broadcastProbeUpdate(nextState);
    }

    await this.persistIfNeeded(nextState, now, !existing);
    await this.flushState();
    this.scheduleNextAlarm(now);

    sender.send(
      JSON.stringify({
        type: "ack",
        probeId: nextState.id,
        receivedAt: nextState.lastSeen,
        status: nextState.status,
      }),
    );
  }

  async onAlarm() {
    await this.reconcileState(Date.now());
  }

  async onRequest(_req: Party.Request) {
    return Response.json({
      ok: true,
      room: this.room.id,
      party: this.room.name,
      expectedRoom: ROOM_ID,
      expectedParty: PARTY_NAME,
      probeCount: this.probes.size,
    });
  }

  private broadcastProbeUpdate(probe: StoredProbeState) {
    this.room.broadcast(
      JSON.stringify({
        type: "probe.updated",
        probe: toPublicProbe(probe),
      }),
    );
  }

  private async persistIfNeeded(
    probe: StoredProbeState,
    now: number,
    force = false,
  ) {
    const shouldPersist =
      force ||
      probe.lastPersistedAt === null ||
      now - probe.lastPersistedAt >= PERSIST_INTERVAL_MS;

    if (!shouldPersist) {
      return;
    }

    await this.apiClient.network.ingestPresence.mutate({
      probeId: probe.id,
      status: probe.status,
      lastSeen: probe.lastSeen,
      uptimePct: probe.uptimePct,
    });

    probe.lastPersistedAt = now;
  }

  private async reconcileState(now: number) {
    let stateChanged = false;

    for (const probe of this.probes.values()) {
      const nextHeartbeatBuckets = probe.heartbeatBuckets.filter(
        (bucket) =>
          bucket >= Math.floor((now - 15 * 60 * 1_000) / PROBE_UPTIME_BUCKET_MS),
      );
      const nextStatus = classifyProbeStatus(probe.lastSeen, now);
      const nextUptime = roundUptime(
        computeRollingUptimePct(nextHeartbeatBuckets, now),
      );
      const didChange =
        probe.status !== nextStatus ||
        probe.uptimePct !== nextUptime ||
        nextHeartbeatBuckets.length !== probe.heartbeatBuckets.length;

      probe.status = nextStatus;
      probe.uptimePct = nextUptime;
      probe.heartbeatBuckets = nextHeartbeatBuckets;

      if (didChange) {
        stateChanged = true;
        this.broadcastProbeUpdate(probe);
      }

      const shouldForcePersist =
        didChange &&
        (nextStatus === "degraded" || nextStatus === "offline");

      await this.persistIfNeeded(probe, now, shouldForcePersist);
    }

    if (stateChanged) {
      await this.flushState();
    }

    this.scheduleNextAlarm(now);
  }

  private scheduleNextAlarm(now: number) {
    if (this.probes.size === 0) {
      void this.room.storage.deleteAlarm();
      return;
    }

    const nextBucketBoundary =
      (Math.floor(now / PROBE_UPTIME_BUCKET_MS) + 1) * PROBE_UPTIME_BUCKET_MS;
    const deadlines = [nextBucketBoundary];

    for (const probe of this.probes.values()) {
      if (!probe.lastSeen) {
        continue;
      }

      const lastSeenMs = new Date(probe.lastSeen).getTime();
      if (probe.status === "online") {
        deadlines.push(lastSeenMs + PROBE_ONLINE_THRESHOLD_MS);
      } else if (probe.status === "degraded") {
        deadlines.push(lastSeenMs + PROBE_OFFLINE_THRESHOLD_MS);
      }
    }

    const nextAlarmAt = Math.min(
      ...deadlines.filter((value) => Number.isFinite(value) && value > now),
    );

    if (Number.isFinite(nextAlarmAt)) {
      void this.room.storage.setAlarm(nextAlarmAt);
    }
  }

  private async flushState() {
    await this.room.storage.put(STORAGE_KEY, [...this.probes.values()]);
  }

  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
  ): Promise<Party.Request | Response> {
    const url = new URL(req.url);
    const role = url.searchParams.get("role") ?? "observer";

    if (lobby.id !== NETWORK_ROOM_ID) {
      return new Response("Unknown realtime room", { status: 404 });
    }

    if (role !== "reporter") {
      return req;
    }

    const token = url.searchParams.get("token");
    const secret = getEnvValue(lobby.env, "REALTIME_TOKEN_SECRET");

    if (!token || !secret) {
      return new Response("Missing realtime reporter token", { status: 403 });
    }

    const payload = await verifyRealtimeToken(token, secret);
    if (!payload || payload.room !== lobby.id) {
      return new Response("Invalid realtime reporter token", { status: 403 });
    }

    return req;
  }

  static onFetch(req: Party.Request) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        room: NETWORK_ROOM_ID,
        party: NETWORK_PARTY_NAME,
        heartbeatIntervalMs: PROBE_HEARTBEAT_INTERVAL_MS,
      });
    }

    return undefined;
  }
}

NetworkRoom satisfies Party.Worker;
