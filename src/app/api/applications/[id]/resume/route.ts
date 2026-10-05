import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getApplicationById } from '@/lib/db';
import { resumeApplicationAutomation } from '@/services/formRunner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getAuthenticatedUser();
    if (!profile) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const application = getApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    if (application.user_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

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
    const message = error instanceof Error ? error.message : 'Failed to resume automation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
