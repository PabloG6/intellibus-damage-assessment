import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { GeoJSONSource, LngLatBoundsLike, Map as MapboxMap } from "mapbox-gl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { MapSidebar } from "../components/map-sidebar";

import "mapbox-gl/dist/mapbox-gl.css";

import type { DashboardIncident, DashboardOverview } from "@/lib/incidents";
import {
  estimateIncidentDamage,
  formatUsd,
  SEVERITY_FILL,
  formatAddressResolution,
  formatPercent,
  formatSeverity,
  getFeatureGeometry,
  getBriefingQueue,
  getDisplayAddress,
  getRecommendedAction,
} from "@/lib/incidents";
import { env } from "@/lib/env";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

const MELISSA_CENTER: [number, number] = [-78.1313, 18.3072];
const MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";
const MAP_DEBUG_PREFIX = "[YardWatchMap]";
const INCIDENTS_SOURCE_ID = "incidents";
const INCIDENTS_FILL_LAYER_ID = "incidents-fill";
const INCIDENTS_OUTLINE_LAYER_ID = "incidents-outline";
const INCIDENTS_SELECTED_LAYER_ID = "incidents-selected";
const DATASET_PADDING = { top: 48, right: 48, bottom: 48, left: 336 };
const INCIDENT_PADDING = { top: 72, right: 72, bottom: 72, left: 336 };
const CARD_MARGIN = 24;
const SIDEBAR_CLEARANCE = 324;

function maskToken(token: string) {
  if (!token) {
    return "missing";
  }

  if (token.length <= 12) {
    return `${token.slice(0, 4)}...`;
  }

  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

function toMapboxBounds(bounds: [number, number, number, number]): LngLatBoundsLike {
  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ];
}

function positionIncidentCard(
  map: MapboxMap,
  container: HTMLDivElement,
  card: HTMLDivElement,
  incident: DashboardIncident,
) {
  const projected = map.project(incident.centroid);
  const cardWidth = card.offsetWidth;
  const cardHeight = card.offsetHeight;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const minLeft = Math.min(
    containerWidth - cardWidth / 2 - CARD_MARGIN,
    SIDEBAR_CLEARANCE + cardWidth / 2,
  );
  const clampedLeft = Math.min(
    Math.max(projected.x, minLeft),
    containerWidth - cardWidth / 2 - CARD_MARGIN,
  );
  const clampedTop = Math.min(
    Math.max(projected.y, cardHeight + CARD_MARGIN),
    containerHeight - CARD_MARGIN,
  );

  card.style.left = `${clampedLeft}px`;
  card.style.top = `${clampedTop}px`;
}

function DashboardPage() {
  const trpc = useTRPC();
  const overviewQuery = useQuery(trpc.incidents.overview.queryOptions());
  const overview = overviewQuery.data;
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectionSerial, setSelectionSerial] = useState(0);
  const [fitExtentSerial, setFitExtentSerial] = useState(0);
  const [isBriefingActive, setIsBriefingActive] = useState(false);
  const [briefingIndex, setBriefingIndex] = useState(0);

  const briefingQueue = overview ? getBriefingQueue(overview.incidents) : [];

  useEffect(() => {
    if (!selectedIncidentId && overview?.incidents[0]) {
      setSelectedIncidentId(overview.incidents[0].id);
    }
  }, [overview, selectedIncidentId]);

  useEffect(() => {
    if (!isBriefingActive || briefingQueue.length === 0) return;

    const activeIncident = briefingQueue[briefingIndex];
    if (activeIncident && activeIncident.id !== selectedIncidentId) {
      setSelectedIncidentId(activeIncident.id);
      setSelectionSerial((value) => value + 1);
    }
  }, [briefingIndex, briefingQueue, isBriefingActive, selectedIncidentId]);

  const selectedIncident =
    overview?.incidents.find((incident) => incident.id === selectedIncidentId) ??
    overview?.incidents[0] ??
    null;

  function handleSelectIncident(incidentId: string) {
    setIsBriefingActive(false);
    setSelectedIncidentId(incidentId);
    setSelectionSerial((current) => current + 1);
  }

  function handleFitDataset() {
    setFitExtentSerial((current) => current + 1);
  }

  function handleStartBriefing() {
    if (briefingQueue.length === 0) return;
    setBriefingIndex(0);
    setIsBriefingActive(true);
    setSelectedIncidentId(briefingQueue[0].id);
    setSelectionSerial((current) => current + 1);
  }

  function handleStopBriefing() {
    setIsBriefingActive(false);
  }

  function handleBriefingPrev() {
    if (!isBriefingActive || briefingIndex <= 0) return;
    setBriefingIndex((i) => i - 1);
  }

  function handleBriefingNext() {
    if (!isBriefingActive || briefingIndex >= briefingQueue.length - 1) return;
    setBriefingIndex((i) => i + 1);
  }

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <MapCanvas
          overview={overview}
          selectedIncident={selectedIncident}
          selectedIncidentId={selectedIncidentId}
          selectionSerial={selectionSerial}
          fitExtentSerial={fitExtentSerial}
          onSelectIncident={handleSelectIncident}
          isQueryPending={overviewQuery.isPending}
          queryErrorMessage={overviewQuery.error?.message}
          isBriefingActive={isBriefingActive}
          briefingQueue={briefingQueue}
          briefingIndex={briefingIndex}
          onBriefingPrev={handleBriefingPrev}
          onBriefingNext={handleBriefingNext}
        />
      </div>

      <MapSidebar
        overview={overview}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={handleSelectIncident}
        onFitDataset={handleFitDataset}
        onStartBriefing={handleStartBriefing}
        onStopBriefing={handleStopBriefing}
        isBriefingActive={isBriefingActive}
        briefingIndex={briefingIndex}
        briefingTotal={briefingQueue.length}
        isLoading={overviewQuery.isPending}
        isError={overviewQuery.isError}
        errorMessage={overviewQuery.error?.message}
      />

      <div className="absolute right-4 top-4 z-10">
        <StatsBar overview={overview} isLoading={overviewQuery.isPending} />
      </div>
    </div>
  );
}

interface MapCanvasProps {
  overview?: DashboardOverview;
  selectedIncident: DashboardIncident | null;
  selectedIncidentId: string | null;
  selectionSerial: number;
  fitExtentSerial: number;
  onSelectIncident: (incidentId: string) => void;
  isQueryPending: boolean;
  queryErrorMessage?: string;
  isBriefingActive: boolean;
  briefingQueue: DashboardIncident[];
  briefingIndex: number;
  onBriefingPrev: () => void;
  onBriefingNext: () => void;
}

function MapCanvas({
  overview,
  selectedIncident,
  selectedIncidentId,
  selectionSerial,
  fitExtentSerial,
  onSelectIncident,
  isQueryPending,
  queryErrorMessage,
  isBriefingActive,
  briefingQueue,
  briefingIndex,
  onBriefingPrev,
  onBriefingNext,
}: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const popupCardRef = useRef<HTMLDivElement | null>(null);
  const hasLayerHandlersRef = useRef(false);
  const hasFittedDatasetRef = useRef(false);
  const onSelectIncidentRef = useRef(onSelectIncident);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedGeometry = getFeatureGeometry(overview, selectedIncident?.id ?? null);
  const damageEstimate = selectedIncident
    ? estimateIncidentDamage(selectedIncident, selectedGeometry)
    : null;

  onSelectIncidentRef.current = onSelectIncident;

  useEffect(() => {
    let cancelled = false;
    let loadTimeoutId: number | undefined;
    let resizeTimeoutId: number | undefined;
    let resizeObserver: ResizeObserver | undefined;

    async function initializeMap() {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      try {
        console.info(MAP_DEBUG_PREFIX, "Starting map initialization", {
          center: MELISSA_CENTER,
          style: MAP_STYLE,
          token: maskToken(env.VITE_MAP_BOX_API_KEY),
        });

        const { default: mapboxgl } = await import("mapbox-gl");

        if (cancelled || !mapContainerRef.current) {
          return;
        }

        mapboxgl.accessToken = env.VITE_MAP_BOX_API_KEY;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: MELISSA_CENTER,
          zoom: 15,
          bearing: 0,
          pitch: 0,
          attributionControl: false,
        });

        mapRef.current = map;
        map.addControl(
          new mapboxgl.NavigationControl({ visualizePitch: true }),
          "top-right",
        );
        map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-right");

        resizeObserver = new ResizeObserver(() => {
          if (!cancelled) {
            map.resize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);

        requestAnimationFrame(() => {
          if (!cancelled) {
            map.resize();
          }
        });

        resizeTimeoutId = window.setTimeout(() => {
          if (!cancelled) {
            map.resize();
          }
        }, 250);

        loadTimeoutId = window.setTimeout(() => {
          console.warn(MAP_DEBUG_PREFIX, "Map still waiting for load event", {
            isStyleLoaded: map.isStyleLoaded(),
            center: map.getCenter().toArray(),
            zoom: map.getZoom(),
          });
        }, 8000);

        map.once("load", () => {
          if (cancelled) {
            return;
          }

          if (loadTimeoutId) {
            window.clearTimeout(loadTimeoutId);
          }

          setStatus("ready");
          setErrorMessage(null);
        });

        map.on("error", (event) => {
          if (cancelled) {
            return;
          }

          if (loadTimeoutId) {
            window.clearTimeout(loadTimeoutId);
          }

          setStatus("error");
          setErrorMessage(
            event.error?.message ?? "Mapbox could not load the requested style.",
          );
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Mapbox failed to initialize.",
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
      mapRef.current?.remove();
      mapRef.current = null;
      hasLayerHandlersRef.current = false;
      hasFittedDatasetRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready" || !overview) {
      return;
    }

    const source = map.getSource(INCIDENTS_SOURCE_ID) as GeoJSONSource | undefined;

    if (!source) {
      map.addSource(INCIDENTS_SOURCE_ID, {
        type: "geojson",
        data: overview.featureCollection,
        promoteId: "id",
      });

      map.addLayer({
        id: INCIDENTS_FILL_LAYER_ID,
        type: "fill",
        source: INCIDENTS_SOURCE_ID,
        paint: {
          "fill-color": [
            "match",
            ["get", "severity"],
            "critical",
            SEVERITY_FILL.critical,
            "high",
            SEVERITY_FILL.high,
            "medium",
            SEVERITY_FILL.medium,
            SEVERITY_FILL.low,
          ],
          "fill-opacity": 0.45,
        },
      });

      map.addLayer({
        id: INCIDENTS_OUTLINE_LAYER_ID,
        type: "line",
        source: INCIDENTS_SOURCE_ID,
        paint: {
          "line-color": "#0f172a",
          "line-width": 1.25,
          "line-opacity": 0.95,
        },
      });

      map.addLayer({
        id: INCIDENTS_SELECTED_LAYER_ID,
        type: "line",
        source: INCIDENTS_SOURCE_ID,
        filter: ["==", ["get", "id"], ""],
        paint: {
          "line-color": "#ffffff",
          "line-width": 3,
          "line-opacity": 1,
        },
      });
    } else {
      source.setData(overview.featureCollection);
    }

    if (!hasLayerHandlersRef.current) {
      map.on("click", INCIDENTS_FILL_LAYER_ID, (event) => {
        const clickedId = event.features?.[0]?.properties?.id;
        if (typeof clickedId === "string") {
          onSelectIncidentRef.current(clickedId);
        }
      });

      map.on("mouseenter", INCIDENTS_FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", INCIDENTS_FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      hasLayerHandlersRef.current = true;
    }

    if (!hasFittedDatasetRef.current && overview.dataset.bounds) {
      map.fitBounds(toMapboxBounds(overview.dataset.bounds), {
        padding: DATASET_PADDING,
        duration: 0,
      });
      hasFittedDatasetRef.current = true;
    }
  }, [overview, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(INCIDENTS_SELECTED_LAYER_ID)) {
      return;
    }

    map.setFilter(INCIDENTS_SELECTED_LAYER_ID, [
      "==",
      ["get", "id"],
      selectedIncidentId ?? "",
    ]);
  }, [selectedIncidentId, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !overview?.dataset.bounds || fitExtentSerial === 0) {
      return;
    }

    map.fitBounds(toMapboxBounds(overview.dataset.bounds), {
      padding: DATASET_PADDING,
      duration: 900,
    });
  }, [fitExtentSerial, overview]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIncident || selectionSerial === 0) {
      return;
    }

    map.fitBounds(toMapboxBounds(selectedIncident.bbox), {
      padding: INCIDENT_PADDING,
      duration: 900,
      maxZoom: 18,
    });
  }, [selectedIncident, selectionSerial]);

  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    const card = popupCardRef.current;
    if (!map || !container || !card || status !== "ready" || !selectedIncident) {
      return;
    }
    const activeMap = map;

    function syncCardPosition() {
      if (!popupCardRef.current || !mapContainerRef.current || !selectedIncident) {
        return;
      }

      positionIncidentCard(
        activeMap,
        mapContainerRef.current,
        popupCardRef.current,
        selectedIncident,
      );
    }

    syncCardPosition();

    activeMap.on("move", syncCardPosition);
    activeMap.on("resize", syncCardPosition);

    return () => {
      activeMap.off("move", syncCardPosition);
      activeMap.off("resize", syncCardPosition);
    };
  }, [selectedIncident, status]);

  const overlayMessage =
    status === "error"
      ? errorMessage
      : queryErrorMessage
        ? "The incidents API returned an error."
        : status === "loading"
          ? "Initializing the Mapbox canvas."
          : isQueryPending
            ? "Loading Melissa detections and polygon overlays."
            : !overview?.incidents.length
              ? "No incidents available yet. Seed the Melissa dataset to draw polygons."
              : null;

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

      {overlayMessage ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-sm rounded-2xl border border-border bg-card/85 px-4 py-3 backdrop-blur-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {status === "error" || queryErrorMessage ? "Map Error" : "Mapbox"}
            </p>
            <p className="mt-2 text-sm text-foreground">
              {overlayMessage}
            </p>
          </div>
        </div>
      ) : null}

      {status === "ready" && !overlayMessage && selectedIncident ? (
        <div
          ref={popupCardRef}
          className="absolute z-20 w-80 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-[calc(100%+1rem)]"
        >
          <Card className="border-white/10 bg-background/92 shadow-[0_20px_70px_-35px_rgba(8,15,32,0.95)]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/65">
                    {isBriefingActive ? "Claim Triage Tour" : "Focused Detection"}
                  </p>
                  <CardTitle className="mt-2 truncate text-base">
                    {getDisplayAddress(selectedIncident.address)}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedIncident.id}
                  </CardDescription>
                </div>
                <span
                  className="inline-flex rounded-full border border-border/70 bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground"
                  style={{ color: SEVERITY_FILL[selectedIncident.severity] }}
                >
                  {formatSeverity(selectedIncident.severity)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <MetricTile
                  label="Damage"
                  value={formatPercent(selectedIncident.damagePct0m)}
                />
                <MetricTile
                  label="10m Context"
                  value={formatPercent(selectedIncident.damagePct10m)}
                />
                <MetricTile
                  label="Built"
                  value={formatPercent(selectedIncident.builtPct0m)}
                />
              </div>

              {damageEstimate ? (
                <div className="rounded-2xl border border-border/70 bg-muted/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/65">
                        Estimated Loss
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatUsd(damageEstimate.estimatedLossUsd)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/65">
                        Loss Ratio
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatPercent(damageEstimate.lossRatio)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                    Jamaica-normalized demo estimate based on roughly{" "}
                    {Math.round(damageEstimate.footprintSqFt).toLocaleString("en-US")} sq ft of
                    footprint area.
                  </p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-border/70 bg-muted/60 p-3 space-y-2">
                {(() => {
                  const queueIndex = briefingQueue.findIndex((i) => i.id === selectedIncident.id);
                  return queueIndex >= 0 ? (
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-muted-foreground">Queue Rank</span>
                      <span className="font-medium text-foreground">
                        {queueIndex + 1} of {briefingQueue.length}
                      </span>
                    </div>
                  ) : null;
                })()}
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-muted-foreground">Recommended Action</span>
                  <span className="font-medium text-foreground">
                    {getRecommendedAction(selectedIncident.severity)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-muted-foreground">Address Confidence</span>
                  <span className="font-medium text-foreground">
                    {formatAddressResolution(selectedIncident.address)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize text-foreground">
                    {selectedIncident.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-muted-foreground">Centroid</span>
                  <span className="font-mono text-foreground">
                    {selectedIncident.centroid[1].toFixed(4)}, {selectedIncident.centroid[0].toFixed(4)}
                  </span>
                </div>
              </div>

              {isBriefingActive ? (
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/60 px-1.5 py-1">
                  <button
                    onClick={onBriefingPrev}
                    disabled={briefingIndex <= 0}
                    className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Previous detection"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M8.5 3L4.5 7L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {briefingIndex + 1} / {briefingQueue.length}
                  </span>
                  <button
                    onClick={onBriefingNext}
                    disabled={briefingIndex >= briefingQueue.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Next detection"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M5.5 3L9.5 7L5.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="absolute bottom-8 right-8 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/75">
          Melissa polygon overlay
        </p>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/60 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/65">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function StatsBar({
  overview,
  isLoading,
}: {
  overview?: DashboardOverview;
  isLoading: boolean;
}) {
  const stats = overview
    ? [
        { label: "detections", value: overview.stats.total.toString() },
        {
          label: "priority",
          value: (
            overview.stats.priority ??
            overview.stats.bySeverity.critical + overview.stats.bySeverity.high
          ).toString(),
        },
        {
          label: "critical",
          value: overview.stats.bySeverity.critical.toString(),
          critical: true,
        },
      ]
    : [
        { label: "detections", value: "--" },
        { label: "priority", value: "--" },
        { label: "critical", value: "--", critical: true },
      ];

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-xl">
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center">
          {index > 0 ? <div className="h-8 w-px bg-border" /> : null}
          <div className="flex items-center gap-1.5 px-4 py-2">
            <span
              className={[
                "text-[13px] font-semibold tabular-nums",
                stat.critical ? "text-red-400" : "text-foreground",
              ].join(" ")}
            >
              {stat.value}
            </span>
            <span className="text-[11px] text-muted-foreground">{stat.label}</span>
          </div>
        </div>
      ))}
      <div className="h-8 w-px bg-border" />
      <div className="flex items-center gap-2 px-4 py-2">
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            isLoading ? "bg-yellow-400" : "bg-emerald-400",
          ].join(" ")}
        />
        <span
          className={[
            "text-[11px] font-medium",
            isLoading ? "text-yellow-400" : "text-emerald-400",
          ].join(" ")}
        >
          {isLoading ? "Loading" : "Active"}
        </span>
      </div>
    </div>
  );
}
