import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { approveTransaction, rejectTransaction } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const admin = await requireAdminUser();
    const { action, trxId, reason } = await req.json();

    if (!action || !trxId) {
      return NextResponse.json(
        { error: 'Action and TrxID are required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const ok = approveTransaction(trxId, admin.email);
      if (!ok) {
        return NextResponse.json(
          { error: 'Transaction not found or already approved' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction approved and subscription activated!',
      });
    } else if (action === 'reject') {
      const ok = rejectTransaction(trxId, reason || 'Transaction not recognized', admin.email);
      if (!ok) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: 'Transaction marked as rejected',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to update transaction');
  }
}
