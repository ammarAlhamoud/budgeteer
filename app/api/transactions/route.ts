import { prisma } from '@/lib/db';
import { getTransactions } from '@/lib/data';
import * as validate from '@/lib/api-validation';

export async function GET() { return Response.json(await getTransactions()); }

export async function POST(request: Request) {
  try {
    const body = await validate.readObject(request);
    const data = {
      amount: validate.amount(body.amount), type: validate.txType(body.type),
      categoryId: validate.text(body.categoryId, 'categoryId'),
      date: body.date === undefined ? new Date() : validate.date(body.date),
      note: body.note === undefined ? null : validate.note(body.note),
    };
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category || category.type !== data.type) throw new validate.InvalidInput('category must exist and match transaction type');
    const created = await prisma.transaction.create({ data, include: { category: true } });
    return Response.json(created, { status: 201 });
  } catch (error) { return validate.inputError(error); }
}
