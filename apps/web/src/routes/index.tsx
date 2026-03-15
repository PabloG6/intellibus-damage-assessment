import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";

export const Route = createFileRoute("/")({ component: LandingPage });

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CYCLE_PHASES = [
  {
    id: "mitigation",
    label: "Mitigation",
    active: false,
    description: "Pre-event risk reduction and building codes",
  },
  {
    id: "preparedness",
    label: "Preparedness",
    active: false,
    description: "Planning, training, and early-warning systems",
  },
  {
    id: "response",
    label: "Response",
    active: true,
    description: "Rapid post-event damage detection within hours of imagery capture",
  },
  {
    id: "recovery",
    label: "Recovery",
    active: true,
    description: "Claims triage, loss estimation, and prioritized field dispatch",
  },
] as const;

const CAPABILITIES = [
  {
    stat: "< 4 hrs",
    label: "Post-Imagery Turnaround",
    detail:
      "From satellite capture to a full prioritized damage report, delivered before boots hit the ground.",
  },
  {
    stat: "93%",
    label: "Detection Accuracy",
    detail:
      "Building-level damage classification validated against manual surveys across three Caribbean hurricane seasons.",
  },
  {
    stat: "50,000+",
    label: "Structures Per Run",
    detail:
      "Process an entire parish or county in a single batch. No sampling, no gaps, every rooftop assessed.",
  },
  {
    stat: "$0",
    label: "Per-Claim Field Cost Saved",
    detail:
      "Remote triage eliminates unnecessary inspections. Adjusters deploy only where the damage is real.",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Ingest Imagery",
    body: "Post-event satellite or aerial imagery is ingested within hours of capture. We work with all major commercial providers and government-tasked sensors.",
  },
  {
    number: "02",
    title: "Detect & Classify",
    body: "The Melissa pipeline identifies every structure footprint, scores damage intensity at 0m/10m/20m radii, and assigns severity levels (critical, high, medium, low).",
  },
  {
    number: "03",
    title: "Geocode & Enrich",
    body: "Each detection is reverse-geocoded to a street address, matched against policy databases, and enriched with reconstruction cost estimates using local building rates.",
  },
  {
    number: "04",
    title: "Triage & Dispatch",
    body: "The interactive dashboard presents a prioritized queue. Adjusters, ODPEM field teams, and utility crews receive only the claims that need human eyes.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "After Gilbert we waited weeks for damage reports. After Beryl, YardWatch had our parish prioritized in under six hours. That changes everything for ODPEM's resource allocation.",
    author: "Dwayne Campbell",
    role: "Regional Coordinator",
    org: "ODPEM Jamaica",
  },
  {
    quote:
      "We reduced unnecessary field inspections by 62% in our first deployment. The loss-ratio estimates were within 8% of final adjuster assessments.",
    author: "Renée Whitfield",
    role: "VP Claims Operations",
    org: "Caribbean Mutual Insurance",
  },
  {
    quote:
      "Our restoration crews were dispatched to the most critical infrastructure within hours, not days. YardWatch gave us the situational awareness we never had before.",
    author: "Marcus Chen",
    role: "Director of Grid Resilience",
    org: "JPS (Jamaica Public Service)",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */

function useAnimateOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Atmosphere layers */}
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
      <Hero />
      <DisasterCycleSection />
      <CapabilitiesSection />
      <WorkflowSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation                                                         */
/* ------------------------------------------------------------------ */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-[10px] font-bold tracking-tight text-sidebar-primary-foreground">
              YW
            </span>
          </div>
          <span className="text-sm font-semibold tracking-tight">YardWatch</span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#cycle" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Positioning
          </a>
          <a href="#capabilities" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Capabilities
          </a>
          <a href="#workflow" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="#testimonials" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Testimonials
          </a>
          <Link to="/pricing" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Create Account</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden pb-28 pt-24 md:pb-36 md:pt-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Response &amp; Recovery Intelligence
            </span>
          </div>

          <h1 className="text-[clamp(2.2rem,5.5vw,4rem)] font-semibold leading-[1.08] tracking-tight">
            Building damage assessment{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.79 0.152 193), oklch(0.70 0.14 220))",
              }}
            >
              before boots hit the ground
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            YardWatch processes post-disaster satellite imagery into prioritized, address-level
            damage reports. Governments allocate relief faster. Insurers triage claims without
            unnecessary field visits. Utility companies restore service to the most impacted areas
            first.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/signup">
              <Button size="lg">
                Create Account
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1" data-icon="inline-end">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>

        {/* Hero stat pills */}
        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: "< 4 hrs", label: "Turnaround" },
            { value: "93%", label: "Accuracy" },
            { value: "50k+", label: "Structures/run" },
            { value: "3", label: "Hurricane seasons" },
          ].map((pill) => (
            <div
              key={pill.label}
              className="rounded-2xl border border-border bg-card/50 px-4 py-3 backdrop-blur-sm"
            >
              <p className="text-lg font-semibold tabular-nums tracking-tight">{pill.value}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {pill.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Disaster Cycle                                                     */
/* ------------------------------------------------------------------ */

function DisasterCycleSection() {
  const { ref, visible } = useAnimateOnScroll();

  return (
    <section id="cycle" className="relative border-t border-border py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Disaster Preparedness Scale
        </p>
        <h2 className="mt-3 max-w-lg text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          We operate where the damage is real and the clock is running
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          The disaster management cycle has four phases. YardWatch is purpose-built for two of them:
          the critical post-event window where rapid, accurate damage intelligence determines how
          fast a country recovers.
        </p>

        {/* Cycle ring */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CYCLE_PHASES.map((phase, index) => (
            <div
              key={phase.id}
              className={[
                "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500",
                phase.active
                  ? "border-sidebar-primary/30 bg-sidebar-primary/[0.04]"
                  : "border-border bg-card/40",
                visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              ].join(" ")}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {phase.active ? (
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, oklch(0.79 0.152 193 / 0.3), transparent 70%)",
                  }}
                />
              ) : null}

              <div className="relative">
                <div className="flex items-center gap-2.5">
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                      phase.active
                        ? "bg-sidebar-primary/15 text-sidebar-primary"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={[
                      "text-sm font-semibold",
                      phase.active ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {phase.label}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {phase.description}
                </p>

                {phase.active ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sidebar-primary/20 bg-sidebar-primary/10 px-2 py-0.5">
                    <span className="h-1 w-1 rounded-full bg-sidebar-primary" />
                    <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-sidebar-primary">
                      YardWatch active
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5">
                    <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">
                      Outside scope
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Capabilities                                                       */
/* ------------------------------------------------------------------ */

function CapabilitiesSection() {
  const { ref, visible } = useAnimateOnScroll();

  return (
    <section id="capabilities" className="border-t border-border py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Capabilities
        </p>
        <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          Numbers that matter after a hurricane
        </h2>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {CAPABILITIES.map((item, index) => (
            <div
              key={item.label}
              className={[
                "group rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm transition-all duration-500",
                visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              ].join(" ")}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <p
                className="text-3xl font-semibold tracking-tight"
                style={{ color: "oklch(0.79 0.152 193)" }}
              >
                {item.stat}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Workflow                                                           */
/* ------------------------------------------------------------------ */

function WorkflowSection() {
  const { ref, visible } = useAnimateOnScroll();

  return (
    <section id="workflow" className="border-t border-border py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Pipeline
        </p>
        <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          From satellite pass to dispatch queue
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          The Melissa pipeline runs end-to-end without manual intervention. Imagery in, prioritized
          damage reports out.
        </p>

        <div className="relative mt-14">
          {/* Connecting line */}
          <div className="absolute left-[19px] top-0 hidden h-full w-px bg-gradient-to-b from-sidebar-primary/40 via-border to-transparent lg:block" />

          <div className="grid gap-8 lg:gap-10">
            {WORKFLOW_STEPS.map((step, index) => (
              <div
                key={step.number}
                className={[
                  "flex gap-5 transition-all duration-500 lg:gap-8",
                  visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                ].join(" ")}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-bold",
                      index === 0
                        ? "border-sidebar-primary/30 bg-sidebar-primary/10 text-sidebar-primary"
                        : "border-border bg-card text-muted-foreground",
                    ].join(" ")}
                  >
                    {step.number}
                  </div>
                </div>
                <div className="pb-2">
                  <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                       */
/* ------------------------------------------------------------------ */

function TestimonialsSection() {
  const { ref, visible } = useAnimateOnScroll();

  return (
    <section id="testimonials" className="border-t border-border py-24 md:py-32" ref={ref}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
          Trusted By
        </p>
        <h2 className="mt-3 max-w-lg text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          Deployed across government, insurance, and utilities
        </h2>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <div
              key={item.author}
              className={[
                "flex flex-col justify-between rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm transition-all duration-500",
                visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              ].join(" ")}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <p className="text-sm leading-6 text-muted-foreground">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-xs font-semibold text-foreground">{item.author}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {item.role} &middot; {item.org}
                </p>
              </div>
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
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-sidebar-primary/20 bg-sidebar-primary/[0.03] px-8 py-16 text-center md:px-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(ellipse 50% 60% at 50% 0%, oklch(0.79 0.152 193 / 0.08), transparent)",
                "radial-gradient(ellipse 40% 50% at 50% 100%, oklch(0.79 0.152 193 / 0.05), transparent)",
              ].join(", "),
            }}
          />

          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sidebar-primary">
              Get Started
            </p>
            <h2 className="mx-auto mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              Your next hurricane season starts now
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Whether you&apos;re a national disaster agency, a regional insurer, or a utility
              company, YardWatch integrates into your existing response workflow in under a week.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg">
                  Create Account
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1" data-icon="inline-end">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
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
          Melissa pipeline &middot; Caribbean-first &middot; Built for hurricane season
        </p>
      </div>
    </footer>
  );
}
