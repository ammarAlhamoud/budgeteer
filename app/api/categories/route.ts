import { prisma } from '@/lib/db';
import * as validate from '@/lib/api-validation';

export async function GET() {
  return Response.json(await prisma.category.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] }));
}

export async function POST(request: Request) {
  try {
    const body = await validate.readObject(request);
    const type = validate.txType(body.type);
    const monthlyLimit = body.monthlyLimit === undefined ? null : validate.limit(body.monthlyLimit);
    const created = await prisma.category.create({ data: {
      name: validate.text(body.name, 'name'), type,
      color: body.color === undefined ? '#64748b' : validate.color(body.color),
      monthlyLimit: type === 'expense' ? monthlyLimit : null,
    } });
    return Response.json(created, { status: 201 });
  } catch (error) { return validate.inputError(error); }
}
