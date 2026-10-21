import { prisma } from '@/lib/db';
import * as validate from '@/lib/api-validation';
import type { Prisma } from '@/generated/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await validate.readObject(request);
    const data: Prisma.TransactionUncheckedUpdateInput = {};
    if (body.amount !== undefined) data.amount = validate.amount(body.amount);
    if (body.type !== undefined) data.type = validate.txType(body.type);
    if (body.categoryId !== undefined) data.categoryId = validate.text(body.categoryId, 'categoryId');
    if (body.note !== undefined) data.note = validate.note(body.note);
    if (body.date !== undefined) data.date = validate.date(body.date);
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'transaction not found' }, { status: 404 });
    const category = await prisma.category.findUnique({ where: { id: body.categoryId === undefined ? existing.categoryId : data.categoryId as string } });
    const type = body.type === undefined ? existing.type : data.type;
    if (!category || category.type !== type) throw new validate.InvalidInput('category must exist and match transaction type');
    return Response.json(await prisma.transaction.update({ where: { id }, data, include: { category: true } }));
  } catch (error) { return validate.inputError(error); }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const deleted = await prisma.transaction.deleteMany({ where: { id } });
  return deleted.count ? Response.json({ ok: true }) : Response.json({ error: 'transaction not found' }, { status: 404 });
}
