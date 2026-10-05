import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { checkVisaStatus } from '@/services/visaStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { webFileNumber, passportNumber } = body;

    if (!webFileNumber || !passportNumber) {
      return NextResponse.json(
        {
          error: 'MISSING_FIELDS',
          message: 'ওয়েব ফাইল নম্বর এবং পাসপোর্ট নম্বর প্রদান করা আবশ্যক।',
        },
        { status: 400 }
      );
    }

    const result = await checkVisaStatus(webFileNumber, passportNumber);

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
