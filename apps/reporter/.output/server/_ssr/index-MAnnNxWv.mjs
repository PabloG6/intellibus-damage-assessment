import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { P as PartySocket } from "../_libs/partysocket.mjs";
import { C as Card, d as CardContent, B as Button, a as CardHeader, b as CardTitle, c as CardDescription, I as Input, e as authClient } from "./auth-client-aUuAFd71.mjs";
import { u as useTRPC, e as env } from "./router-DSLSBzp1.mjs";
import { _ as _enum, o as object, n as number, s as string, t as tuple, l as literal } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/better-auth.mjs";
import "../_libs/better-auth__core.mjs";
import "../_libs/nanostores.mjs";
import "../_libs/defu.mjs";
import "../_libs/better-fetch__fetch.mjs";
import "../_libs/base-ui__react.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/base-ui__utils.mjs";
import "../_libs/trpc__client.mjs";
import "../_libs/trpc__server.mjs";
import "../_libs/superjson.mjs";
import "../_libs/copy-anything.mjs";
import "../_libs/is-what.mjs";
import "../_libs/trpc__tanstack-react-query.mjs";
const NETWORK_PARTY_NAME = "network";
const probeStatusSchema = _enum(["online", "degraded", "offline"]);
const facilityTypeSchema = _enum([
  "hospital",
  "school",
  "police",
  "fire_station",
  "utility"
]);
const networkProbeSchema = object({
  id: string(),
  label: string(),
  facilityType: facilityTypeSchema,
  lngLat: tuple([number(), number()]),
  areaLabel: string(),
  status: probeStatusSchema,
  lastSeen: string().nullable(),
  uptimePct: number().min(0).max(1)
});
const networkProbeIdentitySchema = networkProbeSchema.pick({
  id: true,
  label: true,
  facilityType: true,
  lngLat: true,
  areaLabel: true
});
object({
  label: string().trim().min(2).max(120),
  facilityType: facilityTypeSchema,
  lngLat: tuple([number().min(-180).max(180), number().min(-90).max(90)]),
  areaLabel: string().trim().min(2).max(120)
});
object({
  type: literal("heartbeat"),
  probeId: string(),
  sentAt: string().datetime().optional()
});
object({
  type: literal("probe.updated"),
  probe: networkProbeSchema
});
object({
  type: literal("ack"),
  probeId: string(),
  receivedAt: string(),
  status: probeStatusSchema
});
object({
  role: literal("reporter"),
  room: string(),
  exp: number().int().positive(),
  probe: networkProbeIdentitySchema
});
object({
  probeId: string(),
  status: probeStatusSchema,
  lastSeen: string().datetime().nullable(),
  uptimePct: number().min(0).max(1)
});
new TextEncoder();
const DEFAULT_FORM = {
  label: "Melissa Health Centre",
  facilityType: "hospital",
  areaLabel: "Melissa corridor",
  lng: "-78.1313",
  lat: "18.3072"
};
const FACILITY_TYPES = [{
  value: "hospital",
  label: "Hospital"
}, {
  value: "school",
  label: "School"
}, {
  value: "police",
  label: "Police Station"
}, {
  value: "fire_station",
  label: "Fire Station"
}, {
  value: "utility",
  label: "Utility Sub-station"
}];
function formatSocketState(state) {
  return state.charAt(0).toUpperCase() + state.slice(1);
}
function formatLastAck(value) {
  if (!value) {
    return "No heartbeat acknowledged yet";
  }
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
}
function ReporterConsolePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const probeQueryKey = trpc.network.mine.queryOptions().queryKey;
  const [formState, setFormState] = reactExports.useState(DEFAULT_FORM);
  const [heartbeatEnabled, setHeartbeatEnabled] = reactExports.useState(true);
  const [socketState, setSocketState] = reactExports.useState("idle");
  const [lastAckAt, setLastAckAt] = reactExports.useState(null);
  const [socketError, setSocketError] = reactExports.useState(null);
  const socketRef = reactExports.useRef(null);
  const sessionQuery = useQuery({
    ...trpc.session.me.queryOptions(),
    retry: false
  });
  const mineQuery = useQuery({
    ...trpc.network.mine.queryOptions(),
    enabled: !!sessionQuery.data,
    retry: false
  });
  const realtimeConfigQuery = useQuery({
    ...trpc.network.realtimeConfig.queryOptions(),
    enabled: !!sessionQuery.data && !!mineQuery.data,
    retry: false
  });
  const upsertMutation = useMutation(trpc.network.upsertMine.mutationOptions());
  reactExports.useEffect(() => {
    if (!mineQuery.data) {
      return;
    }
    setFormState({
      label: mineQuery.data.label,
      facilityType: mineQuery.data.facilityType,
      areaLabel: mineQuery.data.areaLabel,
      lng: String(mineQuery.data.lngLat[0]),
      lat: String(mineQuery.data.lngLat[1])
    });
  }, [mineQuery.data]);
  reactExports.useEffect(() => {
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
        token: realtimeConfig.token
      }
    });
    let intervalId = null;
    socketRef.current = socket;
    setSocketState("connecting");
    setSocketError(null);
    const sendHeartbeat = () => {
      socket.send(JSON.stringify({
        type: "heartbeat",
        probeId: realtimeConfig.probeId,
        sentAt: (/* @__PURE__ */ new Date()).toISOString()
      }));
    };
    socket.addEventListener("open", () => {
      setSocketState("connected");
      sendHeartbeat();
      intervalId = window.setInterval(sendHeartbeat, realtimeConfig.heartbeatIntervalMs);
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
        if (payload.type === "probe.updated" && payload.probe?.id === realtimeConfig.probeId) {
          queryClient.setQueryData(probeQueryKey, payload.probe);
        }
      } catch {
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
  }, [env.VITE_PARTYKIT_HOST, heartbeatEnabled, mineQuery.data, probeQueryKey, queryClient, realtimeConfigQuery.data]);
  const isAuthenticated = Boolean(sessionQuery.data);
  const isSessionLoading = sessionQuery.isPending;
  const currentProbe = mineQuery.data;
  const connectionBadgeClass = reactExports.useMemo(() => {
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
  function updateField(key, value) {
    setFormState((current) => ({
      ...current,
      [key]: value
    }));
  }
  async function handleSubmit(event) {
    event.preventDefault();
    const lng = Number(formState.lng);
    const lat = Number(formState.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return;
    }
    upsertMutation.mutate({
      label: formState.label.trim(),
      facilityType: formState.facilityType,
      areaLabel: formState.areaLabel.trim(),
      lngLat: [lng, lat]
    }, {
      onSuccess(probe) {
        queryClient.setQueryData(probeQueryKey, probe);
        void mineQuery.refetch();
        void realtimeConfigQuery.refetch();
      }
    });
  }
  if (isSessionLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-6 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "w-full max-w-md border-white/10 bg-card/90", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-8 text-center text-sm text-muted-foreground", children: "Checking reporter session..." }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-h-screen overflow-hidden bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0", style: {
      background: ["radial-gradient(ellipse 82% 54% at 18% 8%, oklch(0.20 0.04 220 / 0.38), transparent)", "radial-gradient(ellipse 40% 34% at 86% 85%, oklch(0.26 0.06 180 / 0.16), transparent)"].join(", ")
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70", children: "YardWatch Reporter" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-2 text-3xl font-semibold tracking-tight", children: "Facility liveliness console" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-muted-foreground", children: "Register this site once, then keep the page open on the facility device so the websocket heartbeat keeps reporting network liveliness into the YardWatch dashboard." })
        ] }),
        isAuthenticated ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: ["inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", connectionBadgeClass].join(" "), children: formatSocketState(socketState) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => void handleSignOut(), children: "Sign out" })
        ] }) : null
      ] }),
      !isAuthenticated ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-white/10 bg-card/90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Authenticate this facility" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "The reporter app reuses the existing YardWatch auth worker. After sign-in, this account can register exactly one reporting site in v1." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: "Sign in" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", children: "Create account" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-white/10 bg-card/90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "What this app does" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 text-sm leading-6 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "One account maps to one reporting facility. The page stores no backend secrets locally and uses short-lived realtime tokens from the API." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "When the browser tab stays online, YardWatch marks the site as reachable. If the device or upstream power fails, the dashboard status decays automatically from online to degraded to offline." })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-white/10 bg-card/90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Register this facility" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Update the site details here. V1 is single-site, so saving again edits the existing probe instead of creating a second one." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "space-y-4", onSubmit: handleSubmit, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Facility name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formState.label, onChange: (event) => updateField("label", event.target.value), placeholder: "Melissa Health Centre" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Facility type" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: formState.facilityType, onChange: (event) => updateField("facilityType", event.target.value), className: "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40", children: FACILITY_TYPES.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Area label" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formState.areaLabel, onChange: (event) => updateField("areaLabel", event.target.value), placeholder: "Melissa corridor" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Longitude" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formState.lng, onChange: (event) => updateField("lng", event.target.value), placeholder: "-78.1313" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Latitude" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formState.lat, onChange: (event) => updateField("lat", event.target.value), placeholder: "18.3072" })
              ] })
            ] }),
            upsertMutation.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive", children: upsertMutation.error.message }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: upsertMutation.isPending, children: upsertMutation.isPending ? "Saving..." : "Save facility" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "Probe owner: ",
                sessionQuery.data?.userId
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-white/10 bg-card/90", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Heartbeat status" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Heartbeats fire every 8 seconds. Keep the page open on the facility device during the demo." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MetricTile, { label: "Socket", value: formatSocketState(socketState) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(MetricTile, { label: "Last ack", value: formatLastAck(lastAckAt) })
              ] }),
              socketError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300", children: socketError }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setHeartbeatEnabled((value) => !value), variant: heartbeatEnabled ? "destructive" : "default", disabled: !currentProbe || realtimeConfigQuery.isPending, children: heartbeatEnabled ? "Stop heartbeat" : "Start heartbeat" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  "Reporter room: ",
                  realtimeConfigQuery.data?.room ?? "not ready"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm leading-6 text-amber-200", children: "Demo behavior: if this tab closes or connectivity drops, YardWatch will move the facility from online to degraded after about 16 seconds, then to offline after about 40 seconds." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-white/10 bg-card/90", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Current registration" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3 text-sm", children: currentProbe ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Facility" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: currentProbe.label })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Area" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: currentProbe.areaLabel })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Status" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium capitalize text-foreground", children: currentProbe.status })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "15m uptime" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-foreground", children: [
                  (currentProbe.uptimePct * 100).toFixed(1),
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Coordinates" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-foreground", children: [
                  currentProbe.lngLat[1].toFixed(4),
                  ",",
                  " ",
                  currentProbe.lngLat[0].toFixed(4)
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Save the facility form once to create this reporter probe." }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function MetricTile({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/70 bg-muted/60 px-3 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground/65", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-medium text-foreground", children: value })
  ] });
}
export {
  ReporterConsolePage as component
};
