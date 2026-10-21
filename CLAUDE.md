# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # start dev server at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint (eslint-config-next)
npx tsc --noEmit   # typecheck (no dedicated script)

npx prisma generate          # regenerate the client into generated/prisma (run after schema edits)
npx prisma migrate dev       # create/apply a migration against the SQLite db
npx prisma db seed           # reset + seed sample data (runs `tsx prisma/seed.ts`)
```

Run `npm test` for domain calculation regressions using Node's test runner through tsx. CI runs these tests in UTC, Europe/Berlin and America/Los_Angeles. These tests do not cover route handlers or the UI; also use `tsc --noEmit`, `npm run lint`, and exercise the running app / API routes.

## Stack & hard constraints

- **Next.js 16** (App Router, Turbopack), **React 19**, **Tailwind v4**, **Recharts 3**.
- **Prisma 7** — this is a major version with breaking changes from older Prisma. Do not assume pre-7 conventions:
  - The schema datasource has **no `url`**; the connection string lives in `prisma.config.ts` (`datasource.url = env("DATABASE_URL")`), loaded from `.env` (`DATABASE_URL="file:./prisma/dev.db"`, gitignored).
- Prisma 7 requires a **driver adapter** — there is no Rust engine. We use `@prisma/adapter-better-sqlite3`. Any `new PrismaClient()` must pass `{ adapter }` (see `lib/db.ts` and `prisma/seed.ts`).
  - The generated client is output to **`generated/prisma`** (not `@prisma/client`); import it as `@/generated/prisma`.
  - The seed command is declared in `prisma.config.ts` (`migrations.seed`), not in `package.json`.
- Path alias: `@/*` → repo root (e.g. `@/lib/db`, `@/components/...`).

## Architecture

Single-DB budgeting app ("Budgeteer"). Two models — `Category` and `Transaction` (1‑to‑many, `onDelete: Cascade`) — with `type` being the string `"income" | "expense"` on both.

**Data flow (read):** server page components (`app/{page,transactions,budgets,reports}/page.tsx`, all `export const dynamic = "force-dynamic"`) call the server-only helpers in **`lib/data.ts`** (`getCategories`, `getTransactions`). Those helpers map Prisma rows to **DTOs** (`lib/types.ts`) and crucially **serialize `Date` → ISO string** so data is safe to hand to client components. Pages compute derived figures with **`lib/calculations.ts`**, then pass DTOs + computed data into client components.

**Data flow (write):** client components (`components/*Manager.tsx`) are the only place mutations happen. They `fetch` the **Route Handlers** under `app/api/{transactions,categories}/...` (POST/PATCH/DELETE), then call `router.refresh()` to re-render the server pages with fresh data. `app/api/transactions/route.ts` GET deliberately reuses `getTransactions()` so the API and SSR return the identical DTO shape.

**Validation lives in the API routes,** not the client. Notably: amounts must be positive finite numbers; dates are parsed and rejected if invalid; and **only `expense` categories may carry a `monthlyLimit`** — both POST and PATCH on categories force the limit to `null` for income categories. Preserve these invariants when editing.

## Date handling (important gotcha)

All month bucketing and date display is done in **UTC**, not local time. Calendar dates entered by the user are stored as UTC midnight, and `lib/calculations.ts` uses `Date.UTC(...)` / `getUTCMonth()` throughout (`monthBounds`, `monthlyTrend`) so month membership is timezone-independent. Display uses `formatDate()` with `timeZone: "UTC"`. When touching anything date-related, stay in UTC or you will reintroduce month-boundary off-by-one bugs.
