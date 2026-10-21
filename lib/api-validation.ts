export class InvalidInput extends Error {}

export async function readObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try { body = await request.json(); } catch { throw new InvalidInput('Request body must be valid JSON'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InvalidInput('Request body must be an object');
  return body as Record<string, unknown>;
}

export function text(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new InvalidInput(`${name} must be a non-empty string`);
  return value.trim();
}

export function txType(value: unknown): 'income' | 'expense' {
  if (value !== 'income' && value !== 'expense') throw new InvalidInput("type must be 'income' or 'expense'");
  return value;
}

export function amount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new InvalidInput('amount must be a positive finite number');
  return value;
}

export function limit(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new InvalidInput('monthlyLimit must be a non-negative finite number or null');
  return value;
}

export function color(value: unknown): string {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new InvalidInput('color must be a six-digit hex color');
  return value;
}

export function note(value: unknown): string | null {
  if (value !== null && typeof value !== 'string') throw new InvalidInput('note must be a string or null');
  return value;
}

export function date(value: unknown): Date {
  // Accept a calendar date or an ISO timestamp. Reject rollover dates such as February 30.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$)/.test(value)) throw new InvalidInput('date must be a calendar date or ISO timestamp');
  const calendar = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  const parsed = new Date(value);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== value.slice(0, 10) || !Number.isFinite(parsed.getTime())) throw new InvalidInput('date is invalid');
  return parsed;
}

export function inputError(error: unknown): Response {
  if (error instanceof InvalidInput) return Response.json({ error: error.message }, { status: 400 });
  // Database outages and programming errors must remain server errors, not misleading 404s.
  throw error;
}
