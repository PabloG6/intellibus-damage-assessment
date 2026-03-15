import { useQuery } from "@tanstack/react-query";
import PartySocket from "partysocket";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NETWORK_PARTY_NAME,
  NETWORK_ROOM_ID,
  type ProbeStatus,
} from "@workspace/api/network";
import { env } from "@/lib/env";
import { useTRPC } from "@/lib/trpc";
import {
  buildProbeGeoJSON,
  computeProbeSummary,
  INITIAL_PROBES,
  type NetworkProbe,
  type SidebarMode,
} from "./network-probes";

const HEARTBEAT_INTERVAL_MS = 8_000;

const STATUS_TRANSITIONS: Record<
  ProbeStatus,
  Array<{ next: ProbeStatus; weight: number }>
> = {
  online: [
    { next: "online", weight: 0.82 },
    { next: "degraded", weight: 0.14 },
    { next: "offline", weight: 0.04 },
  ],
  degraded: [
    { next: "online", weight: 0.35 },
    { next: "degraded", weight: 0.45 },
    { next: "offline", weight: 0.2 },
  ],
  offline: [
    { next: "online", weight: 0.15 },
    { next: "degraded", weight: 0.25 },
    { next: "offline", weight: 0.6 },
  ],
};

function pickWeightedStatus(current: ProbeStatus): ProbeStatus {
  const transitions = STATUS_TRANSITIONS[current];
  const rand = Math.random();
  let cumulative = 0;

  for (const transition of transitions) {
    cumulative += transition.weight;
    if (rand < cumulative) {
      return transition.next;
    }
  }

  return current;
}

function cloneInitialProbes() {
  return INITIAL_PROBES.map((probe) => ({ ...probe }));
}

function upsertProbe(probes: NetworkProbe[], nextProbe: NetworkProbe) {
  const existingIndex = probes.findIndex((probe) => probe.id === nextProbe.id);
  if (existingIndex === -1) {
    return [...probes, nextProbe].sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }

  const next = [...probes];
  next[existingIndex] = nextProbe;
  return next;
}

export function useNetworkProbes(sidebarMode: SidebarMode) {
  const trpc = useTRPC();
  const shouldUseMock =
    env.VITE_NETWORK_MODE === "mock" || !env.VITE_PARTYKIT_HOST;
  const [probes, setProbes] = useState<NetworkProbe[]>(() =>
    shouldUseMock ? cloneInitialProbes() : [],
  );
  const [selectedProbeId, setSelectedProbeId] = useState<string | null>(null);
  const listQuery = useQuery({
    ...trpc.network.list.queryOptions(),
    enabled: !shouldUseMock,
    retry: false,
  });

  useEffect(() => {
    if (!shouldUseMock && listQuery.data) {
      setProbes(listQuery.data);
    }
  }, [listQuery.data, shouldUseMock]);

  useEffect(() => {
    if (!shouldUseMock) {
      return;
    }

    setProbes(cloneInitialProbes());
  }, [shouldUseMock]);

  useEffect(() => {
    if (!selectedProbeId) {
      return;
    }

    if (!probes.some((probe) => probe.id === selectedProbeId)) {
      setSelectedProbeId(null);
    }
  }, [probes, selectedProbeId]);

  useEffect(() => {
    if (!shouldUseMock) {
      return;
    }

    const id = window.setInterval(() => {
      setProbes((previousProbes) => {
        const count = Math.random() < 0.4 ? 2 : 1;
        const indices = new Set<number>();

        while (indices.size < count) {
          indices.add(Math.floor(Math.random() * previousProbes.length));
        }

        return previousProbes.map((probe, index) => {
          if (!indices.has(index)) {
            return probe;
          }

          const nextStatus = pickWeightedStatus(probe.status);
          const now = new Date().toISOString();
          let nextUptime = probe.uptimePct;

          if (nextStatus === "online") {
            nextUptime = Math.min(1, probe.uptimePct + 0.02);
          } else if (nextStatus === "degraded") {
            nextUptime = Math.max(0, probe.uptimePct - 0.03);
          } else {
            nextUptime = Math.max(0, probe.uptimePct - 0.08);
          }

          return {
            ...probe,
            status: nextStatus,
            lastSeen: nextStatus === "offline" ? probe.lastSeen : now,
            uptimePct: Math.round(nextUptime * 1_000) / 1_000,
          };
        });
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [shouldUseMock]);

  useEffect(() => {
    if (shouldUseMock || sidebarMode !== "network" || !env.VITE_PARTYKIT_HOST) {
      return;
    }

    const socket = new PartySocket({
      host: env.VITE_PARTYKIT_HOST,
      party: NETWORK_PARTY_NAME,
      room: NETWORK_ROOM_ID,
      query: {
        role: "observer",
      },
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(String(event.data));
        if (payload.type !== "probe.updated" || !payload.probe) {
          return;
        }

        setProbes((current) => upsertProbe(current, payload.probe));
      } catch {
        // Ignore malformed observer payloads.
      }
    });

    return () => {
      socket.close();
    };
  }, [shouldUseMock, sidebarMode]);

  const probeGeoJSON = useMemo(() => buildProbeGeoJSON(probes), [probes]);
  const summary = useMemo(() => computeProbeSummary(probes), [probes]);
  const selectedProbe = useMemo(
    () => probes.find((probe) => probe.id === selectedProbeId) ?? null,
    [probes, selectedProbeId],
  );

  const selectProbe = useCallback((probeId: string) => {
    setSelectedProbeId(probeId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProbeId(null);
  }, []);

  return {
    probes,
    selectedProbeId,
    selectedProbe,
    selectProbe,
    clearSelection,
    probeGeoJSON,
    summary,
    isUsingMockData: shouldUseMock,
  } as const;
}
