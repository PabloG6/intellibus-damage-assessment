import { describe, expect, it } from "vitest";
import {
  PROBE_UPTIME_BUCKET_COUNT,
  PROBE_UPTIME_BUCKET_MS,
  bucketIndexFromTimestamp,
  classifyProbeStatus,
  computeRollingUptimePct,
  registerHeartbeatBucket,
  upsertProbeDraft,
} from "../src/network";

describe("network probe helpers", () => {
  it("classifies online, degraded, and offline liveliness windows", () => {
    const now = Date.UTC(2026, 2, 15, 12, 0, 0);

    expect(classifyProbeStatus(new Date(now - 10_000), now)).toBe("online");
    expect(classifyProbeStatus(new Date(now - 25_000), now)).toBe("degraded");
    expect(classifyProbeStatus(new Date(now - 45_000), now)).toBe("offline");
    expect(classifyProbeStatus(null, now)).toBe("offline");
  });

  it("computes rolling 15 minute uptime from 30 second buckets", () => {
    const now = Date.UTC(2026, 2, 15, 12, 0, 0);
    let buckets: number[] = [];

    for (let index = 0; index < 6; index += 1) {
      buckets = registerHeartbeatBucket(buckets, now - index * PROBE_UPTIME_BUCKET_MS);
    }

    expect(computeRollingUptimePct(buckets, now)).toBeCloseTo(
      6 / PROBE_UPTIME_BUCKET_COUNT,
      5,
    );

    const futureBucket = bucketIndexFromTimestamp(now + 5 * PROBE_UPTIME_BUCKET_MS);
    expect(registerHeartbeatBucket(buckets, now + 5 * PROBE_UPTIME_BUCKET_MS)).toContain(
      futureBucket,
    );
  });

  it("keeps one probe id per owner when registration details are updated", () => {
    const createdAt = new Date("2026-03-15T12:00:00.000Z");
    const initial = upsertProbeDraft(
      null,
      "user-demo",
      {
        label: "Melissa Health Centre",
        facilityType: "hospital",
        areaLabel: "Melissa corridor",
        lngLat: [-78.1313, 18.3072],
      },
      createdAt,
    );

    const updated = upsertProbeDraft(
      initial,
      "user-demo",
      {
        label: "Melissa Operations Centre",
        facilityType: "utility",
        areaLabel: "Melissa north",
        lngLat: [-78.128, 18.309],
      },
      new Date("2026-03-15T12:05:00.000Z"),
    );

    expect(updated.id).toBe(initial.id);
    expect(updated.ownerUserId).toBe(initial.ownerUserId);
    expect(updated.label).toBe("Melissa Operations Centre");
    expect(updated.facilityType).toBe("utility");
    expect(updated.areaLabel).toBe("Melissa north");
    expect(updated.lng).toBe(-78.128);
    expect(updated.lat).toBe(18.309);
  });
});
