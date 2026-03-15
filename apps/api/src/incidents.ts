import type { Feature, FeatureCollection, MultiPolygon } from "geojson";

export const INCIDENT_DATASET_NAME = "melissa_sample_001_building_damage";
export const INCIDENT_SOURCE_FILE = "melissa-damage.geojson";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "damaged" | "undamaged";
export type IncidentBounds = [number, number, number, number];
export type IncidentCentroid = [number, number];
export type IncidentAddressResolution =
  | "street_address"
  | "route"
  | "locality"
  | "missing";

export interface IncidentAddress {
  formatted: string | null;
  placeId: string | null;
  resolution: IncidentAddressResolution;
}

export interface MelissaDamageProperties {
  id: string;
  damage_pct_0m: number;
  damage_pct_10m: number;
  damage_pct_20m: number;
  built_pct_0m: number;
  damaged: number;
  unknown_pct: number;
}

export interface MelissaDamageCollection
  extends FeatureCollection<MultiPolygon, MelissaDamageProperties> {
  name?: string;
}

export type MelissaDamageFeature = Feature<MultiPolygon, MelissaDamageProperties>;

export interface IncidentSummary {
  id: string;
  label: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  damagePct0m: number;
  damagePct10m: number;
  damagePct20m: number;
  builtPct0m: number;
  unknownPct: number;
  centroid: IncidentCentroid;
  bbox: IncidentBounds;
  address: IncidentAddress;
}

export interface IncidentFeatureProperties extends IncidentSummary {
  datasetName: string;
}

export interface IncidentsOverview {
  dataset: {
    name: string;
    sourceFile: string;
    featureCount: number;
    bounds: IncidentBounds | null;
  };
  stats: {
    total: number;
    damaged: number;
    undamaged: number;
    priority: number;
    bySeverity: Record<IncidentSeverity, number>;
    avgDamagePct0m: number;
  };
  incidents: IncidentSummary[];
  featureCollection: FeatureCollection<MultiPolygon, IncidentFeatureProperties>;
}

export interface IncidentRecord {
  id: string;
  datasetName: string;
  geometry: MultiPolygon;
  centroidLng: number;
  centroidLat: number;
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  damagePct0m: number;
  damagePct10m: number;
  damagePct20m: number;
  builtPct0m: number;
  unknownPct: number;
  damaged: boolean;
  severity: IncidentSeverity | string;
  formattedAddress: string | null;
  placeId: string | null;
  addressResolution: IncidentAddressResolution | string | null;
}

export function classifySeverity(damagePct0m: number): IncidentSeverity {
  if (damagePct0m >= 0.7) {
    return "critical";
  }

  if (damagePct0m >= 0.55) {
    return "high";
  }

  if (damagePct0m >= 0.4) {
    return "medium";
  }

  return "low";
}

export function severityRank(severity: IncidentSeverity) {
  switch (severity) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
  }
}

export function toIncidentStatus(damaged: boolean | number): IncidentStatus {
  return Number(damaged) === 1 ? "damaged" : "undamaged";
}

export function toIncidentLabel(status: IncidentStatus) {
  return status === "damaged" ? "Damaged building" : "Undamaged building";
}

export function normalizeAddressResolution(
  value: string | null | undefined,
): IncidentAddressResolution {
  switch (value) {
    case "street_address":
    case "route":
    case "locality":
      return value;
    default:
      return "missing";
  }
}

export function toIncidentAddress(row: Pick<IncidentRecord, "formattedAddress" | "placeId" | "addressResolution">): IncidentAddress {
  return {
    formatted: row.formattedAddress,
    placeId: row.placeId,
    resolution: normalizeAddressResolution(row.addressResolution),
  };
}

export function getPriorityCount(bySeverity: Record<IncidentSeverity, number>) {
  return bySeverity.critical + bySeverity.high;
}

export function buildIncidentsOverview(
  rows: IncidentRecord[],
  fallbackDatasetName = "Melissa damage detections",
): IncidentsOverview {
  const stats: IncidentsOverview["stats"] = {
    total: rows.length,
    damaged: 0,
    undamaged: 0,
    priority: 0,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    avgDamagePct0m: 0,
  };

  let datasetName = fallbackDatasetName;
  let datasetBounds: IncidentBounds | null = null;
  let damagePct0mTotal = 0;

  const incidents: IncidentSummary[] = [];
  const features: FeatureCollection<MultiPolygon, IncidentFeatureProperties>["features"] = [];

  for (const row of rows) {
    const status = toIncidentStatus(row.damaged);
    const label = toIncidentLabel(status);
    const severity = row.severity as IncidentSeverity;
    const bbox: IncidentBounds = [row.minLng, row.minLat, row.maxLng, row.maxLat];
    const address = toIncidentAddress(row);

    stats.bySeverity[severity] += 1;
    stats[status] += 1;
    damagePct0mTotal += row.damagePct0m;
    datasetName = row.datasetName;

    if (!datasetBounds) {
      datasetBounds = [...bbox];
    } else {
      datasetBounds = [
        Math.min(datasetBounds[0], bbox[0]),
        Math.min(datasetBounds[1], bbox[1]),
        Math.max(datasetBounds[2], bbox[2]),
        Math.max(datasetBounds[3], bbox[3]),
      ];
    }

    const incident: IncidentSummary = {
      id: row.id,
      label,
      status,
      severity,
      damagePct0m: row.damagePct0m,
      damagePct10m: row.damagePct10m,
      damagePct20m: row.damagePct20m,
      builtPct0m: row.builtPct0m,
      unknownPct: row.unknownPct,
      centroid: [row.centroidLng, row.centroidLat],
      bbox,
      address,
    };

    incidents.push(incident);
    features.push({
      type: "Feature",
      id: incident.id,
      properties: {
        ...incident,
        datasetName,
      },
      geometry: row.geometry,
    });
  }

  stats.priority = getPriorityCount(stats.bySeverity);
  stats.avgDamagePct0m = rows.length === 0 ? 0 : damagePct0mTotal / rows.length;

  return {
    dataset: {
      name: datasetName,
      sourceFile: INCIDENT_SOURCE_FILE,
      featureCount: rows.length,
      bounds: datasetBounds,
    },
    stats,
    incidents: incidents.sort(
      (left, right) =>
        severityRank(left.severity) - severityRank(right.severity) ||
        right.damagePct0m - left.damagePct0m,
    ),
    featureCollection: {
      type: "FeatureCollection",
      features,
    },
  };
}

export function calculateGeometryMetrics(geometry: MultiPolygon): {
  centroid: IncidentCentroid;
  bounds: IncidentBounds;
} {
  const outerRingPoints = geometry.coordinates.flatMap((polygon) => polygon[0] ?? []);

  if (!outerRingPoints.length) {
    return {
      centroid: [0, 0],
      bounds: [0, 0, 0, 0],
    };
  }

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let lngSum = 0;
  let latSum = 0;

  for (const [lng, lat] of outerRingPoints) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
    lngSum += lng;
    latSum += lat;
  }

  return {
    centroid: [lngSum / outerRingPoints.length, latSum / outerRingPoints.length],
    bounds: [minLng, minLat, maxLng, maxLat],
  };
}
