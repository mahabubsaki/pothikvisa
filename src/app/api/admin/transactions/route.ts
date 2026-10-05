import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/currentAuth';
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
    const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
    if (message === 'UNAUTHORIZED' || message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
