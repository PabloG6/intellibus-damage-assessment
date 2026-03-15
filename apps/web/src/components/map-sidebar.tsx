import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@workspace/ui/components/button";
import type { DashboardOverview } from "@/lib/incidents";
import {
  SEVERITY_BADGE,
  SEVERITY_DOT,
  formatAddressResolution,
  formatBounds,
  formatLngLat,
  formatPercent,
  formatSeverity,
  getDisplayAddress,
  getRecommendedAction,
} from "@/lib/incidents";
import type { NetworkProbe, ProbeSummary, SidebarMode } from "@/lib/network-probes";
import {
  PROBE_STATUS_BADGE,
  PROBE_STATUS_DOT,
  formatFacilityType,
  formatLastSeen,
  formatProbeStatus,
  formatUptimePct,
} from "@/lib/network-probes";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function SectionLabel({
  label,
  trailing,
}: {
  label: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 pb-1.5 pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
        {label}
      </p>
      {trailing}
    </div>
  );
}

function Divider() {
  return <div className="mx-4 my-0.5 border-t border-sidebar-border" />;
}

function ChevronLeft() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M7.5 2.5L4.5 6L7.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M4.5 2.5L7.5 6L4.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons for the mode toggle
// ---------------------------------------------------------------------------

function HouseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 5.5L6 2L10 5.5V10.5H7.5V7.5H4.5V10.5H2V5.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 9.5H6.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.17 7.83a2.83 2.83 0 013.66 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.34 6a5.1 5.1 0 017.32 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0.75 4.1a7.4 7.4 0 0110.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MapSidebarProps {
  // Mode
  sidebarMode: SidebarMode;
  onSetSidebarMode: (mode: SidebarMode) => void;

  // Housing (existing)
  overview?: DashboardOverview;
  selectedIncidentId: string | null;
  onSelectIncident: (incidentId: string) => void;
  onFitDataset: () => void;
  onStartBriefing: () => void;
  onStopBriefing: () => void;
  isBriefingActive: boolean;
  briefingIndex: number;
  briefingTotal: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | null;

  // Network probes
  probes: NetworkProbe[];
  selectedProbeId: string | null;
  onSelectProbe: (probeId: string) => void;
  probeSummary: ProbeSummary;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MapSidebar({
  sidebarMode,
  onSetSidebarMode,
  overview,
  selectedIncidentId,
  onSelectIncident,
  onFitDataset,
  onStartBriefing,
  onStopBriefing,
  isBriefingActive,
  briefingIndex,
  briefingTotal,
  isLoading,
  isError,
  errorMessage,
  probes,
  selectedProbeId,
  onSelectProbe,
  probeSummary,
}: MapSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const selectedIncident =
    overview?.incidents.find((incident) => incident.id === selectedIncidentId) ?? null;
  const selectedProbe =
    probes.find((p) => p.id === selectedProbeId) ?? null;

  return (
    <div
      className={[
        "absolute left-0 top-0 z-10 flex h-full flex-col",
        "border-r border-sidebar-border",
        "bg-sidebar/95 backdrop-blur-xl",
        "transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        expanded ? "w-[300px]" : "w-10",
      ].join(" ")}
    >
      {/* --- Header -------------------------------------------------------- */}
      <div className="flex flex-shrink-0 items-center border-b border-sidebar-border px-3 py-3">
        {expanded ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-sidebar-primary">
                <span className="text-[9px] font-bold tracking-tight text-sidebar-primary-foreground">
                  YW
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold tracking-tight text-sidebar-foreground">
                  YardWatch
                </p>
                <p className="truncate text-[9px] text-muted-foreground">
                  Melissa claim triage
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5">
                <span className="h-1 w-1 rounded-full bg-sky-400" />
                <span className="whitespace-nowrap text-[9px] font-medium text-sky-400">
                  Polygon view
                </span>
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="mx-auto flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Expand sidebar"
          >
            <ChevronRight />
          </button>
        )}
      </div>

      {expanded ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* --- Mode toggle ------------------------------------------------ */}
          <div className="flex flex-shrink-0 gap-1 border-b border-sidebar-border px-3 py-2">
            <button
              onClick={() => onSetSidebarMode("housing")}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all",
                sidebarMode === "housing"
                  ? "border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
                  : "border border-transparent text-muted-foreground/60 hover:text-muted-foreground",
              ].join(" ")}
            >
              <HouseIcon />
              Damaged Housing
            </button>
            <button
              onClick={() => onSetSidebarMode("network")}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all",
                sidebarMode === "network"
                  ? "border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
                  : "border border-transparent text-muted-foreground/60 hover:text-muted-foreground",
              ].join(" ")}
            >
              <WifiIcon />
              Network Liveliness
            </button>
          </div>

          {/* --- Scrollable body ------------------------------------------- */}
          <div className="flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
            {sidebarMode === "housing" ? (
              <HousingContent
                overview={overview}
                selectedIncidentId={selectedIncidentId}
                selectedIncident={selectedIncident}
                onSelectIncident={onSelectIncident}
                onFitDataset={onFitDataset}
                onStartBriefing={onStartBriefing}
                onStopBriefing={onStopBriefing}
                isBriefingActive={isBriefingActive}
                briefingIndex={briefingIndex}
                briefingTotal={briefingTotal}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
              />
            ) : (
              <NetworkContent
                probes={probes}
                selectedProbeId={selectedProbeId}
                selectedProbe={selectedProbe}
                onSelectProbe={onSelectProbe}
                summary={probeSummary}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Housing content (original sidebar body, extracted)
// ---------------------------------------------------------------------------

function HousingContent({
  overview,
  selectedIncidentId,
  selectedIncident,
  onSelectIncident,
  onFitDataset,
  onStartBriefing,
  onStopBriefing,
  isBriefingActive,
  briefingIndex,
  briefingTotal,
  isLoading,
  isError,
  errorMessage,
}: {
  overview?: DashboardOverview;
  selectedIncidentId: string | null;
  selectedIncident: DashboardOverview["incidents"][number] | null;
  onSelectIncident: (id: string) => void;
  onFitDataset: () => void;
  onStartBriefing: () => void;
  onStopBriefing: () => void;
  isBriefingActive: boolean;
  briefingIndex: number;
  briefingTotal: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | null;
}) {
  return (
    <>
      <SectionLabel label="Dataset" />

      <div className="space-y-3 px-4 pb-3">
        <Button
          onClick={isBriefingActive ? onStopBriefing : onStartBriefing}
          variant={isBriefingActive ? "destructive" : "default"}
          className="w-full"
        >
          {isBriefingActive
            ? `Stop Briefing (${briefingIndex + 1}/${briefingTotal})`
            : "Start Briefing"}
        </Button>

        <button
          onClick={onFitDataset}
          className="flex h-9 w-full items-center justify-center rounded-lg border border-border bg-input text-[12px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          Fit dataset bounds
        </button>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2">
          <span className="text-[10px] text-muted-foreground">
            Top queue: {briefingTotal} homes
          </span>
          <span className="text-[10px] text-muted-foreground">
            Priority:{" "}
            {overview?.stats.priority ??
              (overview
                ? overview.stats.bySeverity.critical + overview.stats.bySeverity.high
                : 0)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-muted px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
              Source
            </p>
            <p className="mt-1 text-[12px] text-sidebar-foreground">
              {overview?.dataset.sourceFile ?? "melissa-damage.geojson"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
              Total
            </p>
            <p className="mt-1 text-[12px] text-sidebar-foreground">
              {overview?.stats.total ?? "0"} detections
            </p>
          </div>
        </div>

        {overview?.dataset.bounds ? (
          <div className="rounded-lg border border-border bg-muted px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
              Bounds
            </p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {formatBounds(overview.dataset.bounds)}
            </p>
          </div>
        ) : null}
      </div>

      <Divider />

      <SectionLabel label="Severity" />

      <div className="space-y-2 px-4 pb-3">
        {overview ? (
          (["critical", "high", "medium", "low"] as const).map((severity) => (
            <div
              key={severity}
              className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={["h-2 w-2 rounded-full", SEVERITY_DOT[severity]].join(" ")}
                />
                <span className="text-[12px] text-sidebar-foreground">
                  {formatSeverity(severity)}
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {overview.stats.bySeverity[severity]}
              </span>
            </div>
          ))
        ) : (
          <p className="px-1 text-[12px] text-muted-foreground">
            Severity counts appear after the incidents API resolves.
          </p>
        )}
      </div>

      <Divider />

      <SectionLabel
        label={`Detections (${overview?.incidents.length ?? 0})`}
        trailing={
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
            Melissa
          </span>
        }
      />

      {!isLoading && !isError && overview?.incidents.length ? (
        <p className="px-4 pb-2 text-[10px] text-muted-foreground/60">
          Pick a detection to inspect the footprint, address match, and inspection priority.
        </p>
      ) : null}

      <div className="space-y-px px-3 pb-2">
        {isLoading ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-[12px] text-muted-foreground">
            Loading prioritized detections from the incidents API.
          </p>
        ) : isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-4 text-[12px] text-destructive">
            {errorMessage ?? "Unable to load Melissa detections."}
          </p>
        ) : overview?.incidents.length ? (
          overview.incidents.map((incident) => {
            const isSelected = incident.id === selectedIncidentId;

            return (
              <button
                key={incident.id}
                onClick={() => onSelectIncident(incident.id)}
                className={[
                  "w-full rounded-lg px-3 py-2.5 text-left transition-all",
                  isSelected
                    ? "border border-sidebar-border bg-sidebar-accent"
                    : "border border-transparent hover:bg-sidebar-accent",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={[
                        "mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full",
                        SEVERITY_DOT[incident.severity],
                      ].join(" ")}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-sidebar-foreground">
                        {incident.label}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {getDisplayAddress(incident.address)}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={[
                        "inline-block rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                        SEVERITY_BADGE[incident.severity],
                      ].join(" ")}
                    >
                      {formatSeverity(incident.severity)}
                    </span>
                    <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/60">
                      {formatPercent(incident.damagePct0m)}
                    </p>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-mono text-[9px] text-muted-foreground/50">
                    {incident.id}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50">
                    {incident.status}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-[12px] text-muted-foreground">
            No incidents are loaded yet. Run the seed script to import Melissa detections.
          </p>
        )}
      </div>

      <Divider />

      <SectionLabel
        label={selectedIncident ? `Selected · ${selectedIncident.id}` : "Selected"}
      />

      <div className="mx-3 mb-3 overflow-hidden rounded-xl border border-border bg-muted">
        {selectedIncident ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    SEVERITY_DOT[selectedIncident.severity],
                  ].join(" ")}
                />
                <span className="text-[12px] font-medium text-sidebar-foreground">
                  {selectedIncident.label}
                </span>
              </div>
              <span
                className={[
                  "inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                  SEVERITY_BADGE[selectedIncident.severity],
                ].join(" ")}
              >
                {formatSeverity(selectedIncident.severity)}
              </span>
            </div>

            <div className="divide-y divide-border">
              {[
                {
                  label: "Address",
                  value: getDisplayAddress(selectedIncident.address),
                },
                {
                  label: "Address source",
                  value: formatAddressResolution(selectedIncident.address),
                },
                {
                  label: "Recommended action",
                  value: getRecommendedAction(selectedIncident.severity),
                },
                { label: "Status", value: selectedIncident.status },
                {
                  label: "Damage score",
                  value: formatPercent(selectedIncident.damagePct0m),
                },
                {
                  label: "10m context",
                  value: formatPercent(selectedIncident.damagePct10m),
                },
                {
                  label: "20m context",
                  value: formatPercent(selectedIncident.damagePct20m),
                },
                {
                  label: "Built area",
                  value: formatPercent(selectedIncident.builtPct0m),
                },
                { label: "Centroid", value: formatLngLat(selectedIncident.centroid) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 px-3 py-1.5"
                >
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <span className="max-w-[150px] truncate text-right text-[11px] text-sidebar-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-3 py-4 text-[12px] text-muted-foreground">
            Pick a detection to inspect the footprint, address match, and inspection
            priority.
          </div>
        )}
      </div>

      <Divider />

      <SectionLabel label="Mapbox" />

      <div className="space-y-2 px-4 pb-3">
        <div className="rounded-lg border border-border bg-muted px-3 py-2">
          <p className="text-[11px] leading-5 text-muted-foreground">
            Mapbox is serving the basemap only. The building-damage polygons are coming
            from the incidents API and rendered as GeoJSON overlays in the browser.
          </p>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Network liveliness content
// ---------------------------------------------------------------------------

function NetworkContent({
  probes,
  selectedProbeId,
  selectedProbe,
  onSelectProbe,
  summary,
}: {
  probes: NetworkProbe[];
  selectedProbeId: string | null;
  selectedProbe: NetworkProbe | null;
  onSelectProbe: (id: string) => void;
  summary: ProbeSummary;
}) {
  return (
    <>
      <SectionLabel label="Network Status" />

      {/* Outage assessment banner */}
      {summary.offline > 0 ? (
        <div className="mx-4 mb-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0 text-[12px]" aria-hidden="true">
              &#x26A1;
            </span>
            <p className="text-[11px] leading-[1.5] text-red-300">
              {summary.outageAssessment}
            </p>
          </div>
        </div>
      ) : summary.degraded > 0 ? (
        <div className="mx-4 mb-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0 text-[12px]" aria-hidden="true">
              &#x26A0;&#xFE0F;
            </span>
            <p className="text-[11px] leading-[1.5] text-amber-300">
              {summary.outageAssessment}
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-4 mb-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
          <p className="text-[11px] leading-[1.5] text-emerald-300">
            {summary.outageAssessment}
          </p>
        </div>
      )}

      {/* Status summary tiles */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {(
          [
            { label: "Online", count: summary.online, dot: "bg-emerald-400" },
            { label: "Degraded", count: summary.degraded, dot: "bg-amber-400" },
            { label: "Offline", count: summary.offline, dot: "bg-red-400" },
          ] as const
        ).map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-muted px-3 py-2 text-center"
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className={["h-1.5 w-1.5 rounded-full", item.dot].join(" ")} />
              <span className="font-mono text-[14px] font-semibold text-sidebar-foreground">
                {item.count}
              </span>
            </div>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <Divider />

      <SectionLabel
        label={`Probes (${probes.length})`}
        trailing={
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5">
            <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[9px] font-medium text-emerald-400">Live</span>
          </span>
        }
      />

      <p className="px-4 pb-2 text-[10px] text-muted-foreground/60">
        Government WiFi probes at critical facilities. Tap a probe to inspect its
        15-minute uptime and connectivity window.
      </p>

      <div className="space-y-px px-3 pb-2">
        {probes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-[12px] text-muted-foreground">
            No facilities are registered yet. Use the reporter app to enroll a
            single site and start sending heartbeats.
          </p>
        ) : probes.map((probe) => {
          const isSelected = probe.id === selectedProbeId;

          return (
            <button
              key={probe.id}
              onClick={() => onSelectProbe(probe.id)}
              className={[
                "w-full rounded-lg px-3 py-2.5 text-left transition-all",
                isSelected
                  ? "border border-sidebar-border bg-sidebar-accent"
                  : "border border-transparent hover:bg-sidebar-accent",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={[
                      "mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full",
                      PROBE_STATUS_DOT[probe.status],
                    ].join(" ")}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-sidebar-foreground">
                      {probe.label}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {formatFacilityType(probe.facilityType)}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span
                    className={[
                      "inline-block rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      PROBE_STATUS_BADGE[probe.status],
                    ].join(" ")}
                  >
                    {formatProbeStatus(probe.status)}
                  </span>
                  <p className="mt-0.5 text-[9px] text-muted-foreground/60">
                    {formatLastSeen(probe.lastSeen)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Divider />

      <SectionLabel
        label={selectedProbe ? `Selected · ${selectedProbe.id}` : "Selected"}
      />

      <div className="mx-3 mb-3 overflow-hidden rounded-xl border border-border bg-muted">
        {selectedProbe ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    PROBE_STATUS_DOT[selectedProbe.status],
                  ].join(" ")}
                />
                <span className="text-[12px] font-medium text-sidebar-foreground">
                  {selectedProbe.label}
                </span>
              </div>
              <span
                className={[
                  "inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                  PROBE_STATUS_BADGE[selectedProbe.status],
                ].join(" ")}
              >
                {formatProbeStatus(selectedProbe.status)}
              </span>
            </div>

            <div className="divide-y divide-border">
              {[
                {
                  label: "Facility type",
                  value: formatFacilityType(selectedProbe.facilityType),
                },
                {
                  label: "Area",
                  value: selectedProbe.areaLabel,
                },
                { label: "Status", value: formatProbeStatus(selectedProbe.status) },
                { label: "Last seen", value: formatLastSeen(selectedProbe.lastSeen) },
                {
                  label: "15m uptime",
                  value: formatUptimePct(selectedProbe.uptimePct),
                },
                {
                  label: "Coordinates",
                  value: `${selectedProbe.lngLat[1].toFixed(4)}, ${selectedProbe.lngLat[0].toFixed(4)}`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 px-3 py-1.5"
                >
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <span className="max-w-[150px] truncate text-right text-[11px] text-sidebar-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-3 py-4 text-[12px] text-muted-foreground">
            Select a probe to view facility details, uptime history, and outage
            assessment.
          </div>
        )}
      </div>

      <Divider />

      <SectionLabel label="Infrastructure" />

      <div className="space-y-2 px-4 pb-3">
        <div className="rounded-lg border border-border bg-muted px-3 py-2">
          <p className="text-[11px] leading-5 text-muted-foreground">
            Probes are government-deployed WiFi access points at hospitals, schools, and
            police stations. Downtime signals a likely electrical outage in the surrounding
            area, enabling rapid post-disaster power restoration assessments.
          </p>
        </div>
      </div>
    </>
  );
}
