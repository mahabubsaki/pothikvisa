import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getUserTransactions } from '@/lib/db';

export async function GET() {
  try {
    const profile = await getAuthenticatedUser();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = getUserTransactions(profile.id);

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
