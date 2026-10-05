import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { getUserTransactions } from '@/lib/db';

export async function GET() {
  try {
    const profile = await requireAuthenticatedUser();

    const transactions = getUserTransactions(profile.id);

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to fetch transactions');
  }
}
