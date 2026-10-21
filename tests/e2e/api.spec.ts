import { test, expect } from '@playwright/test';

test('category and transaction CRUD persist, and category deletion cascades', async ({ request }) => {
  const created = await request.post('/api/categories', { data: { name: 'API groceries', type: 'expense', monthlyLimit: 300 } });
  expect(created.status()).toBe(201);
  const category = await created.json();
  const tx = await request.post('/api/transactions', { data: { amount: 42.5, type: 'expense', categoryId: category.id, date: '2026-10-01', note: 'Synthetic test' } });
  expect(tx.status()).toBe(201);
  const transaction = await tx.json();
  expect((await request.patch(`/api/transactions/${transaction.id}`, { data: { amount: 50, note: null } })).status()).toBe(200);
  const listed = await (await request.get('/api/transactions')).json();
  expect(listed.find((t: { id: string }) => t.id === transaction.id)).toMatchObject({ amount: 50, note: null, category: { name: 'API groceries' } });
  expect((await request.patch(`/api/categories/${category.id}`, { data: { name: 'Updated groceries', monthlyLimit: null } })).status()).toBe(200);
  expect((await request.delete(`/api/categories/${category.id}`)).status()).toBe(200);
  const after = await (await request.get('/api/transactions')).json();
  expect(after.some((t: { id: string }) => t.id === transaction.id)).toBe(false);
});

for (const route of ['categories', 'transactions']) {
  test(`${route}: malformed and non-object JSON return 400`, async ({ request }) => {
    for (const path of [`/api/${route}`, `/api/${route}/missing`]) {
      for (const body of ['{', 'null', '[]', '42']) {
        const res = await request.fetch(path, { method: path.endsWith('/missing') ? 'PATCH' : 'POST', data: Buffer.from(body), headers: { 'Content-Type': 'application/json' } });
        expect(res.status(), `${path}: ${body}`).toBe(400);
      }
    }
  });
  test(`${route}: missing records return 404`, async ({ request }) => {
    const data = route === 'categories' ? { name: 'Missing' } : { amount: 10 };
    expect((await request.patch(`/api/${route}/missing`, { data })).status()).toBe(404);
    expect((await request.delete(`/api/${route}/missing`)).status()).toBe(404);
  });
}

test('categories reject invalid values on create and update without changing data', async ({ request }) => {
  const base = { name: 'Validation category', type: 'expense', color: '#64748b', monthlyLimit: 100 };
  const category = await (await request.post('/api/categories', { data: base })).json();
  try {
    for (const invalid of [{ name: '  ' }, { name: 1 }, { color: 4 }, { color: 'red' }, { monthlyLimit: -1 }, { monthlyLimit: '20' }]) {
      expect((await request.post('/api/categories', { data: { ...base, ...invalid } })).status()).toBe(400);
      expect((await request.patch(`/api/categories/${category.id}`, { data: invalid })).status()).toBe(400);
    }
    const cats = await (await request.get('/api/categories')).json();
    expect(cats.find((c: { id: string }) => c.id === category.id)).toMatchObject(base);
  } finally { await request.delete(`/api/categories/${category.id}`); }
});

test('income categories never acquire an expense budget', async ({ request }) => {
  const category = await (await request.post('/api/categories', { data: { name: 'API salary', type: 'income', monthlyLimit: 100 } })).json();
  try {
    expect(category.monthlyLimit).toBeNull();
    const changed = await request.patch(`/api/categories/${category.id}`, { data: { monthlyLimit: 200 } });
    expect((await changed.json()).monthlyLimit).toBeNull();
  } finally { await request.delete(`/api/categories/${category.id}`); }
});

test('transactions reject invalid dates, values and category/type mismatches on create and update', async ({ request }) => {
  const category = await (await request.post('/api/categories', { data: { name: 'API expense', type: 'expense' } })).json();
  const base = { amount: 20, type: 'expense', categoryId: category.id, date: '2026-10-01', note: 'Original' };
  const tx = await (await request.post('/api/transactions', { data: base })).json();
  try {
    for (const invalid of [{ amount: 0 }, { amount: -1 }, { amount: '5' }, { date: 'not-a-date' }, { date: '2026-02-30' }, { date: null }, { note: {} }, { categoryId: 'missing' }, { categoryId: 7 }, { type: 'income' }]) {
      expect((await request.post('/api/transactions', { data: { ...base, ...invalid } })).status(), JSON.stringify(invalid)).toBe(400);
      expect((await request.patch(`/api/transactions/${tx.id}`, { data: invalid })).status(), JSON.stringify(invalid)).toBe(400);
    }
    const transactions = await (await request.get('/api/transactions')).json();
    expect(transactions.find((t: { id: string }) => t.id === tx.id)).toMatchObject({ amount: 20, note: 'Original', type: 'expense' });
    expect((await request.delete(`/api/transactions/${tx.id}`)).status()).toBe(200);
  } finally { await request.delete(`/api/categories/${category.id}`); }
});
