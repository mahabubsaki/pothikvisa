import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { createTransaction } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a payment' },
        { status: 401 }
      );
    }

    const { plan, amount, mfsMethod, senderPhone, trxId, note } = await req.json();

    if (!plan || !amount || !mfsMethod || !senderPhone || !trxId) {
      return NextResponse.json(
        { error: 'Plan, amount, MFS method, sender phone, and TrxID are required' },
        { status: 400 }
      );
    }

    if (!['starter', 'standard', 'agency'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    if (!['bkash', 'nagad', 'rocket'].includes(mfsMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const transaction = createTransaction({
      userId: user.id,
      plan,
      amount: Number(amount),
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
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
