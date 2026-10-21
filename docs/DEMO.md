# Budgeteer: a short portfolio walkthrough

Allow about 45 seconds for the recorded tour, or two minutes when explaining the code. Use synthetic records in a fresh, disposable SQLite database. This prototype has no login or account isolation; do not expose a write-enabled instance with personal data.

## Set up the scene

Follow the root README to install dependencies, generate Prisma and migrate a new database. On the Budgets page, add these categories:

| Category | Type | Monthly limit | Example transaction |
| --- | --- | --- | --- |
| Demo salary | Income | None | 3,200 |
| Groceries | Expense | 350 | 180 |
| Housing | Expense | 1,000 | 850 |

Use dates in the current UTC month. These illustrative amounts are synthetic; they do not represent the author's finances. The optional seed command is destructive to its target database, so only use it on a database created for the demo.

## Recording sequence

1. **Dashboard (5 seconds):** introduce income, expenses and balance. Expected starting figures are 3,200, 1,030 and 2,170.
2. **Transactions (12 seconds):** add a 42.50 Groceries expense with the note `Demo: fresh produce`.
3. **Edit (6 seconds):** change that transaction to 45 and save. The data persists in SQLite.
4. **Budgets (5 seconds):** show Groceries spending of 225 against a 350 monthly limit.
5. **Reports (5 seconds):** show category spending and the monthly trend.
6. **Dashboard (5 seconds):** finish with expenses of 1,075 and balance of 2,125.

Record the actual application at a desktop viewport, keeping labels and numbers readable. Let charts settle before changing pages.

## Engineering talking points

- Server-rendered pages and route handlers share data access and calculation logic.
- Validation rejects invalid input and enforces transaction/category type agreement.
- `npm test` checks date and money-total calculations; `npm run test:e2e` checks real HTTP writes plus browser CRUD against an isolated temporary database.
- Production work would require authentication, per-user data, a decimal money policy and reliable persistent storage.

The browser regression suite covers creation, editing, deletion and reload persistence. This short video is a presentation, not evidence of complete test coverage.
