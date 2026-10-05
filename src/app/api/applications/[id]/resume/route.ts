import { NextResponse } from 'next/server';
import { requireApplicationAccess } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { resumeApplicationAutomation } from '@/services/formRunner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { application } = await requireApplicationAccess(id, 'applications.run');

    if (!application.temp_id) {
      return NextResponse.json(
        { error: 'NO_TEMP_ID', message: 'এই আবেদনের জন্য কোনো অস্থায়ী অ্যাপ্লিকেশন আইডি (Temp ID) নেই।' },
        { status: 400 }
      );
    }

    if (application.status === 'processing') {
      return NextResponse.json(
        { error: 'ALREADY_RUNNING', message: 'আবেদনটি বর্তমানে প্রক্রিয়াকরণ করা হচ্ছে।' },
        { status: 409 }
      );
    }

    // Launch resume automation in background
    resumeApplicationAutomation(id).catch((err) => {
      console.error(`Background resume error for application ${id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: 'আবেদন রিজিউম প্রক্রিয়া শুরু হয়েছে',
      status: 'processing',
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to resume automation');
  }
}
