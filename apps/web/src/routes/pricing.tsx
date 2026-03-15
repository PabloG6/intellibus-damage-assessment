import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

/* ------------------------------------------------------------------ */
/*  Scroll reveal                                                      */
/* ------------------------------------------------------------------ */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const CORE_TIERS = [
  {
    name: "Pulse",
    price: "$2,500",
    unit: "/month",
    badge: null,
    liveliness: "Monitored",
    granularity: "Regional (10 m)",
    scope: "Up to 5,000 km\u00B2",
    features: [
      "Weekly change layers",
      "Weather & alert overlays",
      "Dashboard + CSV/PDF exports",
      "Sentinel-2 open data (no imagery cost)",
    ],
    bestFor: "Parish-level government watch, regional risk overlays",
    cta: "Start with Pulse",
  },
  {
    name: "Watch",
    price: "$7,500",
    unit: "/month",
    badge: null,
    liveliness: "Monitored",
    granularity: "Portfolio (3 m)",
    scope: "Up to 25,000 locations or 2,500 km\u00B2",
    features: [
      "Near-daily revisit stack",
      "Address enrichment",
      "Prioritized triage queue",
      "API export",
    ],
    bestFor: "Insurance portfolio monitoring, utility territory watch",
    cta: "Start with Watch",
  },
  {
    name: "Detail",
    price: "$7,500",
    unit: "/event",
    badge: "Most Popular",
    liveliness: "Event-driven",
    granularity: "Property (50 cm)",
    scope: "Up to 10,000 locations or 500 km\u00B2",
    features: [
      "Building-level triage",
      "Same-day claim intake queue",
      "Corridor obstruction scoring",
      "Analyst summary included",
    ],
    bestFor: "CAT claim triage, storm restoration burst",
    cta: "Activate Detail",
  },
  {
    name: "Command",
    price: "$15,000",
    unit: "/event",
    badge: null,
    liveliness: "Rapid response",
    granularity: "Critical asset (30 cm)",
    scope: "Up to 2,500 critical sites or 250 km\u00B2",
    features: [
      "Priority processing lane",
      "Premium turnaround (6\u201312 hrs)",
      "Command brief pack",
      "Executive-ready outputs",
    ],
    bestFor: "Emergency command, high-value property review, critical infrastructure",
    cta: "Activate Command",
  },
] as const;

const RETAINERS = [
  {
    name: "Event Ready",
    price: "$3,500",
    unit: "/month",
    detail:
      "Pre-load AOIs, assets, addresses, dashboards, and playbooks for one named region or portfolio.",
    recommended: "Pair with Detail",
  },
  {
    name: "Priority Ops",
    price: "$8,500",
    unit: "/month",
    detail:
      "Everything in Event Ready plus priority queueing, executive briefing template, and extended retention.",
    recommended: "Pair with Command",
  },
] as const;

const SEGMENT_PACKAGES = [
  {
    segment: "Government",
    color: "oklch(0.72 0.14 160)",
    packages: [
      {
        name: "Parish / Municipality Watch",
        tier: "Pulse",
        price: "$2,500/mo",
        highlights: [
          "Flood and landslide watch",
          "Road access and district impact maps",
          "Shelter, school, clinic prioritization",
        ],
      },
      {
        name: "National Resilience Ops",
        tier: "Watch + Event Ready",
        price: "$11,000/mo",
        highlights: [
          "Islandwide monitoring",
          "District-level prioritization",
          "Executive and donor reporting",
        ],
      },
      {
        name: "Emergency Command Burst",
        tier: "Command + Priority Ops",
        price: "$15,000/event",
        highlights: [
          "Named critical facilities",
          "Shelters, hospitals, ports, bridges",
          "Rapid ministerial briefings",
        ],
      },
    ],
  },
  {
    segment: "Insurance",
    color: "oklch(0.79 0.152 193)",
    packages: [
      {
        name: "Portfolio Watch",
        tier: "Watch",
        price: "$7,500/mo",
        highlights: [
          "Up to 25,000 insured locations",
          "Pre-event exposure watch",
          "Address-level claim prioritization",
        ],
      },
      {
        name: "CAT Claim Triage",
        tier: "Detail",
        price: "$7,500/event",
        highlights: [
          "Same-day claim intake prioritization",
          "Field adjuster routing",
          "+$0.35/property above 10,000",
        ],
      },
      {
        name: "High-Value Property Review",
        tier: "Command",
        price: "$15,000/event",
        highlights: [
          "VIP and high-sum-insured assets",
          "Reinsurer reporting",
          "Board-level claim briefings",
        ],
      },
    ],
  },
  {
    segment: "Utilities",
    color: "oklch(0.75 0.15 55)",
    packages: [
      {
        name: "Territory Risk Watch",
        tier: "Watch",
        price: "$8,500/mo",
        highlights: [
          "Up to 1,500 km\u00B2 or 500 linear km",
          "Substation and plant monitoring",
          "Vegetation and access-risk trends",
        ],
      },
      {
        name: "Storm Restoration Burst",
        tier: "Detail",
        price: "$9,500/event",
        highlights: [
          "Corridor triage",
          "Blocked-access detection",
          "Flooded substations and compounds",
        ],
      },
      {
        name: "Critical Infrastructure Rush",
        tier: "Command",
        price: "$18,000/event",
        highlights: [
          "Highest-priority assets",
          "Executive outage situation reports",
          "Regulator and board briefings",
        ],
      },
    ],
  },
] as const;

const ADD_ONS = [
  { name: "Extra named locations", price: "$0.03/location/mo" },
  { name: "Extra critical assets", price: "$0.75/asset/mo" },
  { name: "Address enrichment refresh", price: "$0.05/location/mo" },
  { name: "API + webhook access", price: "$1,500/mo" },
  { name: "Analyst-reviewed event brief", price: "$3,000/event" },
  { name: "White-label report pack", price: "$1,000/event" },
  { name: "Data retention > 12 months", price: "$750/mo" },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Atmosphere */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 50% at 20% 10%, oklch(0.20 0.04 220 / 0.40), transparent)",
            "radial-gradient(ellipse 60% 40% at 80% 90%, oklch(0.18 0.03 200 / 0.30), transparent)",
          ].join(", "),
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 30h60M30 0v60' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
          backgroundSize: "60px 60px",
        }}
      />

      <Nav />
      <HeroSection />
      <CoreTiersSection />
      <RetainersSection />
      <SegmentPackagesSection />
      <AddOnsSection />
      <ImagerySection />
      <CtaSection />
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-[10px] font-bold tracking-tight text-sidebar-primary-foreground">
              YW
            </span>
          </div>
          <span className="text-sm font-semibold tracking-tight">YardWatch</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#tiers" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Core Tiers
          </a>
          <a href="#segments" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Packages
          </a>
          <a href="#add-ons" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Add-Ons
          </a>
          <a href="#imagery" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Imagery
          </a>
        </div>

        <Link to="/dashboard">
          <Button size="sm">Open Dashboard</Button>
        </Link>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function HeroSection() {
  return (
    <section className="pb-16 pt-20 md:pb-24 md:pt-28">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Pricing
          </span>
        </div>

        <h1 className="mx-auto max-w-2xl text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.1] tracking-tight">
          Transparent pricing,{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.79 0.152 193), oklch(0.70 0.14 220))",
            }}
          >
            scaled to the storm
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
          Four core tiers from regional monitoring to rapid-response command.
          Platform and analytics are YardWatch revenue. Imagery is pass-through at provider cost
          plus a 15% procurement fee, or free when open data is sufficient.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Core Tiers                                                         */
/* ------------------------------------------------------------------ */

function CoreTiersSection() {
  const { ref, visible } = useReveal();

  return (
    <section id="tiers" className="border-t border-border py-20 md:py-28" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Core Platform Tiers
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Pick the resolution and cadence you need
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          All prices are YardWatch software and operations. Imagery is separate unless the tier uses
          open data.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {CORE_TIERS.map((tier, index) => {
            const isPopular = tier.badge !== null;
            return (
              <div
                key={tier.name}
                className={[
                  "relative flex flex-col rounded-2xl border p-6 transition-all duration-500",
                  isPopular
                    ? "border-sidebar-primary/30 bg-sidebar-primary/[0.03]"
                    : "border-border bg-card/40",
                  visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                ].join(" ")}
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                {isPopular ? (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full border border-sidebar-primary/25 bg-sidebar-primary/10 px-2.5 py-0.5">
                    <span className="h-1 w-1 rounded-full bg-sidebar-primary" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-sidebar-primary">
                      {tier.badge}
                    </span>
                  </div>
                ) : null}

                {/* Header */}
                <div>
                  <h3 className="text-base font-semibold tracking-tight">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span
                      className="text-3xl font-semibold tracking-tight"
                      style={isPopular ? { color: "oklch(0.79 0.152 193)" } : undefined}
                    >
                      {tier.price}
                    </span>
                    <span className="text-xs text-muted-foreground">{tier.unit}</span>
                  </div>
                </div>

                {/* Metadata pills */}
                <div className="mt-5 space-y-2">
                  <MetaPill label="Liveliness" value={tier.liveliness} />
                  <MetaPill label="Granularity" value={tier.granularity} />
                  <MetaPill label="Scope" value={tier.scope} />
                </div>

                {/* Features */}
                <ul className="mt-5 flex-1 space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: isPopular ? "oklch(0.79 0.152 193)" : "oklch(0.60 0.010 240)" }}
                      >
                        <path
                          d="M3.5 7L6 9.5L10.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Best for */}
                <p className="mt-5 rounded-xl border border-border bg-muted/40 px-3 py-2 text-[10px] leading-4 text-muted-foreground">
                  {tier.bestFor}
                </p>

                <Button
                  variant={isPopular ? "default" : "outline"}
                  className="mt-5 w-full"
                  size="sm"
                >
                  {tier.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-1.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-medium text-foreground">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Retainers                                                          */
/* ------------------------------------------------------------------ */

function RetainersSection() {
  const { ref, visible } = useReveal();

  return (
    <section className="border-t border-border py-20 md:py-28" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Standby Retainers
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Keep the system warm before the storm
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Pre-load your areas of interest, assets, and playbooks so activation is instant when an
          event triggers.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {RETAINERS.map((retainer, index) => (
            <div
              key={retainer.name}
              className={[
                "rounded-2xl border border-border bg-card/40 p-6 transition-all duration-500",
                visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              ].join(" ")}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold tracking-tight">{retainer.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{retainer.detail}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xl font-semibold tracking-tight">{retainer.price}</p>
                  <p className="text-[10px] text-muted-foreground">{retainer.unit}</p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5">
                <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {retainer.recommended}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Segment Packages                                                   */
/* ------------------------------------------------------------------ */

function SegmentPackagesSection() {
  const { ref, visible } = useReveal();
  const [activeSegment, setActiveSegment] = useState(0);

  return (
    <section id="segments" className="border-t border-border py-20 md:py-28" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Segment Packages
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Pre-configured for your sector
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Each package bundles the right tier, retainer, and scope for a specific buyer profile.
        </p>

        {/* Segment tabs */}
        <div className="mt-10 flex gap-2">
          {SEGMENT_PACKAGES.map((segment, index) => (
            <button
              key={segment.segment}
              onClick={() => setActiveSegment(index)}
              className={[
                "rounded-xl border px-4 py-2 text-xs font-medium transition-all",
                activeSegment === index
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {segment.segment}
            </button>
          ))}
        </div>

        {/* Active segment cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {SEGMENT_PACKAGES[activeSegment].packages.map((pkg, index) => (
            <div
              key={pkg.name}
              className={[
                "rounded-2xl border border-border bg-card/40 p-5 transition-all duration-400",
                visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              ].join(" ")}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold tracking-tight">{pkg.name}</h4>
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5">
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: SEGMENT_PACKAGES[activeSegment].color }}
                    />
                    <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                      {pkg.tier}
                    </span>
                  </div>
                </div>
                <p
                  className="flex-shrink-0 text-right text-lg font-semibold tracking-tight"
                  style={{ color: SEGMENT_PACKAGES[activeSegment].color }}
                >
                  {pkg.price}
                </p>
              </div>

              <ul className="space-y-1.5">
                {pkg.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <span
                      className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: SEGMENT_PACKAGES[activeSegment].color }}
                    />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Price positioning summary */}
        <div className="mt-8 rounded-2xl border border-border bg-card/40 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Price Positioning Summary
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { segment: "Government", range: "$2.5k\u2013$11k/mo, burst to $15k+/event" },
              { segment: "Insurance", range: "$7.5k/mo, burst to $7.5k\u2013$15k+/event" },
              { segment: "Utilities", range: "$8.5k/mo, burst to $9.5k\u2013$18k+/event" },
            ].map((item) => (
              <div key={item.segment} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
                <span className="text-xs font-medium text-foreground">{item.segment}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{item.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Add-Ons                                                            */
/* ------------------------------------------------------------------ */

function AddOnsSection() {
  const { ref, visible } = useReveal();

  return (
    <section id="add-ons" className="border-t border-border py-20 md:py-28" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Add-Ons
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Extend any tier
        </h2>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          {ADD_ONS.map((addon, index) => (
            <div
              key={addon.name}
              className={[
                "flex items-center justify-between px-5 py-3.5 transition-all duration-400",
                index > 0 ? "border-t border-border" : "",
                visible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
              ].join(" ")}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <span className="text-sm text-foreground">{addon.name}</span>
              <span className="font-mono text-sm text-muted-foreground">{addon.price}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
              Discounts
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Annual prepay 10% &middot; Two-year term 15% &middot; Multi-agency framework up to
              15%.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
              Minimums
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Monitoring $2,500/mo &middot; Event $7,500/event &middot; Analyst-reviewed
              $10,500/event.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Imagery Pass-Through                                               */
/* ------------------------------------------------------------------ */

function ImagerySection() {
  const { ref, visible } = useReveal();

  return (
    <section id="imagery" className="border-t border-border py-20 md:py-28" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Imagery
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Imagery is pass-through, not markup
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Bring your own imagery contract, or let YardWatch procure at provider cost plus a 15%
          procurement fee. Sentinel-2 is always free.
        </p>

        <div
          className={[
            "mt-10 overflow-hidden rounded-2xl border border-border transition-all duration-500",
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          ].join(" ")}
        >
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border bg-muted/30 px-5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Source
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Archive
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Tasking
            </span>
          </div>

          {[
            { source: "Sentinel-2 (10 m)", archive: "Open data", tasking: "\u2014" },
            { source: "3 m commercial", archive: "Subscription / quota", tasking: "Subscription / quota" },
            { source: "50 cm (SkySat class)", archive: "from $10/km\u00B2", tasking: "from $12/km\u00B2" },
            { source: "30 cm (WorldView class)", archive: "from $22.50/km\u00B2", tasking: "from $32.50/km\u00B2" },
          ].map((row, index) => (
            <div
              key={row.source}
              className={[
                "grid grid-cols-[1fr_1fr_1fr] px-5 py-3",
                index > 0 ? "border-t border-border" : "",
              ].join(" ")}
            >
              <span className="text-xs font-medium text-foreground">{row.source}</span>
              <span className="text-xs text-muted-foreground">{row.archive}</span>
              <span className="text-xs text-muted-foreground">{row.tasking}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */

function CtaSection() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-sidebar-primary/20 bg-sidebar-primary/[0.03] px-8 py-14 text-center md:px-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 50% 0%, oklch(0.79 0.152 193 / 0.08), transparent)",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-md text-2xl font-semibold tracking-tight">
              Ready to scope your deployment?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Tell us your region, portfolio size, and response SLA.
              We&apos;ll send back a tailored proposal within 48 hours.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg">Request a Proposal</Button>
              <Link to="/dashboard">
                <Button variant="outline" size="lg">View Live Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-sidebar-primary">
            <span className="text-[7px] font-bold tracking-tight text-sidebar-primary-foreground">
              YW
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            YardWatch &middot; Disaster damage intelligence
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/50">
          All prices in USD &middot; Imagery pass-through at provider cost + 15%
        </p>
      </div>
    </footer>
  );
}
