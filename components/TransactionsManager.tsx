"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/calculations";
import type { CategoryDTO, TransactionDTO, TxType } from "@/lib/types";

type Props = {
  initialTransactions: TransactionDTO[];
  categories: CategoryDTO[];
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function TransactionsManager({
  initialTransactions,
  categories,
}: Props) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");

  const categoriesForType = categories.filter((c) => c.type === type);

  function resetForm() {
    setEditingId(null);
    setType("expense");
    setAmount("");
    setCategoryId("");
    setDate(todayIso());
    setNote("");
  }

  async function reload() {
    const res = await fetch("/api/transactions");
    setTransactions(await res.json());
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert("Please enter a positive amount.");
      return;
    }
    if (!categoryId) {
      alert("Please pick a category.");
      return;
    }
    setBusy(true);
    const payload = { amount: amt, type, categoryId, date, note: note || null };
    const url = editingId
      ? `/api/transactions/${editingId}`
      : "/api/transactions";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Something went wrong.");
      return;
    }
    resetForm();
    await reload();
  }

  function startEdit(t: TransactionDTO) {
    setEditingId(t.id);
    setType(t.type);
    setAmount(String(t.amount));
    setCategoryId(t.categoryId);
    setDate(t.date.slice(0, 10));
    setNote(t.note ?? "");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    setBusy(true);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setBusy(false);
    if (editingId === id) resetForm();
    await reload();
  }

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="h-fit space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-medium text-gray-500">
          {editingId ? "Edit transaction" : "New transaction"}
        </h2>

        {/* Type toggle */}
        <div className="flex rounded-lg border border-gray-200 p-0.5">
          {(["expense", "income"] as TxType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setCategoryId("");
              }}
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
          <label htmlFor="transaction-amount" className="mb-1.5 block text-xs font-medium text-gray-500">
            Amount
          </label>
          <input
            type="number"
            id="transaction-amount"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls}
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="transaction-category" className="mb-1.5 block text-xs font-medium text-gray-500">
            Category
          </label>
          <select
            id="transaction-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            {categoriesForType.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="transaction-date" className="mb-1.5 block text-xs font-medium text-gray-500">
            Date
          </label>
          <input
            type="date"
            id="transaction-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="transaction-note" className="mb-1.5 block text-xs font-medium text-gray-500">
            Note
          </label>
          <input
            type="text"
            id="transaction-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputCls}
            placeholder="Optional"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {editingId ? "Save" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 px-5 py-3.5">
          <h2 className="text-sm font-medium text-gray-500">
            All transactions
            <span className="ml-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
              {transactions.length}
            </span>
          </h2>
        </div>
        {transactions.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No transactions yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: t.category?.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {t.category?.name}
                      {t.note && (
                        <span className="font-normal text-gray-400">
                          {" "}
                          · {t.note}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span
                    className={`tabular-nums text-sm font-medium ${
                      t.type === "income" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                  <button
                    onClick={() => startEdit(t)}
                    className="text-xs text-gray-400 transition-colors hover:text-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-xs text-gray-400 transition-colors hover:text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
