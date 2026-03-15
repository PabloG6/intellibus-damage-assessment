# Basic Dashboard Tutorial

This tutorial explains how to build the first dashboard for the YardWatch MVP using:

- TanStack Start
- Tailwind CSS
- `shadcn` components
- the existing shared UI package in this repo

This version is intentionally scoped to a basic dashboard shell. It leaves a large reserved area for the future ArcGIS map, but does not implement the map itself yet.

## Goal

Build a dashboard that includes:

1. A dashboard layout route in TanStack Start
2. A dashboard page route
3. A top header
4. A row of summary cards
5. A large placeholder region for the map
6. A live incident feed panel
7. A selected issue details panel

The dashboard should look like an operations workspace, not a marketing page.

## 1. Understand the current project structure

This repo is a monorepo with two important areas:

### App

`/Users/pepperpotpoppins/nodejs/yardWatch/apps/web`

This contains the TanStack Start application.

### Shared UI package

`/Users/pepperpotpoppins/nodejs/yardWatch/packages/ui`

This contains shared UI components and shared Tailwind/theme styles.

That means `shadcn` components are meant to be imported from the shared UI package rather than from a local `components/ui` folder inside the app.

## 2. Files that already exist

These files are already in place and should be understood before building the dashboard:

- Root route: [/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes/__root.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes/__root.tsx)
- Home route: [/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes/index.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes/index.tsx)
- Router setup: [/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/router.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/router.tsx)
- Existing `shadcn` button: [/Users/pepperpotpoppins/nodejs/yardWatch/packages/ui/src/components/button.tsx](/Users/pepperpotpoppins/nodejs/yardWatch/packages/ui/src/components/button.tsx)
- Global styles and theme tokens: [/Users/pepperpotpoppins/nodejs/yardWatch/packages/ui/src/styles/globals.css](/Users/pepperpotpoppins/nodejs/yardWatch/packages/ui/src/styles/globals.css)
- `shadcn` config: [/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/components.json](/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/components.json)

## 3. Which `shadcn` components already exist

Right now, the only installed shared `shadcn` component is:

- `Button`

Import it like this:

```tsx
import { Button } from "@workspace/ui/components/button"
```

This works because the shared package exports its components through:

`@workspace/ui/components/*`

## 4. Components you should add for the dashboard

To build the dashboard shown in this tutorial, add these `shadcn` components:

- `card`
- `badge`
- `table`
- `separator`
- `skeleton`

Run this from the repo root:

```bash
npx shadcn@latest add card badge table separator skeleton -c apps/web
```

After installation, import them like this:

```tsx
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
```

## 5. How routing works in TanStack Start

This project uses file-based routing.

Every file inside:

`/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes`

becomes a route.

### Existing route files

#### `__root.tsx`

This is the top-level app shell. It defines the document structure and loads the global CSS.

#### `index.tsx`

This is the home page route for `/`.

#### `router.tsx`

This creates the TanStack router from the generated route tree.

You do not manually register pages one by one. TanStack generates the route tree automatically.

## 6. Recommended route structure for the dashboard

Create the dashboard using this structure:

```text
apps/web/src/routes/
  __root.tsx
  index.tsx
  dashboard.tsx
  dashboard.index.tsx
```

### What each file does

- `dashboard.tsx`
  - creates the shared dashboard shell
  - holds the dashboard header and the `<Outlet />`

- `dashboard.index.tsx`
  - renders the main `/dashboard` page content

This structure is better than putting everything into one file because it prepares you for future routes like:

- `/dashboard/reports`
- `/dashboard/settings`
- `/dashboard/incidents`

## 7. Why the dashboard must reserve map space now

This platform is map-first, even if the actual map integration comes later.

So the dashboard should not be built as:

- big table first
- small map later

Instead, it should be built as:

- large map workspace first
- supporting information panel beside it

That way, when ArcGIS is integrated later, the page structure does not need to be redesigned.

## 8. Dashboard layout plan

The page should contain:

1. Dashboard header
2. Summary cards
3. Large map placeholder area
4. Live incident feed
5. Selected issue details

Recommended visual hierarchy:

- top: header
- below header: KPI cards
- main body:
  - left: large map placeholder
  - right: incident feed and issue detail panels

## 9. Tailwind and theme guidance

The shared Tailwind theme is already configured in:

[/Users/pepperpotpoppins/nodejs/yardWatch/packages/ui/src/styles/globals.css](/Users/pepperpotpoppins/nodejs/yardWatch/packages/ui/src/styles/globals.css)

Use semantic classes from that theme instead of random hardcoded colors.

Prefer:

- `bg-background`
- `text-foreground`
- `text-muted-foreground`
- `border-border`
- `bg-muted`
- `bg-card`

Useful layout classes for this dashboard:

- `mx-auto max-w-7xl px-6 py-6`
- `space-y-6`
- `grid gap-4`
- `rounded-xl`
- `border`

## 10. Create the dashboard layout route

Create:

`/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes/dashboard.tsx`

This file should provide the shared dashboard shell and render child routes through `<Outlet />`.

Example:

```tsx
import { Link, Outlet, createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-muted-foreground">YardWatch</p>
            <h1 className="text-xl font-semibold">Disaster Assessment Platform</h1>
          </div>

          <nav className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/dashboard">Operations</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

### Why use a layout route

This prevents repeated dashboard shell markup across multiple dashboard pages.

If you later add more dashboard pages, they can all share the same layout.

## 11. Create the dashboard page route

Create:

`/Users/pepperpotpoppins/nodejs/yardWatch/apps/web/src/routes/dashboard.index.tsx`

This file will render the main dashboard content for `/dashboard`.

## 12. Start with mock data

Before wiring any API or model integration, use static data.

Example:

```tsx
const incidents = [
  {
    id: "INC-1042",
    type: "Bridge Damage",
    severity: "High",
    confidence: "94%",
    location: "Kingston East Corridor",
    source: "YOLO v1",
    time: "2 min ago",
  },
  {
    id: "INC-1043",
    type: "Road Washout",
    severity: "Critical",
    confidence: "97%",
    location: "Portmore Coastal Road",
    source: "YOLO v1",
    time: "4 min ago",
  },
  {
    id: "INC-1044",
    type: "Roof Collapse",
    severity: "Medium",
    confidence: "88%",
    location: "Spanish Town District 3",
    source: "YOLO v1",
    time: "6 min ago",
  },
]
```

This keeps the task focused on layout and component composition.

## 13. Build the page in sections

The easiest way to build the dashboard is section by section.

### Section A: Page heading

This provides the title, description, and a simple action.

Example:

```tsx
<section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
  <div>
    <h2 className="text-2xl font-semibold">Live Operations Dashboard</h2>
    <p className="text-sm text-muted-foreground">
      Monitor infrastructure damage indicators while reserving space for the live map workspace.
    </p>
  </div>

  <Button>Refresh Feed</Button>
</section>
```

### Section B: Summary cards

Use three or four cards.

Suggested metrics:

- total detections
- critical alerts
- areas monitored
- model status

Example:

```tsx
<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <Card>
    <CardHeader>
      <CardTitle>Total Detections</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-semibold">126</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Critical Alerts</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-semibold">19</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Areas Monitored</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-semibold">8</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Model Status</CardTitle>
    </CardHeader>
    <CardContent>
      <Badge variant="secondary">Active</Badge>
    </CardContent>
  </Card>
</section>
```

### Section C: Reserve space for the map

This is the most important structural decision.

Even without ArcGIS, the dashboard should reserve a large central area for the future map.

Example:

```tsx
<Card className="overflow-hidden">
  <CardHeader className="flex flex-row items-start justify-between gap-4">
    <div>
      <CardTitle>Map Workspace</CardTitle>
      <p className="text-sm text-muted-foreground">
        Reserved space for the live ArcGIS map and damage overlays.
      </p>
    </div>
    <Badge variant="secondary">Map Pending</Badge>
  </CardHeader>

  <CardContent>
    <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
      ArcGIS map will be mounted here later
    </div>
  </CardContent>
</Card>
```

This section should feel dominant on desktop.

### Section D: Live incident feed

This panel should sit beside the map area.

Use a `Card` and `Table` to show recent incidents.

Example:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Live Incident Feed</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Severity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {incidents.map((incident) => (
          <TableRow key={incident.id}>
            <TableCell>{incident.id}</TableCell>
            <TableCell>{incident.type}</TableCell>
            <TableCell>
              <Badge variant="secondary">{incident.severity}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### Section E: Selected issue details

This panel gives a focused view of one issue.

Example:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Selected Issue</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <p className="text-sm text-muted-foreground">Issue ID</p>
      <p className="font-medium">INC-1043</p>
    </div>

    <Separator />

    <div>
      <p className="text-sm text-muted-foreground">Infrastructure Type</p>
      <p className="font-medium">Road</p>
    </div>

    <div>
      <p className="text-sm text-muted-foreground">Damage Indicator</p>
      <p className="font-medium">Washout</p>
    </div>

    <div>
      <p className="text-sm text-muted-foreground">Confidence</p>
      <p className="font-medium">97%</p>
    </div>

    <div>
      <p className="text-sm text-muted-foreground">Source</p>
      <p className="font-medium">YOLO v1</p>
    </div>

    <div>
      <p className="text-sm text-muted-foreground">Location</p>
      <p className="font-medium">Portmore Coastal Road</p>
    </div>
  </CardContent>
</Card>
```

## 14. Arrange the map and side panels

The main content grid should reserve most of the width for the future map.

Use:

```tsx
<section className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_420px]">
  <div>
    {/* Map workspace card */}
  </div>

  <div className="space-y-6">
    {/* Live incident feed */}
    {/* Selected issue details */}
  </div>
</section>
```

### Why this layout works

- the map gets visual priority
- the side panel remains easy to scan
- the UI already matches the future ArcGIS-first product shape

## 15. Full example for `dashboard.index.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
})

const incidents = [
  {
    id: "INC-1042",
    type: "Bridge Damage",
    severity: "High",
    confidence: "94%",
    location: "Kingston East Corridor",
    source: "YOLO v1",
    time: "2 min ago",
  },
  {
    id: "INC-1043",
    type: "Road Washout",
    severity: "Critical",
    confidence: "97%",
    location: "Portmore Coastal Road",
    source: "YOLO v1",
    time: "4 min ago",
  },
  {
    id: "INC-1044",
    type: "Roof Collapse",
    severity: "Medium",
    confidence: "88%",
    location: "Spanish Town District 3",
    source: "YOLO v1",
    time: "6 min ago",
  },
]

function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Live Operations Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Monitor infrastructure damage indicators while reserving space for the live map workspace.
          </p>
        </div>
        <Button>Refresh Feed</Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">126</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">19</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas Monitored</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">8</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Active</Badge>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_420px]">
        <div>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Map Workspace</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Reserved space for the live ArcGIS map and damage overlays.
                </p>
              </div>
              <Badge variant="secondary">Map Pending</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
                ArcGIS map will be mounted here later
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Incident Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>{incident.id}</TableCell>
                      <TableCell>{incident.type}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{incident.severity}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Issue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Issue ID</p>
                <p className="font-medium">INC-1043</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Infrastructure Type</p>
                <p className="font-medium">Road</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Damage Indicator</p>
                <p className="font-medium">Washout</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="font-medium">97%</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-medium">YOLO v1</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">Portmore Coastal Road</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
```

## 16. Suggested build order for a beginner

A beginner should build in this exact order:

1. Create the dashboard route files
2. Add the required `shadcn` components
3. Build the page heading
4. Build the summary cards
5. Build the map placeholder card
6. Build the incident feed panel
7. Build the selected issue panel
8. Test responsiveness

This keeps the work simple and bounded.

## 17. Common mistakes to avoid

### Do not import from the wrong place

Wrong:

```tsx
import { Card } from "@/components/ui/card"
```

Correct for this repo:

```tsx
import { Card } from "@workspace/ui/components/card"
```

### Do not hardcode lots of custom colors

Prefer the existing semantic theme classes:

- `text-muted-foreground`
- `bg-background`
- `border-border`

### Do not make the table the dominant element

The map area must remain visually primary.

### Do not start with real data

Use static mock data first. Live data can come later.

### Do not skip the layout route

Use `dashboard.tsx` as the shell so future dashboard pages can reuse it.

## 18. What this tutorial intentionally does not cover

This tutorial does not implement:

- ArcGIS integration
- live map layers
- YOLO API inference
- real-time subscriptions
- filters
- authentication
- persistence

Those belong to later implementation phases.

## 19. Final result you should aim for

By the end of this tutorial, the app should have:

- a `/dashboard` route
- a dashboard shell layout
- summary cards
- a large reserved map area
- a live incident feed
- a selected issue details panel

That is the correct first UI milestone for this project.
