# Budgeteer — income, expenses and monthly budgets

A local budgeting prototype for recording transactions, setting expense-category limits and reviewing monthly spending. Built with **Next.js, TypeScript, Prisma and SQLite**.

**Deutsch:** Ein lokaler Prototyp zur Verwaltung von Einnahmen, Ausgaben und monatlichen Kategorienbudgets.

## Explore

| View | Purpose |
| --- | --- |
| Dashboard | Monthly income, expenses, balance and charts |
| Transactions | Create, edit and delete income and expense records |
| Budgets | Manage categories and monthly expense limits |
| Reports | Spending by category and monthly trends |

The repository is named `claude-code-demo`; **Budgeteer** is the application name. Coding-agent guidance is in [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md). The application does not integrate an LLM.

## Run locally

Use Node.js **24 LTS** and npm. Run commands from the repository root.

```sh
git clone https://github.com/ammarAlhamoud/claude-code-demo.git
cd claude-code-demo
npm ci
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`; macOS/Linux: `cp .env.example .env`). The example points to a disposable local SQLite database.

```sh
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open [localhost:3000](http://localhost:3000). Optionally run `npx prisma db seed` **only against a disposable demo database**: it deletes existing transactions and categories before inserting examples.

Build and start with `npm run build` and `npm start`. The layout downloads Google fonts during builds, which requires network access. A deployed server needs a writable, persistent filesystem for SQLite.

## Architecture and decisions

- Server pages call [lib/data.ts](lib/data.ts), which converts records to DTOs and serializes dates.
- Client managers write through [route handlers](app/api), then refresh server-rendered data.
- [lib/calculations.ts](lib/calculations.ts) separates monthly summaries and category totals from React and database code.
- Month boundaries and displayed dates use UTC. An exclusive next-month boundary prevents counting a transaction twice.
- [The Prisma schema](prisma/schema.prisma) relates categories to transactions. Deleting a category also deletes its transactions.

## Verify

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Generate the Prisma client before type checking. The calculation suite covers month boundaries, offsets, leap years, empty months, negative balances and category limits. [CI](.github/workflows/verify.yml) runs it in UTC, Europe/Berlin and America/Los_Angeles. These domain tests do not establish API, browser or deployment correctness.

## Current boundaries

- Single shared database; no authentication or account isolation. Use synthetic demonstration data.
- Money uses floating-point numbers. Production use needs an explicit minor-unit/decimal and rounding policy.
- Currency display is USD with an English locale.
- POST and PATCH validation is not yet consistent. Malformed input, missing category references and transaction/category type agreement need integration tests and hardening.
- No bank connection, payment execution or financial advice.
- No project-wide license file is included.

## Next steps

1. Add route-level regression tests and consistent validation.
2. Add a browser test covering a category, transaction and resulting budget.
3. Record a reproducible demo and document deployment constraints.
