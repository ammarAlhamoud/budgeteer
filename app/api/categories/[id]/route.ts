import { prisma } from '@/lib/db';
import * as validate from '@/lib/api-validation';
import type { Prisma } from '@/generated/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await validate.readObject(request);
    const data: Prisma.CategoryUpdateInput = {};
    if (body.name !== undefined) data.name = validate.text(body.name, 'name');
    if (body.color !== undefined) data.color = validate.color(body.color);
    if (body.monthlyLimit !== undefined) data.monthlyLimit = validate.limit(body.monthlyLimit);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'category not found' }, { status: 404 });
    if (body.monthlyLimit !== undefined && existing.type === 'income') data.monthlyLimit = null;
    return Response.json(await prisma.category.update({ where: { id }, data }));
  } catch (error) { return validate.inputError(error); }
}

// The existing cascade contract removes transactions belonging to the category.
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const deleted = await prisma.category.deleteMany({ where: { id } });
  return deleted.count ? Response.json({ ok: true }) : Response.json({ error: 'category not found' }, { status: 404 });
}
