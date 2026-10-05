import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { createTransaction } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await requireAuthenticatedUser();

    const { mfsMethod, senderPhone, trxId, note } = await req.json();

    if (!mfsMethod || !senderPhone || !trxId) {
      return NextResponse.json(
        { error: 'MFS method, sender phone, and TrxID are required' },
        { status: 400 }
      );
    }

    if (!['bkash', 'nagad', 'rocket'].includes(mfsMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
    if (!/^01\d{9}$/.test(String(senderPhone).trim())) {
      return NextResponse.json({ error: 'Enter a valid 11-digit Bangladesh phone number' }, { status: 400 });
    }
    if (!/^[A-Za-z0-9-]{5,40}$/.test(String(trxId).trim())) {
      return NextResponse.json({ error: 'Enter a valid transaction ID' }, { status: 400 });
    }

    const transaction = createTransaction({
      userId: user.id,
      mfsMethod,
      senderPhone,
      trxId,
      note,
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit payment';
    if (message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'This Transaction ID (TrxID) has already been submitted.' },
        { status: 409 }
      );
    }
    return apiErrorResponse(error, 'Failed to submit payment');
  }
}
