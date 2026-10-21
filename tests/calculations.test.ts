import assert from "node:assert/strict";
import { test } from "node:test";
import { categorySpend, formatDate, isInMonth, monthBounds, monthlySummary, monthlyTrend } from "../lib/calculations";
import type { TransactionDTO } from "../lib/types";

const ref = new Date("2026-01-15T12:00:00Z");
function tx(id: string, amount: number, type: "income" | "expense", date: string, categoryId = "food"): TransactionDTO {
  return { id, amount, type, date, categoryId, note: null };
}

test("month membership includes its UTC start and excludes the next month", () => {
  const bounds = monthBounds(ref);
  assert.equal(bounds.start.toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(isInMonth("2026-01-01T00:00:00Z", ref), true);
  assert.equal(isInMonth("2026-01-31T23:59:59.999Z", ref), true);
  assert.equal(isInMonth("2026-02-01T00:00:00Z", ref), false);
  assert.equal(isInMonth("2025-12-31T23:59:59.999Z", ref), false);
});

test("offset dates are assigned by the UTC instant across the year boundary", () => {
  assert.equal(isInMonth("2026-01-01T00:30:00+02:00", ref), false);
  assert.equal(isInMonth("2025-12-31T23:30:00-02:00", ref), true);
});

test("leap February includes February 29 and stops at March 1", () => {
  const leap = new Date("2024-02-15T12:00:00Z");
  assert.equal(isInMonth("2024-02-29T23:59:59Z", leap), true);
  assert.equal(isInMonth("2024-03-01T00:00:00Z", leap), false);
});

test("monthly totals exclude neighboring months and allow a negative balance", () => {
  const rows = [tx("a", 100, "income", "2026-01-01T00:00:00Z"), tx("b", 125, "expense", "2026-01-20T00:00:00Z"), tx("c", 999, "income", "2026-02-01T00:00:00Z")];
  assert.deepEqual(monthlySummary(rows, ref), { income: 100, expenses: 125, balance: -25 });
  assert.deepEqual(monthlySummary([], ref), { income: 0, expenses: 0, balance: 0 });
});

test("budget totals preserve zero-spend categories and distinguish zero from no limit", () => {
  const categories = [
    { id: "food", name: "Food", color: "#000000", type: "expense", monthlyLimit: 100 },
    { id: "travel", name: "Travel", color: "#111111", type: "expense", monthlyLimit: null },
    { id: "other", name: "Other", color: "#222222", type: "expense", monthlyLimit: 0 },
    { id: "salary", name: "Salary", color: "#333333", type: "income", monthlyLimit: null },
  ];
  const rows = [tx("a", 40, "expense", "2026-01-02T00:00:00Z"), tx("b", 70, "expense", "2026-01-03T00:00:00Z"), tx("c", 500, "income", "2026-01-02T00:00:00Z", "salary"), tx("d", 900, "expense", "2025-12-31T00:00:00Z")];
  assert.deepEqual(categorySpend(rows, categories, ref).map(c => [c.categoryId, c.spent, c.limit]), [["food", 110, 100], ["travel", 0, null], ["other", 0, 0]]);
});

test("trend crosses December to January and includes months with no transactions", () => {
  const rows = [tx("a", 200, "income", "2025-12-15T00:00:00Z"), tx("b", 25, "expense", "2026-01-05T00:00:00Z")];
  assert.deepEqual(monthlyTrend(rows, 3, ref), [
    { month: "2025-11", label: "Nov", income: 0, expenses: 0 },
    { month: "2025-12", label: "Dec", income: 200, expenses: 0 },
    { month: "2026-01", label: "Jan", income: 0, expenses: 25 },
  ]);
});

test("display preserves the stored UTC calendar day", () => {
  assert.equal(formatDate("2026-01-01T00:00:00Z"), "1/1/2026");
});
