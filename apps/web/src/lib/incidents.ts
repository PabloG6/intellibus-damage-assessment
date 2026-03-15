import type {
  IncidentAddress,
  IncidentAddressResolution,
  IncidentBounds,
  IncidentFeatureProperties,
  IncidentSeverity,
  IncidentSummary,
  IncidentsOverview,
} from "@workspace/api/router";
import type { MultiPolygon } from "geojson";

export type DashboardIncident = IncidentSummary;
export type DashboardOverview = IncidentsOverview;

export const BRIEFING_LIMIT = 10;
export const BRIEFING_INTERVAL_MS = 4500;

const SQFT_PER_SQM = 10.7639;
const JAM_REBUILD_USD_PER_SQFT = 185;
const JAM_REBUILD_SURGE_FACTOR = 1.08;
const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export interface DamageEstimate {
  estimatedLossUsd: number;
  replacementValueUsd: number;
  footprintSqFt: number;
  lossRatio: number;
}

export function getDisplayAddress(address: IncidentAddress | undefined): string {
  return address?.formatted ?? "No Information found";
}

const ADDRESS_RESOLUTION_LABELS: Record<IncidentAddressResolution, string> = {
  street_address: "Street-level",
  route: "Road-level",
  locality: "Locality",
  missing: "No Information found",
};

export function formatAddressResolution(address: IncidentAddress | undefined): string {
  return ADDRESS_RESOLUTION_LABELS[address?.resolution ?? "missing"];
}

export function getRecommendedAction(severity: IncidentSeverity): string {
  switch (severity) {
    case "critical":
      return "Immediate inspection";
    case "high":
      return "Priority inspection";
    case "medium":
    case "low":
      return "Monitor";
  }
}

export function getBriefingQueue(
  incidents: IncidentSummary[],
  limit = BRIEFING_LIMIT,
): IncidentSummary[] {
  return incidents.slice(0, limit);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getMetersPerLngDegree(lat: number) {
  return 111_320 * Math.cos((lat * Math.PI) / 180);
}

function getMetersPerLatDegree() {
  return 110_574;
}

function getRingAreaSqMeters(ring: number[][]) {
  if (ring.length < 3) {
    return 0;
  }

  const averageLat =
    ring.reduce((total, [, lat]) => total + lat, 0) / ring.length;
  const metersPerLng = getMetersPerLngDegree(averageLat);
  const metersPerLat = getMetersPerLatDegree();
  let area = 0;

  for (let index = 0; index < ring.length; index += 1) {
    const [x1Lng, y1Lat] = ring[index]!;
    const [x2Lng, y2Lat] = ring[(index + 1) % ring.length]!;
    const x1 = x1Lng * metersPerLng;
    const y1 = y1Lat * metersPerLat;
    const x2 = x2Lng * metersPerLng;
    const y2 = y2Lat * metersPerLat;

    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}

function getMultiPolygonAreaSqMeters(geometry: MultiPolygon) {
  return geometry.coordinates.reduce((multiPolygonArea, polygon) => {
    if (!polygon.length) {
      return multiPolygonArea;
    }

    const [outerRing, ...holes] = polygon;
    const outerArea = getRingAreaSqMeters(outerRing);
    const holesArea = holes.reduce(
      (total, ring) => total + getRingAreaSqMeters(ring),
      0,
    );

    return multiPolygonArea + Math.max(outerArea - holesArea, 0);
  }, 0);
}

function getBoundsAreaSqFeet(bounds: IncidentBounds) {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const averageLat = (minLat + maxLat) / 2;
  const widthMeters = Math.abs(maxLng - minLng) * getMetersPerLngDegree(averageLat);
  const heightMeters = Math.abs(maxLat - minLat) * getMetersPerLatDegree();

  return widthMeters * heightMeters * SQFT_PER_SQM;
}

function getApproximateFootprintSqFt(
  incident: IncidentSummary,
  geometry?: MultiPolygon | null,
) {
  const rawFootprintSqFt = geometry
    ? getMultiPolygonAreaSqMeters(geometry) * SQFT_PER_SQM
    : getBoundsAreaSqFeet(incident.bbox) * 0.72;

  return clamp(rawFootprintSqFt, 350, 5_000);
}

export function estimateIncidentDamage(
  incident: IncidentSummary,
  geometry?: MultiPolygon | null,
): DamageEstimate {
  const footprintSqFt = getApproximateFootprintSqFt(incident, geometry);
  const buildQualityFactor = clamp(0.94 + incident.builtPct0m * 2.2, 0.92, 1.14);
  const replacementValueUsd =
    footprintSqFt * JAM_REBUILD_USD_PER_SQFT * buildQualityFactor * JAM_REBUILD_SURGE_FACTOR;
  const weightedDamageSignal =
    incident.damagePct0m * 0.72 +
    incident.damagePct10m * 0.18 +
    incident.damagePct20m * 0.1;
  const severityFloor: Record<IncidentSeverity, number> = {
    critical: 0.55,
    high: 0.35,
    medium: 0.18,
    low: 0.08,
  };
  const minimumLossRatio = incident.status === "damaged" ? severityFloor[incident.severity] : 0.03;
  const lossRatio = clamp(
    Math.max(weightedDamageSignal, minimumLossRatio) * (1 - incident.unknownPct * 0.12),
    minimumLossRatio,
    0.9,
  );

  return {
    footprintSqFt,
    replacementValueUsd,
    lossRatio,
    estimatedLossUsd: replacementValueUsd * lossRatio,
  };
}

export function formatUsd(value: number) {
  return USD_FORMATTER.format(value);
}

export function getFeatureGeometry(
  overview: DashboardOverview | undefined,
  incidentId: string | null,
) {
  if (!overview || !incidentId) {
    return null;
  }

  const feature = overview.featureCollection.features.find((candidate) => {
    if (typeof candidate.id === "string") {
      return candidate.id === incidentId;
    }

    return (candidate.properties as IncidentFeatureProperties | undefined)?.id === incidentId;
  });

  return feature?.geometry ?? null;
}

export const SEVERITY_DOT: Record<IncidentSeverity, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-emerald-400",
};

export const SEVERITY_BADGE: Record<IncidentSeverity, string> = {
  critical: "border-red-500/20 bg-red-500/10 text-red-400",
  high: "border-orange-400/20 bg-orange-400/10 text-orange-400",
  medium: "border-yellow-400/20 bg-yellow-400/10 text-yellow-400",
  low: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
};

export const SEVERITY_FILL: Record<IncidentSeverity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#facc15",
  low: "#22c55e",
};

export function formatSeverity(severity: IncidentSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatCoordinate(value: number, positiveLabel: string, negativeLabel: string) {
  const direction = value >= 0 ? positiveLabel : negativeLabel;
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

export function formatLngLat([lng, lat]: [number, number]) {
  return `${formatCoordinate(lat, "N", "S")} · ${formatCoordinate(lng, "E", "W")}`;
}

export function formatBounds(bounds: IncidentBounds) {
  return `${formatCoordinate(bounds[1], "N", "S")} to ${formatCoordinate(
    bounds[3],
    "N",
    "S",
  )} · ${formatCoordinate(bounds[0], "E", "W")} to ${formatCoordinate(
    bounds[2],
    "E",
    "W",
  )}`;
}
