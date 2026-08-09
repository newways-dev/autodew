# Autodew

*Started as a build-along from a Code With Antonio course; grown well past that starting point since — the multiplayer canvas, plan gating, live run console, session replay, and most of the node executors are custom work layered on top of the original scaffold.*

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Deployed on Railway](https://img.shields.io/badge/deployed-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://autodew-app.up.railway.app/)

A visual, multiplayer workflow builder for AI-driven browser automation. Users
compose a graph of steps — open a page, click, extract data, observe the DOM,
hand control to an autonomous agent, send an email — on a collaborative canvas,
and Autodew runs it as a durable background job against a real cloud browser,
streaming each step's status back to the UI live.

It's aimed at the gap between "write a Playwright script" and "click around a
no-code tool that can't reason about a page": steps are described in plain
language and executed by an AI browser-automation engine, runs survive past the
length of a normal HTTP request and keep going after the tab is closed, and the
canvas itself is a shared document multiple people can edit at once.

**Live demo:** [autodew-app.up.railway.app](https://autodew-app.up.railway.app/) (sign-up required — auth is handled by Clerk)

## 💡 Why I built this

Three pieces of this were genuinely interesting engineering problems, not just
API integrations. **Real-time multiplayer state**: the canvas has to stay
consistent across concurrent editors without a bespoke CRDT layer, so the
graph itself — nodes, edges, field values — lives inside a Liveblocks room
instead of a database row. **Durable execution that outlives a request**: a
workflow run can take far longer than an HTTP round trip and has to survive a
closed tab, so runs are modeled as Trigger.dev tasks with their own retry and
metadata-streaming semantics, not `async` route handlers. **AI-driven browser
control**: rather than hand-writing brittle selectors, each step is a
plain-language instruction resolved at run time by Stagehand against a real
cloud browser — which also means step outputs aren't fully known until
they've actually executed, which shapes how the interpolation and validation
logic had to be written. Getting those three to work together — a live graph,
a durable executor, and a step whose result is only knowable at run time — is
what most of the custom code on top of the original course project is about.

## ✨ Key Features

- 🧩 **Visual node-based workflow builder** on a [React Flow](https://reactflow.dev)
  canvas, with typed step nodes: `Open URL`, `Act`, `Extract`, `Observe`,
  `Agent`, and `Send Email`, each with its own editable fields and declared
  outputs. Building an automation feels like sketching a flowchart, not
  writing a script.
- 👥 **Real-time multiplayer editing** — the canvas is backed by a
  [Liveblocks](https://liveblocks.io) room per workflow, so multiple users can
  move nodes, edit fields, and connect edges on the same graph concurrently,
  with live cursors and presence avatars. Two people can design the same
  automation together without stepping on each other's changes.
- 🤖 **AI browser automation** via [Stagehand v3](https://github.com/browserbase/stagehand)
  running against a [Browserbase](https://www.browserbase.com) cloud browser —
  `act`/`extract`/`observe` for targeted steps and a full autonomous `agent`
  mode for open-ended instructions. Steps are described in plain English
  instead of CSS selectors, so a small site redesign doesn't quietly break
  every workflow.
- ♻️ **Durable background execution** — a run is a [Trigger.dev](https://trigger.dev)
  task, not a request handler: it topologically sorts the graph (with cycle
  detection), walks connected nodes in dependency order, and keeps running
  independent of the browser tab, with automatic retries on failure. Kick off
  a run, close the laptop, come back to a finished result.
- 📡 **Live run console** — each step's status (`pending` → `running` →
  `done`/`failed`), duration, and output streams to the UI in real time via
  Trigger.dev's realtime metadata, subscribed with a workflow-scoped public
  access token; past runs stay browsable in a history panel. You watch a run
  happen step by step instead of waiting on a spinner and hoping.
- 🔗 **Output interpolation between steps** — a `{{nodeId.path}}` templating
  syntax lets a later step's fields reference an earlier step's output (e.g.
  feed an `Extract` result into a `Send Email` body). Steps compose instead
  of each one running in isolation.
- 🎥 **Session replay** — each run's Browserbase browser session is recorded and
  played back in the console as an HLS video (via `hls.js`), proxied through a
  server route that never exposes the Browserbase API key to the client. When
  a run fails, you can actually watch what the browser did instead of
  guessing from logs.
- ✅ **Graph validation** — exactly one `Start` trigger, no cycles, and no
  dangling/unconnected runs, checked client-side before a run is attempted and
  re-checked server-side before the graph is persisted. Bad graphs get caught
  before they burn a run.
- 🏢 **Multi-tenant organizations** via Clerk, with workflows scoped to the active
  organization end-to-end (queries, mutations, and the background task all
  take `orgId`). Teams keep their own workflows separate by default.
- 🔒 **Plan-gated features** via Clerk Billing — the `Agent` node and session
  replay require a Pro organization plan, enforced in the server action and API
  route (not just hidden in the UI), so a non-Pro org can't reach either by
  calling the endpoint directly.
- ✉️ **Transactional email** as a first-class workflow step, sent through Resend.
- 🐞 **Error tracking & structured logging** with Sentry, instrumented across both
  the Next.js app and the Trigger.dev background tasks, with source maps
  uploaded at build time.

## 🧰 Tech stack

| Layer                       | Choice                                                                                                 | Why                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧱 Framework                | Next.js 16 (App Router), React 19, TypeScript                                                          | Server Actions handle workflow mutations (create/delete/run) directly, no separate API layer needed for those                                                                                              |
| 🌐 Browser automation       | [Stagehand v3](https://github.com/browserbase/stagehand) + [Browserbase](https://www.browserbase.com) | AI-driven `act`/`extract`/`observe`/`agent` primitives run against a real, disposable cloud browser instead of a brittle selector-based script                                                             |
| ♻️ Background execution     | [Trigger.dev v4](https://trigger.dev)                                                                  | Runs need to outlive a serverless request, retry on failure, and keep executing after the client disconnects — plus its realtime metadata API drives the live step console without a bespoke pub/sub layer |
| 👥 Realtime collaboration   | [Liveblocks](https://liveblocks.io) (`@liveblocks/react-flow`)                                         | Off-the-shelf CRDT sync, presence, and cursors for the canvas, rather than building multiplayer sync from scratch                                                                                          |
| 🗺️ Canvas                   | [`@xyflow/react`](https://reactflow.dev) (React Flow)                                                  | Node/edge graph rendering, connections, and layout                                                                                                                                                         |
| 🔐 Auth & billing           | [Clerk](https://clerk.com) (+ Clerk Billing)                                                           | Multi-tenant organizations and plan gating (`has({ plan: 'pro' })`) come built in, checked server-side everywhere a Pro feature is reachable                                                               |
| 🗄️ Database                 | [Neon](https://neon.tech) (serverless Postgres) + [Drizzle ORM](https://orm.drizzle.team)              | HTTP driver works from Server Components and the edge; workflow graphs are stored as a single `jsonb` column mirroring React Flow's own shape                                                              |
| ✉️ Email                    | [Resend](https://resend.com)                                                                           | Transactional email as a workflow action                                                                                                                                                                   |
| 🐞 Observability            | [Sentry](https://sentry.io) (`@sentry/nextjs`, `@sentry/node`)                                         | Error tracking and structured logs across both the web app and the Trigger.dev worker, with source maps uploaded via an esbuild plugin                                                                     |
| 🎨 UI                       | Tailwind CSS v4, shadcn/ui, Radix/Base UI                                                              | Accessible primitives, styled to match                                                                                                                                                                     |
| 🎬 Session replay playback  | `hls.js`                                                                                                | Plays Browserbase's HLS session recordings client-side                                                                                                                                                     |
| 🔢 Graph ordering           | `toposort`                                                                                              | Orders nodes by their edges before execution and detects cycles up front                                                                                                                                   |

## 🏗️ Architecture / how it works

**Editing.** Each workflow's canvas state (nodes, edges, field values) lives in
a Liveblocks room keyed by the workflow's id — that's the live, multiplayer
copy everyone edits. Nothing is written to Postgres on every keystroke.

**Running.** Clicking Run:

1. A Server Action (`runWorkflowAction`) reads the current graph out of the
   Liveblocks room, checks the Agent-node/Pro-plan gate, validates the graph
   (`validateGraph` — exactly one Start node, no cycles, no empty graph), and
   persists it to Postgres as the workflow's canonical snapshot.
2. It triggers the `run-workflow` Trigger.dev task, tagged `workflow:<id>`,
   and returns the run handle.
3. The task loads the persisted graph, keeps only nodes touching an edge
   (orphaned nodes are skipped), and topologically sorts them with `toposort`.
4. It opens one Browserbase session (via Stagehand), lazily, on the first
   browser step, and reuses it for every subsequent step so the whole run is
   one continuous recording.
5. Each node runs through its executor (`open-url`, `act`, `extract`,
   `observe`, `agent`, or `send-email`), with `{{nodeId.path}}` placeholders in
   its fields resolved from upstream nodes' outputs first.
6. After every state change the task publishes the full step list (id, type,
   status, duration, output/error) to the run's realtime metadata, so the UI
   never has to poll.

**Watching.** The dashboard mints a workflow-scoped Trigger.dev public access
token server-side and subscribes to it with `useRealtimeRunsWithTag`. The
console renders live and historical runs from that one subscription — the
latest run's steps come from its streaming metadata while it's in flight, and
from its final output once it completes. A finished run also carries its
Browserbase session id, which a replay panel uses to fetch and stream back the
recording as HLS, proxied through a server route so the Browserbase API key
never reaches the browser.

## ⚙️ Installation & local setup

```bash
# install dependencies
npm install

# apply the Drizzle schema to your database
npm run db:migrate

# start the Next.js dev server
npm run dev

# in a separate terminal, start the Trigger.dev dev worker
npx trigger.dev dev
```

The app expects a `.env.local` file with the variables listed below. `npm run dev`
starts Next.js on `http://localhost:3000`; workflow runs won't execute unless
the Trigger.dev dev worker is also running.

Other scripts:

```bash
npm run build         # production build
npm run start         # run the production build
npm run lint          # eslint
npm run format        # prettier --write
npm run typecheck     # tsc --noEmit
npm run db:generate   # generate a Drizzle migration from schema changes
npm run db:studio     # open Drizzle Studio against the configured database
```

## 🔐 Environment variables

No `.env.example` is committed; these are the variables read across the app
(`.env.local` for local development):

```
# Clerk (auth & billing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=

# Neon / Postgres
DATABASE_URL=
DATABASE_URL_UNPOOLED=
NEON_BRANCH=

# Trigger.dev
TRIGGER_SECRET_KEY=

# Liveblocks
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=

# Browserbase / Stagehand
BROWSERBASE_API_KEY=

# Resend
RESEND_API_KEY=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

## 📁 Project structure

```
app/
  (auth)/                  Clerk sign-in, sign-up, and org selection routes
  (dashboard)/
    workflows/[id]/        The workflow editor page
  api/
    liveblocks/auth/       Mints Liveblocks room tokens
    replays/[sessionId]/   Proxies a Browserbase session recording as HLS
features/workflows/
  actions.ts                Server Actions: create/delete/run/cancel a workflow
  data.ts                    Postgres reads/writes for workflows (org-scoped)
  components/                Canvas, run console, inspector, replay player, ...
  nodes/
    node-registry.ts         The node type manifest (fields, outputs, icon)
    node-executors.ts         Maps node type -> executor function
    act.ts / extract.ts / observe.ts / agent.ts / open-url.ts / send-email.ts
  tasks/run-workflow.ts       The Trigger.dev task that executes a graph
  lib/
    validate-graph.ts         Structural checks (single trigger, no cycles)
    interpolate.ts             {{nodeId.path}} templating between steps
lib/
  db/schema.ts                Drizzle schema (workflows table, JSONB graph)
  browserbase.ts, liveblocks.ts, resend.ts   Server-only SDK clients
drizzle/                      Generated SQL migrations
```
