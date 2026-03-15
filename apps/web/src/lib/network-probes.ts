import type {
  FacilityType,
  NetworkProbe,
  ProbeStatus,
} from "@workspace/api/network";

export type { FacilityType, NetworkProbe, ProbeStatus } from "@workspace/api/network";

export type SidebarMode = "housing" | "network";

export interface ProbeSummary {
  online: number;
  degraded: number;
  offline: number;
  total: number;
  outageAssessment: string;
}

export const PROBE_STATUS_DOT: Record<ProbeStatus, string> = {
  online: "bg-emerald-400",
  degraded: "bg-amber-400",
  offline: "bg-red-400",
};

export const PROBE_STATUS_BADGE: Record<ProbeStatus, string> = {
  online: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  degraded: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  offline: "border-red-500/25 bg-red-500/10 text-red-400",
};

export const PROBE_STATUS_FILL: Record<ProbeStatus, string> = {
  online: "#34d399",
  degraded: "#fbbf24",
  offline: "#f87171",
};

const FACILITY_LABEL: Record<FacilityType, string> = {
  hospital: "Hospital",
  school: "School",
  police: "Police Station",
  fire_station: "Fire Station",
  utility: "Utility Sub-station",
};

export const INITIAL_PROBES: NetworkProbe[] = [
  {
    id: "probe-melissa-health",
    label: "Melissa Health Centre",
    facilityType: "hospital",
    lngLat: [-78.1313, 18.3072],
    areaLabel: "Melissa corridor",
    status: "online",
    lastSeen: new Date().toISOString(),
    uptimePct: 0.967,
  },
  {
    id: "probe-frome-police",
    label: "Frome Police Station",
    facilityType: "police",
    lngLat: [-78.1374, 18.3046],
    areaLabel: "Frome junction",
    status: "online",
    lastSeen: new Date().toISOString(),
    uptimePct: 0.953,
  },
  {
    id: "probe-russel-primary",
    label: "Russel Primary School",
    facilityType: "school",
    lngLat: [-78.1258, 18.3114],
    areaLabel: "Russel district",
    status: "online",
    lastSeen: new Date().toISOString(),
    uptimePct: 0.944,
  },
  {
    id: "probe-darliston-fire",
    label: "Darliston Fire Outpost",
    facilityType: "fire_station",
    lngLat: [-78.1422, 18.3127],
    areaLabel: "Darliston ridge",
    status: "online",
    lastSeen: new Date().toISOString(),
    uptimePct: 0.981,
  },
  {
    id: "probe-jps-melissa",
    label: "JPS Melissa Sub-station",
    facilityType: "utility",
    lngLat: [-78.1234, 18.3009],
    areaLabel: "Manning corridor",
    status: "online",
    lastSeen: new Date().toISOString(),
    uptimePct: 0.972,
  },
  {
    id: "probe-little-london",
    label: "Little London High Annex",
    facilityType: "school",
    lngLat: [-78.1188, 18.3153],
    areaLabel: "Little London approach",
    status: "online",
    lastSeen: new Date().toISOString(),
    uptimePct: 0.936,
  },
  {
    id: "probe-bethel-police",
    label: "Bethel Town Police Post",
    facilityType: "police",
    lngLat: [-78.1465, 18.3065],
    areaLabel: "Bethel Town span",
    status: "degraded",
    lastSeen: new Date(Date.now() - 25_000).toISOString(),
    uptimePct: 0.712,
  },
  {
    id: "probe-seaford-clinic",
    label: "Seaford Clinic Relay",
    facilityType: "hospital",
    lngLat: [-78.1149, 18.2974],
    areaLabel: "Seaford edge",
    status: "offline",
    lastSeen: new Date(Date.now() - 8 * 60_000).toISOString(),
    uptimePct: 0.312,
  },
];

function formatAreaList(areas: string[]) {
  if (areas.length <= 2) {
    return areas.join(", ");
  }

  return `${areas.slice(0, 2).join(", ")} +${areas.length - 2} more`;
}

export function formatFacilityType(type: FacilityType): string {
  return FACILITY_LABEL[type];
}

export function buildProbeGeoJSON(
  probes: NetworkProbe[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: probes.map((probe) => ({
      type: "Feature",
      id: probe.id,
      properties: {
        id: probe.id,
        label: probe.label,
        status: probe.status,
        facilityType: probe.facilityType,
        areaLabel: probe.areaLabel,
        fillColor: PROBE_STATUS_FILL[probe.status],
      },
      geometry: {
        type: "Point",
        coordinates: probe.lngLat,
      },
    })),
  };
}

export function formatProbeStatus(status: ProbeStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatLastSeen(iso: string | null): string {
  if (!iso) {
    return "Never";
  }

  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1_000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

export function formatUptimePct(pct: number): string {
  return `${(pct * 100).toFixed(1)}%`;
}

export function getOutageAssessment(probes: NetworkProbe[]): string {
  const offlineAreas = [...new Set(
    probes.filter((probe) => probe.status === "offline").map((probe) => probe.areaLabel),
  )];
  const degradedAreas = [...new Set(
    probes.filter((probe) => probe.status === "degraded").map((probe) => probe.areaLabel),
  )];

  if (offlineAreas.length === 0 && degradedAreas.length === 0) {
    return "All reporting facilities are reachable.";
  }

  if (offlineAreas.length > 0 && degradedAreas.length > 0) {
    return `${offlineAreas.length} areas likely without power near ${formatAreaList(
      offlineAreas,
    )}; ${degradedAreas.length} areas show intermittent connectivity near ${formatAreaList(
      degradedAreas,
    )}.`;
  }

  if (offlineAreas.length > 0) {
    return `${offlineAreas.length} ${
      offlineAreas.length === 1 ? "area is" : "areas are"
    } likely without power near ${formatAreaList(offlineAreas)}.`;
  }

  return `${degradedAreas.length} ${
    degradedAreas.length === 1 ? "area is" : "areas are"
  } showing intermittent connectivity near ${formatAreaList(degradedAreas)}.`;
}

export function computeProbeSummary(probes: NetworkProbe[]): ProbeSummary {
  let online = 0;
  let degraded = 0;
  let offline = 0;

  for (const probe of probes) {
    if (probe.status === "online") {
      online += 1;
    } else if (probe.status === "degraded") {
      degraded += 1;
    } else {
      offline += 1;
    }
  }

  return {
    online,
    degraded,
    offline,
    total: probes.length,
    outageAssessment: getOutageAssessment(probes),
  };
}
