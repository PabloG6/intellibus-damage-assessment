import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PartySocket from "partysocket";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { NETWORK_PARTY_NAME } from "@workspace/api/network";
import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/")({
  component: ReporterConsolePage,
});

const DEFAULT_FORM = {
  label: "Melissa Health Centre",
  facilityType: "hospital",
  areaLabel: "Melissa corridor",
  lng: "-78.1313",
  lat: "18.3072",
} as const;

const FACILITY_TYPES = [
  { value: "hospital", label: "Hospital" },
  { value: "school", label: "School" },
  { value: "police", label: "Police Station" },
  { value: "fire_station", label: "Fire Station" },
  { value: "utility", label: "Utility Sub-station" },
] as const;

type FormState = {
  label: string;
  facilityType: (typeof FACILITY_TYPES)[number]["value"];
  areaLabel: string;
  lng: string;
  lat: string;
};

type SocketState = "idle" | "connecting" | "connected" | "stopped" | "error";

function formatSocketState(state: SocketState) {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

function formatLastAck(value: string | null) {
  if (!value) {
    return "No heartbeat acknowledged yet";
  }

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ReporterConsolePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const probeQueryKey = trpc.network.mine.queryOptions().queryKey;
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM);
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(true);
  const [socketState, setSocketState] = useState<SocketState>("idle");
  const [lastAckAt, setLastAckAt] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  const sessionQuery = useQuery({
    ...trpc.session.me.queryOptions(),
    retry: false,
  });
  const mineQuery = useQuery({
    ...trpc.network.mine.queryOptions(),
    enabled: !!sessionQuery.data,
    retry: false,
  });
  const realtimeConfigQuery = useQuery({
    ...trpc.network.realtimeConfig.queryOptions(),
    enabled: !!sessionQuery.data && !!mineQuery.data,
    retry: false,
  });
  const upsertMutation = useMutation(trpc.network.upsertMine.mutationOptions());

  useEffect(() => {
    if (!mineQuery.data) {
      return;
    }

    setFormState({
      label: mineQuery.data.label,
      facilityType: mineQuery.data.facilityType,
      areaLabel: mineQuery.data.areaLabel,
      lng: String(mineQuery.data.lngLat[0]),
      lat: String(mineQuery.data.lngLat[1]),
    });
  }, [mineQuery.data]);

  useEffect(() => {
    const realtimeConfig = realtimeConfigQuery.data;

    if (!mineQuery.data || !realtimeConfig || !heartbeatEnabled) {
      socketRef.current?.close();
      socketRef.current = null;
      setSocketState(mineQuery.data ? "stopped" : "idle");
      return;
    }

    const socket = new PartySocket({
      host: realtimeConfig.host || env.VITE_PARTYKIT_HOST,
      party: NETWORK_PARTY_NAME,
      room: realtimeConfig.room,
      query: {
        role: "reporter",
        token: realtimeConfig.token,
      },
    });
    let intervalId: number | null = null;

    socketRef.current = socket;
    setSocketState("connecting");
    setSocketError(null);

    const sendHeartbeat = () => {
      socket.send(
        JSON.stringify({
          type: "heartbeat",
          probeId: realtimeConfig.probeId,
          sentAt: new Date().toISOString(),
        }),
      );
    };

    socket.addEventListener("open", () => {
      setSocketState("connected");
      sendHeartbeat();
      intervalId = window.setInterval(
        sendHeartbeat,
        realtimeConfig.heartbeatIntervalMs,
      );
    });

    socket.addEventListener("close", () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }

      setSocketState(heartbeatEnabled ? "connecting" : "stopped");
    });

    socket.addEventListener("error", () => {
      setSocketState("error");
      setSocketError("The realtime websocket could not reach the PartyKit room.");
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(String(event.data));
        if (payload.type === "ack") {
          setLastAckAt(payload.receivedAt ?? null);
        }

        if (
          payload.type === "probe.updated" &&
          payload.probe?.id === realtimeConfig.probeId
        ) {
          queryClient.setQueryData(probeQueryKey, payload.probe);
        }
      } catch {
        // Ignore malformed socket payloads in the reporter surface.
      }
    });

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    env.VITE_PARTYKIT_HOST,
    heartbeatEnabled,
    mineQuery.data,
    probeQueryKey,
    queryClient,
    realtimeConfigQuery.data,
  ]);

  const isAuthenticated = Boolean(sessionQuery.data);
  const isSessionLoading = sessionQuery.isPending;

  const currentProbe = mineQuery.data;
  const connectionBadgeClass = useMemo(() => {
    if (socketState === "connected") {
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
    }

    if (socketState === "error") {
      return "border-red-500/25 bg-red-500/10 text-red-300";
    }

    if (socketState === "connecting") {
      return "border-amber-500/25 bg-amber-500/10 text-amber-300";
    }

    return "border-border bg-muted text-muted-foreground";
  }, [socketState]);

  async function handleSignOut() {
    await authClient.signOut();
    queryClient.clear();
    window.location.assign("/login");
  }

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lng = Number(formState.lng);
    const lat = Number(formState.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return;
    }

    upsertMutation.mutate(
      {
        label: formState.label.trim(),
        facilityType: formState.facilityType,
        areaLabel: formState.areaLabel.trim(),
        lngLat: [lng, lat],
      },
      {
        onSuccess(probe) {
          queryClient.setQueryData(probeQueryKey, probe);
          void mineQuery.refetch();
          void realtimeConfigQuery.refetch();
        },
      },
    );
  }

  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <Card className="w-full max-w-md border-white/10 bg-card/90">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Checking reporter session...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 82% 54% at 18% 8%, oklch(0.20 0.04 220 / 0.38), transparent)",
            "radial-gradient(ellipse 40% 34% at 86% 85%, oklch(0.26 0.06 180 / 0.16), transparent)",
          ].join(", "),
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
              YardWatch Reporter
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Facility liveliness console
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Register this site once, then keep the page open on the facility
              device so the websocket heartbeat keeps reporting network liveliness
              into the YardWatch dashboard.
            </p>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span
                className={[
                  "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                  connectionBadgeClass,
                ].join(" ")}
              >
                {formatSocketState(socketState)}
              </span>
              <Button variant="outline" onClick={() => void handleSignOut()}>
                Sign out
              </Button>
            </div>
          ) : null}
        </header>

        {!isAuthenticated ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <Card className="border-white/10 bg-card/90">
              <CardHeader>
                <CardTitle>Authenticate this facility</CardTitle>
                <CardDescription>
                  The reporter app reuses the existing YardWatch auth worker. After
                  sign-in, this account can register exactly one reporting site in v1.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link to="/login">
                  <Button>Sign in</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline">Create account</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/90">
              <CardHeader>
                <CardTitle>What this app does</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  One account maps to one reporting facility. The page stores no
                  backend secrets locally and uses short-lived realtime tokens from
                  the API.
                </p>
                <p>
                  When the browser tab stays online, YardWatch marks the site as
                  reachable. If the device or upstream power fails, the dashboard
                  status decays automatically from online to degraded to offline.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-white/10 bg-card/90">
              <CardHeader>
                <CardTitle>Register this facility</CardTitle>
                <CardDescription>
                  Update the site details here. V1 is single-site, so saving again
                  edits the existing probe instead of creating a second one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Facility name
                      </span>
                      <Input
                        value={formState.label}
                        onChange={(event) => updateField("label", event.target.value)}
                        placeholder="Melissa Health Centre"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Facility type
                      </span>
                      <select
                        value={formState.facilityType}
                        onChange={(event) =>
                          updateField(
                            "facilityType",
                            event.target.value as FormState["facilityType"],
                          )
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
                      >
                        {FACILITY_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Area label
                    </span>
                    <Input
                      value={formState.areaLabel}
                      onChange={(event) =>
                        updateField("areaLabel", event.target.value)
                      }
                      placeholder="Melissa corridor"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Longitude
                      </span>
                      <Input
                        value={formState.lng}
                        onChange={(event) => updateField("lng", event.target.value)}
                        placeholder="-78.1313"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Latitude
                      </span>
                      <Input
                        value={formState.lat}
                        onChange={(event) => updateField("lat", event.target.value)}
                        placeholder="18.3072"
                      />
                    </label>
                  </div>

                  {upsertMutation.isError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {upsertMutation.error.message}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={upsertMutation.isPending}>
                      {upsertMutation.isPending ? "Saving..." : "Save facility"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Probe owner: {sessionQuery.data?.userId}
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-white/10 bg-card/90">
                <CardHeader>
                  <CardTitle>Heartbeat status</CardTitle>
                  <CardDescription>
                    Heartbeats fire every 8 seconds. Keep the page open on the
                    facility device during the demo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricTile label="Socket" value={formatSocketState(socketState)} />
                    <MetricTile label="Last ack" value={formatLastAck(lastAckAt)} />
                  </div>

                  {socketError ? (
                    <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {socketError}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => setHeartbeatEnabled((value) => !value)}
                      variant={heartbeatEnabled ? "destructive" : "default"}
                      disabled={!currentProbe || realtimeConfigQuery.isPending}
                    >
                      {heartbeatEnabled ? "Stop heartbeat" : "Start heartbeat"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Reporter room: {realtimeConfigQuery.data?.room ?? "not ready"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm leading-6 text-amber-200">
                    Demo behavior: if this tab closes or connectivity drops, YardWatch
                    will move the facility from online to degraded after about 16
                    seconds, then to offline after about 40 seconds.
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-card/90">
                <CardHeader>
                  <CardTitle>Current registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {currentProbe ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Facility</span>
                        <span className="font-medium text-foreground">
                          {currentProbe.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Area</span>
                        <span className="font-medium text-foreground">
                          {currentProbe.areaLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize text-foreground">
                          {currentProbe.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">15m uptime</span>
                        <span className="font-medium text-foreground">
                          {(currentProbe.uptimePct * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Coordinates</span>
                        <span className="font-mono text-foreground">
                          {currentProbe.lngLat[1].toFixed(4)},{" "}
                          {currentProbe.lngLat[0].toFixed(4)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Save the facility form once to create this reporter probe.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/60 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/65">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
