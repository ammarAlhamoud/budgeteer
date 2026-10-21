"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/calculations";
import type { CategoryDTO, CategorySpend, TxType } from "@/lib/types";

type Props = {
  categories: CategoryDTO[];
  spend: CategorySpend[];
};

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#16a34a",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

function progressColor(ratio: number) {
  if (ratio >= 1) return "bg-rose-500";
  if (ratio >= 0.8) return "bg-amber-400";
  return "bg-indigo-500";
}

export default function BudgetsManager({ categories, spend }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<TxType>("expense");
  const [limit, setLimit] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const spendByCat = new Map(spend.map((s) => [s.categoryId, s]));
  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");

  async function refresh() {
    router.refresh();
  }

  async function updateLimit(id: string, value: string) {
    const parsed = value === "" ? null : parseFloat(value);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) return;
    setBusy(true);
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyLimit: parsed }),
    });
    setBusy(false);
    refresh();
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a category name.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        type,
        color,
        monthlyLimit: type === "expense" && limit ? parseFloat(limit) : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Could not create category.");
      return;
    }
    setName("");
    setLimit("");
    refresh();
  }

  async function deleteCategory(id: string, catName: string) {
    if (!confirm(`Delete "${catName}"? Its transactions will also be removed.`))
      return;
    setBusy(true);
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setBusy(false);
    refresh();
  }

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      {/* Expense budgets */}
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-sm font-medium text-gray-500">
            Expense budgets
          </h2>
          <ul className="space-y-5">
            {expenseCats.map((c) => {
              const s = spendByCat.get(c.id);
              const spent = s?.spent ?? 0;
              const ratio = c.monthlyLimit ? spent / c.monthlyLimit : 0;
              return (
                <li key={c.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: c.color }}
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-sm text-gray-400">
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-gray-200">/</span>
                      <input
                        aria-label={`${c.name} monthly limit`}
                        type="number"
                        min="0"
                        step="10"
                        defaultValue={c.monthlyLimit ?? ""}
                        onBlur={(e) => updateLimit(c.id, e.target.value)}
                        placeholder="—"
                        className="w-20 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-right text-sm tabular-nums text-gray-700 focus:border-indigo-400 focus:bg-white focus:outline-none"
                      />
                      <button
                        onClick={() => deleteCategory(c.id, c.name)}
                        className="text-gray-300 transition-colors hover:text-rose-500"
                        aria-label="Delete"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M2 2l10 10M12 2L2 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        c.monthlyLimit ? progressColor(ratio) : "bg-gray-200"
                      }`}
                      style={{
                        width: c.monthlyLimit
                          ? `${Math.min(ratio * 100, 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  {c.monthlyLimit != null && ratio >= 1 && (
                    <p className="mt-1 text-xs text-rose-500">
                      Over by {formatCurrency(spent - c.monthlyLimit)}
                    </p>
                  )}
                </li>
              );
            })}
            {expenseCats.length === 0 && (
              <p className="text-sm text-gray-400">No expense categories yet.</p>
            )}
          </ul>
        </div>

        {incomeCats.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-gray-500">
              Income categories
            </h2>
            <ul className="flex flex-wrap gap-2">
              {incomeCats.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: c.color }}
                  />
                  {c.name}
                  <button
                    onClick={() => deleteCategory(c.id, c.name)}
                    className="text-gray-300 transition-colors hover:text-rose-500"
                    aria-label="Delete"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M1 1l10 10M11 1L1 11" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add category */}
      <form
        onSubmit={addCategory}
        className="h-fit space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-medium text-gray-500">New category</h2>

        <div className="flex rounded-lg border border-gray-200 p-0.5">
          {(["expense", "income"] as TxType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ${
                type === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="category-name" className="mb-1.5 block text-xs font-medium text-gray-500">
            Name
          </label>
          <input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="e.g. Subscriptions"
          />
        </div>

        {type === "expense" && (
          <div>
            <label htmlFor="category-limit" className="mb-1.5 block text-xs font-medium text-gray-500">
              Monthly limit
            </label>
            <input
              type="number"
              id="category-limit"
              min="0"
              step="10"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className={inputCls}
              placeholder="Optional"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ring-2 ring-offset-1 transition ${
                  color === c ? "ring-indigo-500" : "ring-transparent"
                }`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          Add category
        </button>
      </form>
    </div>
  );
}
