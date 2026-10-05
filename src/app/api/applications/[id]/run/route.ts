import { NextResponse } from 'next/server';
import { requireApplicationAccess } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import {
  hasRemainingQuota,
  getPlanPriorityRank,
  getApplicationQueuePosition,
} from '@/lib/db';
import { enqueueAndProcess } from '@/services/automationQueue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: profile, application } = await requireApplicationAccess(id, 'applications.run');

    // Verify subscription and quota
    const sub = profile.subscription;
    if (!profile.isAdmin && !hasRemainingQuota(sub)) {
      return NextResponse.json(
        {
          error: 'QUOTA_EXCEEDED',
          message: 'আপনার অ্যাকাউন্টে পর্যাপ্ত ফর্ম কোটা অবশিষ্ট নেই। অনুগ্রহ করে সাবস্ক্রিপশন রিনিউ বা আপগ্রেড করুন।',
        },
        { status: 403 }
      );
    }

    if (application.status === 'processing') {
      return NextResponse.json(
        { error: 'ALREADY_RUNNING', message: 'আবেদনটি বর্তমানে প্রক্রিয়াকরণ করা হচ্ছে।' },
        { status: 409 }
      );
    }

    if (application.status === 'queued') {
      const qInfo = getApplicationQueuePosition(id);
      return NextResponse.json({
        success: true,
        message: 'আবেদনটি ইতোমধ্যে কিউতে রয়েছে।',
        status: 'queued',
        queuePosition: qInfo.position,
        estimatedWaitMinutes: qInfo.estimatedWaitMinutes,
      });
    }

    if (application.status === 'completed') {
      return NextResponse.json(
        { error: 'ALREADY_COMPLETED', message: 'This application has already completed.' },
        { status: 409 }
      );
    }

    // Priority Rank: 1 = paid, 2 = free.
    const priorityRank = getPlanPriorityRank(sub?.plan);
    const queueInfo = await enqueueAndProcess(id, priorityRank);

    const rankLabel = priorityRank === 1 ? 'paid priority queue' : 'free queue';

    return NextResponse.json({
      success: true,
      message: `Added to the ${rankLabel}. Your position is #${queueInfo.position}.`,
      status: 'queued',
      queuePosition: queueInfo.position,
      estimatedWaitMinutes: queueInfo.estimatedWaitMinutes,
      priorityRank,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to trigger automation');
  }
}
