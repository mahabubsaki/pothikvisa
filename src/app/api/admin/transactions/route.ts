import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { getAllTransactions } from '@/lib/db';

export async function GET(req: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const validStatus = statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected'
      ? statusParam
      : undefined;

    const transactions = getAllTransactions(validStatus);

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to fetch transactions');
  }
}
