# VAi Frontend

Next.js (App Router) + TypeScript frontend for the task Kanban board
(`/tasks`) and the polygon image annotation tool (`/annotate`), talking to
the Django REST API in `../backend`.

## Stack

- Node v24.15.0 / npm 11.12.1
- Next.js 16.2 (App Router, Turbopack)
- TypeScript, Tailwind CSS v4
- TanStack React Query — server state (tasks, images, annotations)
- Zustand — client state (auth token, selected date), kept deliberately
  separate from server state
- `@dnd-kit` — Kanban drag-and-drop (react-beautiful-dnd is unmaintained)
- `react-konva` + `use-image` — polygon annotation canvas
- `date-fns`, `axios`

## Setup

The backend must be running first (see `../backend/README.md`) — this app
expects it at `http://localhost:8000`.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. You'll be redirected to `/login`; sign in with
the seeded demo account:

**demo@demo.com / DemoPass123!**

`NEXT_PUBLIC_API_URL` (in `.env.local`) points at the backend and defaults to
`http://localhost:8000`.

## Structure

```
app/            routes: /login, /tasks, /annotate (+ AuthGuard'd layouts)
components/     auth/ layout/ shared/ tasks/ annotate/
lib/api/        thin fetch wrappers per resource + the axios client/interceptors
lib/hooks/      React Query hooks per resource
store/          authStore (persisted), dateStore
types/          shared TS types mirroring the API contract
```

`DateSelector` only reads/writes `dateStore`; it has no knowledge of tasks.
`useTasksQuery` is the sole bridge — it reads the selected date internally
and uses it as the React Query cache key, so the two stay decoupled while
still staying in sync.

`/annotate` is a **scrollable feed**: every uploaded image renders as its own
`ImageCanvas` card stacked in a scrollable column, so you scroll through all
images at once and draw polygons directly on any of them. Each card is fully
self-contained — its own Konva stage, its own drawing/selection state, its
own annotations query keyed by image id, and its own "Remove image" control —
so the cards don't interfere with each other.

## Verifying it works

- `npm run build` — type-checks, lints, and produces a production build.
- `npm run lint` — ESLint (React hooks rules included).
- Manual pass: log in → add a task → drag it between columns → switch the
  date and confirm the empty state → reload and confirm the drag persisted →
  go to `/annotate` → upload a few images and confirm they all stack in the
  scrollable feed → draw a polygon on one image and a different one on another
  → delete a specific polygon with "Delete selected" → reload and confirm each
  image kept its own polygons in the right place.

## Difficulties along the way

**This exact Next.js version has real breaking changes.** The scaffolded
project ships its own `AGENTS.md` warning that App Router conventions may
differ from training data (e.g. `params`/`searchParams` are now `Promise`s).
Before writing routes I read the bundled docs in
`node_modules/next/dist/docs/01-app/` rather than assuming the "classic" App
Router API — this project doesn't use dynamic segments so it wasn't a huge
factor, but it changed how I approached the root page redirect and layout
props.

**Tailwind v4 has no `tailwind.config.ts`.** Custom design tokens (the
priority colors, the brand color) now live in `app/globals.css` under an
`@theme` block instead of a JS config object. Took a moment to realize the
scaffold hadn't "forgotten" the config file — v4 just moved it into CSS.

**`TaskCard` needed to be both clickable and draggable.** dnd-kit's
`useSortable` attaches pointer listeners to the whole card, which by default
eats the click needed to open the edit modal. Fixed with a `PointerSensor`
`activationConstraint: { distance: 8 }` on the `DndContext`, so small
movements resolve as a click and only a real drag (>8px) starts a sort.

**react-konva can't run during SSR.** Konva needs a real `<canvas>`, which
doesn't exist on the server. `ImageCanvas` is loaded via `next/dynamic` with
`ssr: false` from the `/annotate` page rather than imported directly.

**Headlessly verifying drag-and-drop and canvas drawing.** dnd-kit uses
pointer events rather than native HTML5 drag events, so Playwright's
`dragTo()` doesn't trigger it — had to simulate a real
`mouse.down → mouse.move (multiple steps) → mouse.up` sequence instead. Also
hit a subtle bug while scripting the polygon-drawing test: a click's
computed y-coordinate landed just past the bottom of the browser viewport,
so the click silently missed everything and the point was never added —
fixed by sizing the test viewport to fit the whole canvas before clicking.

**JWT refresh.** Went with a reactive refresh-on-401 axios response
interceptor (attempt the request, refresh once on a 401, retry, otherwise
log out) instead of a background timer that proactively refreshes before
expiry — simpler, keeps all the auth logic in one interceptor, and is more
than sufficient at this scale.
