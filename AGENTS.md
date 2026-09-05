# AGENTS.md

How to work in this repo. The **what to build** lives in `.local/v1.md` — read it
before you plan anything. This file is the **how**.

Loggo is a self-hosted note app for engineers. A day is a board; you drop Logs
onto it all day. Runs as a Docker container for real use, and as a read-only
demo on Cloudflare Workers.

---

## Golden rules

Break these and the design stops working. If a task seems to need it, stop and ask.

1. **Hono owns every data path.** No database access in Server Components or
   Server Actions. The UI talks to `/api/*` and nothing else.
2. **`src/server/domain/` is pure.** Never import `fs`, `node:*`, or
   `cloudflare:workers` there. Platform contact goes through `Db` and `Storage`.
3. **Always `await` queries.** `better-sqlite3` is sync, D1 is async. Code above
   the adapter must not know which one it got.
4. **One permission check, one place.** Membership is checked in middleware.
   Never inline a workspace check inside a route handler.
5. **shadcn first.** Write a custom component only when shadcn has none.
6. **A Log's `day` is set once.** It never changes, so its file never moves.
7. **Loggo never runs git.** The markdown mirror is written; committing is the
   user's job.
8. **No feature from the "not in v1" list.** See the end of this file.

---

## Layout

```
src/app/**                  UI. React, shadcn, sidebar-07 layout
src/app/api/[[...route]]/   Hono mounted here (hono/vercel adapter)
src/server/routes/**        Hono route modules, one per resource
src/server/domain/**        pure logic: parsing, permissions, mirror writer
src/server/adapters/**      db + storage adapters (the only platform code)
src/server/db/schema.ts     Drizzle schema — single source of truth
src/server/db/migrations/   generated + hand-written SQL, committed
```

New code goes in the deepest layer that can hold it. Business logic belongs in
`domain`, not in a route handler and not in a component.

---

## Naming

Use the spec's words exactly, everywhere — tables, types, routes, components,
variables:

**Log · Day · Task · Tag · Attachment · Workspace · User**

Never `note`, `memo`, `entry`, or `item`. If you catch one, rename it.

- Files: kebab-case (`log-card.tsx`, `parse-tags.ts`), matching shadcn.
- React components: PascalCase (`LogCard`), one main component per file.
- DB tables: snake_case plural (`workspace_members`). TS types: PascalCase
  singular (`WorkspaceMember`).
- IDs: **ULID** via the `ulid` package. Never autoincrement integers — IDs end up
  in filenames and must sort by time.

---

## Data layer

- `schema.ts` is the source of truth. Change it, then generate a migration with
  drizzle-kit.
- **Migrations are immutable once committed.** Fix a mistake with a new one.
- The FTS5 virtual table and its sync triggers live in a **hand-written**
  migration — Drizzle can't express virtual tables. Keep the table and its
  triggers in the same file.
- FTS5 uses the `unicode61` tokenizer, not the default `ascii`.
- Deletes are soft. Every read filters `deleted_at IS NULL`. Put that in one
  shared query helper so it can't be forgotten.

---

## API

- One route module per resource. Mount them all on a single Hono app.
- **Validate every input with zod** at the route edge. Types flow outward from
  the schema, never the other way.
- Throw typed domain errors; map them to HTTP status codes in one error handler.
- Read-only mode (the Workers demo) is **one middleware that rejects mutations**.
  Never enforce it by hiding buttons in the UI.
- Export the Hono `AppType` so the frontend gets typed calls through `hc`.

---

## Storage and the mirror

- Everything file-shaped goes through the `Storage` interface:
  `put` / `get` / `delete` / `list`.
- Keys are paths: `workspaces/<slug>/YYYY/MM/DD/<ulid>-<slug>.md`.
- **Mirror writes happen after the DB commit, never inside the transaction.**
  A failed mirror write sets `mirror_dirty = 1` and is retried in the
  background. It must never fail the user's save.
- Every `.md` file carries full frontmatter. The frontmatter is what makes the
  directory a real backup — if you add a field to `logs`, decide whether
  `loggo rebuild` needs it, and if so, write it to frontmatter too.

---

## Frontend

- **Keep pages uncrowded.** If something feels busy, move it into a menu,
  popover, or right-click menu. This is a product rule, not a preference.
- Data fetching: TanStack Query calling the typed Hono client. No fetch calls
  scattered in components.
- Server Components render layout and shell only. Anything with data is a client
  component.
- No extra state library. TanStack Query plus React state until something
  genuinely forces more.
- The editor is CodeMirror 6. Add features as extensions, don't fork the setup.

---

## Testing

- **Vitest for `domain`.** These are pure functions and easy to test — cover
  them properly.
- **The parser is the highest-risk code.** Every rule gets a fixture that fails
  without it. Cover at minimum: `#` inside fenced code blocks, `#` in inline
  code, hex colors, nested checkboxes, unicode tags, all due-date formats.
- **Integration tests hit real Hono routes** against a temp SQLite file.
- **Permissions get their own test file.** A user must never read another
  workspace. Add a case there whenever you add a route.
- **The rebuild test is load-bearing**: create Logs → wipe the DB →
  `loggo rebuild` → data comes back identical. It is what makes the portability
  promise true rather than a claim.
- Playwright only for paths that must never break: log in, create a Log, search
  for it, tick a task.

---

## Adding a feature

1. Read the relevant part of `.local/v1.md`. Build what it says.
2. Schema change? Edit `schema.ts`, generate a migration, commit both.
3. Logic goes in `domain` as pure functions, with unit tests.
4. Expose it through a Hono route with zod validation and a permission check.
5. Build the UI from shadcn components against the typed client.
6. If it touches Logs, check whether the mirror writer and `loggo rebuild`
   need to know about it.
7. Done means: tests pass, typecheck passes, lint passes.

Both build targets must keep working. If you reach for a Node API, put it behind
an adapter or you have just broken the Workers demo.

---

## Not in v1 — do not add

- Git integration of any kind
- Public sharing, public links, per-Log visibility
- Real-time collaboration
- Mobile app
- Import from other note apps
- Notifications and reminders

If a task seems to need one of these, say so and stop. Don't build it quietly.

---

## Commits

Short, imperative, scoped: `logs: keep day fixed on edit`. One logical change per
commit. Migrations ship in the same commit as the schema change that needs them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
