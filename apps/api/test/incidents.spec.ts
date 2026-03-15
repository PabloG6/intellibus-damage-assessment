import { describe, expect, it } from "vitest";
import {
  buildIncidentsOverview,
  calculateGeometryMetrics,
  classifySeverity,
  getPriorityCount,
  toIncidentLabel,
  toIncidentStatus,
} from "../src/incidents";

describe("incident helpers", () => {
  it("classifies severity using the configured thresholds", () => {
    expect(classifySeverity(0.72)).toBe("critical");
    expect(classifySeverity(0.56)).toBe("high");
    expect(classifySeverity(0.41)).toBe("medium");
    expect(classifySeverity(0.39)).toBe("low");
  });

  it("derives status and label from the source damaged flag", () => {
    expect(toIncidentStatus(1)).toBe("damaged");
    expect(toIncidentStatus(0)).toBe("undamaged");
    expect(toIncidentLabel("damaged")).toBe("Damaged building");
    expect(toIncidentLabel("undamaged")).toBe("Undamaged building");
  });

  it("calculates bounds and centroid for multipolygon geometry", () => {
    const metrics = calculateGeometryMetrics({
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [-78.136179, 18.3115463],
            [-78.1360655, 18.3116109],
            [-78.1361549, 18.3117541],
            [-78.1362684, 18.3116895],
            [-78.136179, 18.3115463],
          ],
        ],
      ],
    });

    expect(metrics.bounds).toEqual([
      -78.1362684,
      18.3115463,
      -78.1360655,
      18.3117541,
    ]);
    expect(metrics.centroid[0]).toBeCloseTo(-78.13616936, 8);
    expect(metrics.centroid[1]).toBeCloseTo(18.31162942, 8);
  });

  it("builds overview stats and address objects for enriched incidents", () => {
    const result = buildIncidentsOverview([
      {
        id: "inc-1",
        datasetName: "Melissa damage detections",
        geometry: {
          type: "MultiPolygon",
          coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]],
        },
        centroidLng: -78.13,
        centroidLat: 18.31,
        minLng: -78.14,
        minLat: 18.3,
        maxLng: -78.12,
        maxLat: 18.32,
        damagePct0m: 0.72,
        damagePct10m: 0.55,
        damagePct20m: 0.5,
        builtPct0m: 0.04,
        unknownPct: 0,
        damaged: true,
        severity: "critical",
        formattedAddress: "1 Main Street, Westmoreland",
        placeId: "place-1",
        addressResolution: "street_address",
      },
      {
        id: "inc-2",
        datasetName: "Melissa damage detections",
        geometry: {
          type: "MultiPolygon",
          coordinates: [[[[2, 2], [3, 2], [3, 3], [2, 2]]]],
        },
        centroidLng: -78.11,
        centroidLat: 18.29,
        minLng: -78.12,
        minLat: 18.28,
        maxLng: -78.1,
        maxLat: 18.3,
        damagePct0m: 0.58,
        damagePct10m: 0.47,
        damagePct20m: 0.43,
        builtPct0m: 0.03,
        unknownPct: 0,
        damaged: true,
        severity: "high",
        formattedAddress: null,
        placeId: null,
        addressResolution: null,
      },
    ]);

    expect(result.stats.total).toBe(2);
    expect(result.stats.priority).toBe(2);
    expect(getPriorityCount(result.stats.bySeverity)).toBe(2);
    expect(result.incidents[0].address).toEqual({
      formatted: "1 Main Street, Westmoreland",
      placeId: "place-1",
      resolution: "street_address",
    });
    expect(result.incidents[1].address.resolution).toBe("missing");
    expect(result.featureCollection.features[0]?.properties.address.placeId).toBe("place-1");
  });
});
