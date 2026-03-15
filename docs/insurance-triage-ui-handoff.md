# Insurance Triage UI Handoff

This document is for the next model that will finish the insurer demo UI. Do not redesign the dashboard from scratch. Keep the current layout, keep the polygon overlay behavior, and make the UI changes narrowly around triage, briefing, and address display.

## Goal

Turn the existing Melissa polygon demo into an insurer-first "Claim Triage Tour" flow:

- one primary `Start Briefing` action
- top 10 damaged homes by severity and damage score
- map flies through each polygon
- popup card is address-first
- sidebar is address-first
- stats are insurer-oriented: `detections`, `priority`, `critical`
- when no address is available, show exactly: `No Information found`

## Important Constraint

The user does not want aggressive UI restyling. Do not make this flashy or decorative. Preserve the current dashboard structure and visual tone.

## Current Backend Status

These backend changes are already in place or partially in place:

- [apps/api/src/incidents.ts](/Users/pepperpotpoppins/nodejs/yardWatch/apps/api/src/incidents.ts)
  - `IncidentSummary` now includes:
    - `address: { formatted, placeId, resolution }`
  - `IncidentsOverview.stats` now includes:
    - `priority`
  - Helper functions already exist for:
    - address normalization
    - overview building
    - priority count

- [packages/db/src/schema.ts](/Users/pepperpotpoppins/nodejs/yardWatch/packages/db/src/schema.ts)
  - `incidents` now has:
    - `formatted_address`
    - `place_id`
    - `address_resolution`
    - `enriched_at`

- [apps/api/src/google-maps.ts](/Users/pepperpotpoppins/nodejs/yardWatch/apps/api/src/google-maps.ts)
  - reverse geocoding helper exists
  - fallback order is:
    - `street_address`
    - `route`
    - `locality`
    - `missing`

- [apps/api/scripts/enrich-incidents.ts](/Users/pepperpotpoppins/nodejs/yardWatch/apps/api/scripts/enrich-incidents.ts)
  - enrichment script exists
  - uses centroid reverse geocoding
  - skips rows with existing address unless `--refresh`

- [apps/api/src/env.ts](/Users/pepperpotpoppins/nodejs/yardWatch/apps/api/src/env.ts)
  - supports `GOOGLE_MAPS_API_KEY`

## Current Frontend Baseline

These files already render the Melissa polygons:

- [apps/web/src/routes/dashboard.index.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes/dashboard.index.tsx)
  - Mapbox source/layers already draw the `MultiPolygon` features
  - selected polygon is already highlighted
  - map already fits dataset and selected incident bounds
  - a React popup card is already anchored above the selected polygon

- [apps/web/src/components/map-sidebar.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/components/map-sidebar.tsx)
  - sidebar exists
  - current content is still centroid-first and generic

- [apps/web/src/lib/incidents.ts](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/lib/incidents.ts)
  - severity formatting helpers exist
  - this file should hold the new triage helper functions

## Required UI Work

### 1. Add helper functions in `apps/web/src/lib/incidents.ts`

Add:

- `BRIEFING_LIMIT = 10`
- `BRIEFING_INTERVAL_MS = 4500`
- `getDisplayAddress(address)`:
  - return `address.formatted ?? "No Information found"`
- `formatAddressResolution(address)`:
  - `street_address -> Street-level`
  - `route -> Road-level`
  - `locality -> Locality`
  - `missing -> No Information found`
- `getRecommendedAction(severity)`:
  - `critical -> Immediate inspection`
  - `high -> Priority inspection`
  - `medium -> Monitor`
  - `low -> Monitor`
- `getBriefingQueue(incidents, limit = 10)`:
  - use the already-sorted incidents list
  - just return `incidents.slice(0, limit)`

Also add a small exported demo script constant if useful for display or documentation.

## 2. Update `dashboard.index.tsx`

Do not change the map rendering architecture. Keep the existing GeoJSON source + fill/line layers.

Add `DashboardPage` state for the briefing flow:

- `selectedIncidentId`
- `selectionSerial`
- `fitExtentSerial`
- `isBriefingActive`
- `briefingIndex`

Derive:

- `briefingQueue = overview ? getBriefingQueue(overview.incidents) : []`
- `selectedIncident`

Behavior:

- clicking a sidebar row or polygon should stop briefing
- `Start Briefing` should:
  - set `briefingIndex` to `0`
  - set `isBriefingActive` to `true`
  - immediately select the first incident in the queue
- while briefing is active:
  - auto-advance every `4500ms`
  - fly to each polygon using the existing selected-incident fitBounds logic
  - stop automatically after the last item

Suggested approach:

```ts
useEffect(() => {
  if (!isBriefingActive || briefingQueue.length === 0) return

  const activeIncident = briefingQueue[briefingIndex]
  if (activeIncident && activeIncident.id !== selectedIncidentId) {
    setSelectedIncidentId(activeIncident.id)
    setSelectionSerial((value) => value + 1)
  }

  const isLast = briefingIndex >= briefingQueue.length - 1
  const timeoutId = window.setTimeout(() => {
    if (isLast) {
      setIsBriefingActive(false)
      return
    }
    setBriefingIndex((value) => value + 1)
  }, BRIEFING_INTERVAL_MS)

  return () => window.clearTimeout(timeoutId)
}, [briefingIndex, briefingQueue, isBriefingActive, selectedIncidentId])
```

Pass new props into the sidebar:

- `onStartBriefing`
- `onStopBriefing`
- `isBriefingActive`
- `briefingIndex`
- `briefingTotal`

### 3. Update the map popup card

The popup card already exists. Do not replace it with a native Mapbox popup.

Change the popup content to be insurer-first:

- eyebrow:
  - `Claim Triage Tour` when briefing is active
  - otherwise `Focused Detection`
- title:
  - `getDisplayAddress(selectedIncident.address)`
- subtitle:
  - `selectedIncident.id`
- severity badge:
  - keep the existing severity color treatment

Add these rows to the card:

- `Queue Rank`
  - only when the selected incident is in the briefing queue
  - example: `3 of 10`
- `Recommended Action`
  - from `getRecommendedAction(severity)`
- `Address Confidence`
  - from `formatAddressResolution(address)`
- `Status`
- `Centroid`

Keep the three metric tiles:

- `Damage`
- `10m Context`
- `Built`

Keep the card anchored to the selected polygon centroid. That part already works.

### 4. Update the stats bar

Change the stats in [apps/web/src/routes/dashboard.index.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes/dashboard.index.tsx):

- `detections -> overview.stats.total`
- `priority -> overview.stats.priority`
- `critical -> overview.stats.bySeverity.critical`

Do not use `damaged` in the top bar anymore.

### 5. Update the sidebar

Edit [apps/web/src/components/map-sidebar.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/components/map-sidebar.tsx) carefully.

Use [packages/ui/src/components/button.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/packages/ui/src/components/button.tsx) for the new briefing action instead of hand-rolled button styling.

#### Dataset section

Add:

- primary button:
  - `Start Briefing`
  - when active, switch to `Stop Briefing`
- secondary button:
  - keep `Fit dataset bounds`
- small helper row:
  - `Top queue: 10 homes`
  - `Priority: {overview.stats.priority}`

#### Detection list rows

For each incident row:

- title can remain `incident.label`
- second line should become:
  - `getDisplayAddress(incident.address)`
- keep severity badge and damage score on the right

Do not show centroid as the row subtitle anymore.

#### Selected detail card

Replace centroid-first details with:

- `Address`
- `Address source`
- `Recommended action`
- `Status`
- `Damage score`
- `10m context`
- `20m context`
- `Built area`
- `Centroid`

If no address is present, show:

- `Address -> No Information found`
- `Address source -> No Information found`

Do not add extra empty-state logic beyond that.

#### Suggested copy

Use concise copy like:

- `Melissa claim triage`
- `Polygon view`
- `Loading prioritized detections from the incidents API.`
- `Pick a detection to inspect the footprint, address match, and inspection priority.`

## Demo Script

Put this into a small markdown file as well if helpful, or export it from `lib/incidents.ts` if the UI needs it:

1. `This Melissa tile contains 508 detected building footprints. YardWatch has already prioritized the highest-risk homes for urgent review.`
2. `The key problem for insurers is that raw model outputs are not operational. Adjusters need to know which homes to inspect first and where those homes are.`
3. `We enrich each damaged footprint with the best available Google-derived address, and when no match exists we label it No Information found.`
4. `When I click Start Briefing, YardWatch walks through the top 10 homes by likely damage, flies to each footprint, and shows the inspection priority.`
5. `That means post-storm imagery becomes a field-ready triage list in minutes instead of a manual map review exercise.`
6. `If we later ingest utility asset data, the same enrichment and briefing pattern can be reused for downed poles and restoration response.`

## Mapbox Notes

Do not change how polygons are drawn.

Current rendering approach is correct:

- GeoJSON source from `overview.featureCollection`
- fill layer by severity color
- outline layer
- selected outline layer
- map click selects polygon
- popup card is positioned with `map.project(selectedIncident.centroid)`

The work here is data presentation and briefing state, not map rendering.

## Acceptance Criteria

The work is complete when all of these are true:

- polygons still render correctly
- clicking a polygon or sidebar row selects it and stops briefing
- `Start Briefing` walks through the top 10 incidents
- the map flies to each polygon
- the popup card updates per incident and stays anchored while panning/zooming
- the sidebar rows are address-first
- missing addresses show `No Information found`
- stats show `detections`, `priority`, `critical`
- no generic infrastructure-failure copy remains

## Verification Commands

Run after the UI changes:

```bash
npm run typecheck --workspace @workspace/api
npm test --workspace @workspace/api
npm run typecheck --workspace web
npm run build --workspace web
```

If a live Google key is present, also run:

```bash
npm run enrich-incidents --workspace @workspace/api
```

If no key is present, the UI should still work and simply display `No Information found` for unresolved addresses.
