import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapSidebar } from "../components/map-sidebar";

import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

import { TrpcDemoPanel } from "@/components/trpc/trpc-demo-panel";
import { env } from "@/lib/env";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

const KINGSTON_CENTER: [number, number] = [-76.7936, 18.0179];
const MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";
const MAP_DEBUG_PREFIX = "[YardWatchMap]";

const INCIDENT_MARKERS: Array<{
  id: string;
  label: string;
  lngLat: [number, number];
  color: string;
}> = [
  {
    id: "INC-1043",
    label: "Road Washout",
    lngLat: [-76.8732, 17.9505],
    color: "#f87171",
  },
  {
    id: "INC-1042",
    label: "Bridge Damage",
    lngLat: [-76.7682, 18.0364],
    color: "#fb923c",
  },
  {
    id: "INC-1044",
    label: "Roof Collapse",
    lngLat: [-76.9576, 17.9956],
    color: "#facc15",
  },
];

function maskToken(token: string) {
  if (!token) {
    return "missing";
  }

  if (token.length <= 12) {
    return `${token.slice(0, 4)}...`;
  }

  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

function logMapSurface(map: MapboxMap, phase: string) {
  const container = map.getContainer();
  const canvas = map.getCanvas();

  console.info(MAP_DEBUG_PREFIX, `${phase} surface`, {
    container: {
      clientWidth: container.clientWidth,
      clientHeight: container.clientHeight,
    },
    canvas: {
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
    },
  });
}

function DashboardPage() {
  return (
    <div className="relative h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <MapCanvas />
      </div>

      {/* Left sidebar overlay */}
      <MapSidebar />

      {/* Stats bar — top-right overlay */}
      <div className="absolute right-4 top-4 z-10">
        <StatsBar />
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <TrpcDemoPanel />
      </div>
    </div>
  );
}

function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadTimeoutId: number | undefined;
    let resizeTimeoutId: number | undefined;
    let resizeObserver: ResizeObserver | undefined;

    async function initializeMap() {
      if (!mapContainerRef.current || mapRef.current) {
        console.info(MAP_DEBUG_PREFIX, "Skipping init", {
          hasContainer: Boolean(mapContainerRef.current),
          hasExistingMap: Boolean(mapRef.current),
        });
        return;
      }

      try {
        console.info(MAP_DEBUG_PREFIX, "Starting map initialization", {
          center: KINGSTON_CENTER,
          style: MAP_STYLE,
          token: maskToken(env.VITE_MAP_BOX_API_KEY),
        });

        const { default: mapboxgl } = await import("mapbox-gl");

        if (cancelled || !mapContainerRef.current) {
          console.warn(
            MAP_DEBUG_PREFIX,
            "Initialization aborted before map creation",
            {
              cancelled,
              hasContainer: Boolean(mapContainerRef.current),
            },
          );
          return;
        }

        mapboxgl.accessToken = env.VITE_MAP_BOX_API_KEY;
        console.info(MAP_DEBUG_PREFIX, "Mapbox module loaded");

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: KINGSTON_CENTER,
          zoom: 10.8,
          bearing: 0,
          pitch: 0,
          attributionControl: false,
        });

        mapRef.current = map;
        console.info(MAP_DEBUG_PREFIX, "Map instance created", {
          zoom: map.getZoom(),
          center: map.getCenter().toArray(),
        });
        logMapSurface(map, "Initial");

        map.addControl(
          new mapboxgl.NavigationControl({ visualizePitch: true }),
          "top-right",
        );
        map.addControl(
          new mapboxgl.ScaleControl({ unit: "metric" }),
          "bottom-right",
        );

        resizeObserver = new ResizeObserver(() => {
          if (cancelled) {
            return;
          }

          map.resize();
          logMapSurface(map, "ResizeObserver");
        });
        resizeObserver.observe(mapContainerRef.current);

        requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          map.resize();
          logMapSurface(map, "Animation frame resize");
        });

        resizeTimeoutId = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          map.resize();
          logMapSurface(map, "Delayed resize");
        }, 250);

        loadTimeoutId = window.setTimeout(() => {
          console.warn(MAP_DEBUG_PREFIX, "Map still waiting for load event", {
            isStyleLoaded: map.isStyleLoaded(),
            center: map.getCenter().toArray(),
            zoom: map.getZoom(),
          });
        }, 8000);

        map.on("styledata", () => {
          console.info(MAP_DEBUG_PREFIX, "styledata event received", {
            isStyleLoaded: map.isStyleLoaded(),
          });
        });

        map.once("load", () => {
          if (cancelled) {
            return;
          }

          if (loadTimeoutId) {
            window.clearTimeout(loadTimeoutId);
            loadTimeoutId = undefined;
          }

          console.info(MAP_DEBUG_PREFIX, "load event received");
          logMapSurface(map, "Load");

          markersRef.current = INCIDENT_MARKERS.map((incident) =>
            new mapboxgl.Marker({ color: incident.color })
              .setLngLat(incident.lngLat)
              .setPopup(
                new mapboxgl.Popup({ offset: 18 }).setHTML(
                  `<strong>${incident.id}</strong><br />${incident.label}`,
                ),
              )
              .addTo(map),
          );

          setStatus("ready");
          setErrorMessage(null);
        });

        map.once("idle", () => {
          console.info(MAP_DEBUG_PREFIX, "idle event received", {
            isStyleLoaded: map.isStyleLoaded(),
            markers: INCIDENT_MARKERS.length,
          });
          logMapSurface(map, "Idle");
        });

        map.on("error", (event) => {
          if (cancelled) {
            return;
          }

          if (loadTimeoutId) {
            window.clearTimeout(loadTimeoutId);
            loadTimeoutId = undefined;
          }

          console.error(MAP_DEBUG_PREFIX, "Mapbox emitted an error", {
            message:
              event.error?.message ??
              "Mapbox could not load the requested style.",
            error: event.error,
          });

          setStatus("error");
          setErrorMessage(
            event.error?.message ??
              "Mapbox could not load the requested style.",
          );
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (loadTimeoutId) {
          window.clearTimeout(loadTimeoutId);
          loadTimeoutId = undefined;
        }

        console.error(MAP_DEBUG_PREFIX, "Map initialization failed", {
          error,
        });

        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Mapbox failed to initialize.",
        );
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      if (loadTimeoutId) {
        window.clearTimeout(loadTimeoutId);
      }
      if (resizeTimeoutId) {
        window.clearTimeout(resizeTimeoutId);
      }
      resizeObserver?.disconnect();
      console.info(MAP_DEBUG_PREFIX, "Cleaning up map instance");
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full"
        style={{ width: "100%", height: "100%" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 45% 55%, oklch(0.17 0.035 220 / 0.52) 0%, transparent 68%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />

      {status !== "ready" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-sm rounded-2xl border border-border bg-card/85 px-4 py-3 backdrop-blur-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {status === "loading" ? "Loading Mapbox" : "Mapbox Error"}
            </p>
            <p className="mt-2 text-sm text-foreground">
              {status === "loading"
                ? "Initializing the live map canvas for YardWatch."
                : (errorMessage ??
                  "Check VITE_MAP_BOX_API_KEY and confirm it is a valid public Mapbox token.")}
            </p>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-8 right-8 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/75">
          Mapbox live view
        </p>
      </div>
    </div>
  );
}

function StatsBar() {
  const stats: Array<{ label: string; value: string; critical?: boolean }> = [
    { label: "detections", value: "126" },
    { label: "critical", value: "19", critical: true },
    { label: "areas", value: "8" },
  ];

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-xl">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center">
          {i > 0 && <div className="h-8 w-px bg-border" />}
          <div className="flex items-center gap-1.5 px-4 py-2">
            <span
              className={[
                "text-[13px] font-semibold tabular-nums",
                stat.critical ? "text-red-400" : "text-foreground",
              ].join(" ")}
            >
              {stat.value}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {stat.label}
            </span>
          </div>
        </div>
      ))}
      <div className="h-8 w-px bg-border" />
      <div className="flex items-center gap-2 px-4 py-2">
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 6px oklch(0.74 0.2 150 / 0.8)" }}
        />
        <span className="text-[11px] font-medium text-emerald-400">Active</span>
      </div>
    </div>
  );
}
