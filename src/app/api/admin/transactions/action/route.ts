import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/currentAuth';
import { approveTransaction, rejectTransaction, getDb, MfsTransaction } from '@/lib/db';
import { clerkClient } from '@clerk/nextjs/server';

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
      const db = getDb();
      const trx = db.prepare('SELECT * FROM transactions WHERE id = ? OR trx_id = ?').get(trxId, trxId) as MfsTransaction | undefined;
      const ok = approveTransaction(trxId, admin.email);
      if (!ok) {
        return NextResponse.json(
          { error: 'Transaction not found or already approved' },
          { status: 404 }
        );
      }

      // If user is a Clerk user, sync their new plan to Clerk publicMetadata
      if (trx && trx.user_id && trx.user_id.startsWith('user_')) {
        clerkClient().then(async (client) => {
          await client.users.updateUserMetadata(trx.user_id, {
            publicMetadata: {
              plan: trx.plan,
            },
          });
        }).catch(() => {
          // ignore background sync error
        });
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
    const message = error instanceof Error ? error.message : 'Failed to update transaction';
    if (message === 'UNAUTHORIZED' || message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
