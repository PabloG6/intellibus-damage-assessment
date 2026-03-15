# YardWatch Pricing Sheet

Draft pricing for government, insurance, and utility buyers.

All commercial terms below are in `USD`. For Jamaica-side budget planning, a useful reference point is recent Bank of Jamaica weighted average sell rates in early 2026 of roughly `J$157-J$158` per `US$1`.

## Pricing Logic

YardWatch should not be priced as "imagery resale only." The product has four billable layers:

1. `Platform`: dashboard, API, alerting, address enrichment, queueing, retention.
2. `Analytics`: damage detection overlays, prioritization, clustering, and reporting.
3. `Response`: faster turnaround, analyst QA, and event-operations support.
4. `Imagery pass-through`: third-party satellite collection or archive acquisition when open data is not sufficient.

Recommended commercial stance:

- Keep `platform + analytics` as YardWatch revenue.
- Keep `imagery` as pass-through or `cost + 15% procurement fee`.
- Use `event activation fees` to monetize surge response.
- Use `granularity` and `liveliness` as the two main pricing levers.

## Deliverable Ladder

This is the practical deliverable stack the pricing is based on.

| Level | Typical imagery source | Spatial granularity | Availability / liveliness | What the customer can realistically do |
| --- | --- | --- | --- | --- |
| Regional watch | Sentinel-2 open data | `10m` | nominal `5-day` revisit | detect flood extent, landslide scars, burn areas, regional change, weather-linked risk zones |
| Portfolio watch | PlanetScope ARPS or similar | `3m` | near-daily stack | monitor neighborhoods, commercial parcels, large roof-loss clusters, claim portfolio exposure |
| Property triage | SkySat archive or equivalent | `50cm` | archive often same-day; tasking available | inspect individual buildings, compounds, substations, road segments, and corridor obstructions at triage level |
| Critical site response | Maxar / WorldView class imagery | `30cm` | archive or high-priority tasking | high-confidence review of critical facilities, shelters, substations, ports, hospitals, and premium insured properties |

### Important reality check

- `10m` is for `regional situational awareness`, not individual home claims.
- `3m` is for `portfolio and neighborhood monitoring`, not precise roof adjudication.
- `50cm` is the first level that is credible for `property triage`.
- `30cm` is stronger for high-value assets and government command workflows, but it is still not a substitute for physical inspection when a claim or outage decision requires proof-grade verification.
- For `downed poles`, satellite is useful for corridor triage, access obstruction, flooding, and damage hotspots. It is not the best final verification tool for every pole or conductor. That should be sold separately as aerial/drone or field validation.

## Liveliness Bands

| Band | Definition | Typical turnaround |
| --- | --- | --- |
| `Historical` | archive search, retrospective analysis, one-off reports | `2-5 business days` |
| `Monitored` | recurring updates as imagery is published | `24-48 hours after image availability` |
| `Event-driven` | activated when a storm, flood, quake, or wildfire triggers an ops workflow | `same day to 24 hours after usable imagery is available` |
| `Rapid response` | retained standby plus premium tasking / expedited processing | `6-12 hours after imagery delivery`, depending on cloud and provider constraints |

## Granularity Bands

| Band | Resolution target | Best fit |
| --- | --- | --- |
| `Regional` | `10m` | governments, basin monitoring, islandwide risk overlays |
| `Portfolio` | `3m` | insurers, broker books, municipal district watch, utility territory watch |
| `Property / Corridor` | `50cm` | building-level triage, corridor obstruction triage, substation campus review |
| `Critical asset` | `30cm` | emergency command, premium insured sites, critical public assets, VIP utilities assets |

## Core Pricing Matrix

These are YardWatch software and operations prices. Imagery is separate unless marked as open data.

| Tier | Liveliness | Granularity | Included scope | YardWatch price |
| --- | --- | --- | --- | --- |
| `Pulse` | Monitored | Regional (`10m`) | up to `5,000 km²`, weekly change layers, weather/alert overlays, dashboard, CSV/PDF exports | `$2,500/month` |
| `Watch` | Monitored | Portfolio (`3m`) | up to `2,500 km²` or `25,000 named locations`, prioritized queue, address enrichment, API export | `$7,500/month` plus imagery |
| `Detail` | Event-driven | Property / Corridor (`50cm`) | one activated event, up to `500 km²` or `10,000 locations`, claim/restoration triage queue, analyst summary | `$7,500/event` plus imagery |
| `Command` | Rapid response | Critical asset (`30cm`) | retained priority lane, one activated event, up to `250 km²` or `2,500 critical sites`, premium turnaround and command brief | `$15,000/event` plus imagery |

## Standby Retainers

For buyers who want the system warm before a storm.

| Retainer | What it does | Price |
| --- | --- | --- |
| `Event Ready` | pre-load AOIs, assets, addresses, dashboards, and playbooks for one named region or portfolio | `$3,500/month` |
| `Priority Ops` | includes Event Ready plus priority queueing, executive briefing template, and extended retention | `$8,500/month` |

Recommended usage:

- `Pulse` usually does not need a retainer.
- `Watch` can stand alone or pair with `Event Ready`.
- `Detail` should usually pair with `Event Ready`.
- `Command` should usually pair with `Priority Ops`.

## Imagery Pass-Through Guidance

Use public marketplace prices as your floor, not your sales price.

Indicative public imagery references:

- `Sentinel-2`: open data, no imagery charge.
- `3m` commercial monitoring: usually quoted under annual subscription or usage quota rather than simple public per-km² list pricing.
- `SkyWatch archive`:
  - medium resolution starts at `$2.50/km²`
  - `50cm` starts at `$10/km²`
  - `30cm` starts at `$22.50/km²`
- `SkyWatch tasking`:
  - `50cm` starts at `$12/km²`
  - `30cm` starts at `$32.50/km²`

Commercial guidance:

- If the customer has its own imagery contract, charge `platform + analytics + response` only.
- If YardWatch is procuring imagery, bill `provider cost + 15%` procurement fee.
- For very small AOIs, pass through the `provider minimum area charge`.

## Segment Packages

### Government

#### 1. Parish / Municipality Watch

- Best fit: local government, ODPEM-style regional coordination, planning agencies.
- Product mix: `Pulse`
- Price: `$2,500/month` per parish-equivalent program
- Good for:
  - flood and landslide watch
  - road access and district-level impact maps
  - shelter, school, clinic, and public-building prioritization

#### 2. National Resilience Ops

- Best fit: national disaster office, ministries, central emergency coordination.
- Product mix: `Watch` + `Event Ready`
- Price: `$11,000/month` plus imagery
- Good for:
  - islandwide monitoring
  - district-level prioritization
  - command dashboards
  - executive and donor reporting

#### 3. Emergency Command Burst

- Best fit: post-hurricane emergency activation.
- Product mix: `Command` + `Priority Ops`
- Price: `$15,000/event` plus imagery and retainer
- Good for:
  - named critical facilities
  - shelters, hospitals, ports, bridges, substations
  - rapid ministerial briefings

### Private Insurance Brokers / Carriers / TPAs

#### 1. Portfolio Watch

- Best fit: broker books, carriers, MGAs, catastrophe planning teams.
- Product mix: `Watch`
- Price: `$7,500/month` plus imagery
- Included commercial unit:
  - up to `25,000 insured locations`
  - or `2,500 km²` footprint
- Good for:
  - pre-event exposure watch
  - post-event triage queues
  - address-level claim prioritization

#### 2. CAT Claim Triage

- Best fit: named storm or flood response.
- Product mix: `Detail`
- Price: `$7,500/event` plus imagery
- Recommended overage:
  - `+$0.35` per property above `10,000`
- Good for:
  - same-day claim intake prioritization
  - field adjuster routing
  - broker/client briefing packs

#### 3. High-Value Property Review

- Best fit: premium homes, commercial property schedules, resorts, industrial risks.
- Product mix: `Command`
- Price: `$15,000/event` plus imagery
- Good for:
  - VIP or high-sum-insured assets
  - reinsurer reporting
  - board / executive claim briefings

### Private Utility Companies

#### 1. Territory Risk Watch

- Best fit: distribution utilities, telecom tower operators, water utilities.
- Product mix: `Watch`
- Price: `$8,500/month` plus imagery
- Included commercial unit:
  - up to `1,500 km²`
  - or `500 linear km` of priority corridors
- Good for:
  - flood and landslide risk near corridors
  - substation and plant monitoring
  - vegetation or access-risk trend watch

#### 2. Storm Restoration Burst

- Best fit: post-storm outage operations.
- Product mix: `Detail`
- Price: `$9,500/event` plus imagery
- Good for:
  - corridor triage
  - blocked-access detection
  - flooded substations and damaged compounds
  - prioritizing where to send field crews first

#### 3. Critical Infrastructure Rush

- Best fit: substations, water plants, generation sites, fiber hubs, command centers.
- Product mix: `Command`
- Price: `$18,000/event` plus imagery
- Good for:
  - highest-priority assets
  - executive outage situation reports
  - regulator or board-level briefings

## Add-Ons

| Add-on | Price | Notes |
| --- | --- | --- |
| Extra named locations | `$0.03/location/month` | for portfolio monitoring above included limits |
| Extra critical assets | `$0.75/asset/month` | for government or utility named-asset programs |
| Address enrichment refresh | `$0.05/location/month` | if refreshed beyond included cadence |
| API + webhook access | `$1,500/month` | machine-to-machine delivery |
| Analyst-reviewed event brief | `$3,000/event` | human QA and executive summary |
| White-label client report pack | `$1,000/event` | broker / insurer / ministry branded PDF pack |
| Data retention > 12 months | `$750/month` | compliance and audit support |
| On-site command support | custom | travel and staffing separate |

## Discount Guidance

Use discounts sparingly. Prefer term and volume trade-offs.

- Annual prepay: `10%`
- Two-year term: `15%`
- Multi-agency government framework: up to `15%`
- Multi-country broker / carrier / utility portfolio: custom
- Do not discount `event activation` below minimums unless imagery is customer-supplied and response SLA is relaxed.

## Minimums

Set hard commercial minimums so small jobs do not consume the team.

- Monitoring minimum: `$2,500/month`
- Event minimum: `$7,500/event`
- Analyst-reviewed event minimum: `$10,500/event`
- Custom tasking procurement minimum: pass-through minimum plus YardWatch event fee

## How To Sell It

### Government

Lead with:

- faster islandwide or parish-level damage visibility
- prioritization of roads, shelters, and critical facilities
- better use of limited field teams

Avoid leading with:

- individual-home claim language

### Insurance

Lead with:

- claim triage
- routing adjusters faster
- reducing manual map review
- treating imagery as an operations input, not a research product

Avoid leading with:

- raw imagery procurement

### Utilities

Lead with:

- restoration prioritization
- corridor obstruction and access risk
- flood / landslide exposure around critical assets

Avoid overclaiming:

- pole-by-pole proof from satellite alone

## Recommended Price Positioning

If you want one clean commercial story:

- `Government`: start at `$2.5k-$11k/month`, burst to `$15k+` per event
- `Insurance`: start at `$7.5k/month`, burst to `$7.5k-$15k+` per event
- `Utilities`: start at `$8.5k/month`, burst to `$9.5k-$18k+` per event

That range is credible because it sits above open-data-only dashboards, below large custom geospatial programs, and leaves room to absorb real high-resolution imagery costs when a storm hits.

## Source Anchors

These numbers are grounded in publicly documented deliverables and pricing references:

- Copernicus Sentinel-2: `10m` bands and `5-day` constellation revisit.
- PlanetScope ARPS: `3m` analysis-ready product and near-daily stacks.
- Planet SkySat: `50cm` orthorectified products and up to `10x daily` revisit.
- Maxar / WorldView class imagery: `30cm` collection and very high revisit for rapidly changing areas.
- SkyWatch public pricing: archive and tasking rates for `50cm` and `30cm` imagery.
- Bank of Jamaica average exchange rates for local-budget normalization.
- 
## Sources

- Sentinel-2 handbook: [Copernicus](https://sentinels.copernicus.eu/documents/247904/685211/Sentinel-2_User_Handbook)
- Sentinel-2 revisit: [Copernicus S2 Mission](https://sentiwiki.copernicus.eu/web/s2-mission)
- PlanetScope ARPS: [Planet Docs](https://docs.planet.com/data/imagery/arps/)
- PlanetScope fleet background: [Planet Docs](https://docs.planet.com/data/imagery/planetscope/)
- SkySat: [Planet Docs](https://docs.planet.com/data/imagery/skysat/)
- Maxar optical imagery: [Maxar](https://maxar.com/maxar-intelligence/products/optical-imagery)
- WorldView Legion: [Maxar](https://maxar.com/worldview-legion)
- SkyWatch public data pricing: [SkyWatch](https://skywatch.com/data-pricing/)
- Bank of Jamaica FX rates: [BOJ Average Exchange Rates](https://boj.org.jm/market/foreign-exchange/average-exchange-rates/)
