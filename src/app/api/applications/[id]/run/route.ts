import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import {
  getApplicationById,
  getUserSubscription,
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

    // Verify subscription and quota
    const sub = getUserSubscription(profile.id);
    if (!sub || (sub.plan !== 'agency' && sub.quota_used >= sub.quota_total)) {
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

    // Priority Rank: 1 = Agency Pro, 2 = Standard, 3 = Starter, 4 = Free
    const priorityRank = getPlanPriorityRank(sub?.plan);
    const queueInfo = await enqueueAndProcess(id, priorityRank);

    const rankLabel =
      priorityRank === 1
        ? 'Agency Pro প্রায়োরিটি কিউ (র‍্যাংক ১ - সর্বোচ্চ অগ্রাধিকার)'
        : priorityRank === 2
        ? 'Standard কিউ (র‍্যাংক ২)'
        : priorityRank === 3
        ? 'Starter কিউ (র‍্যাংক ৩)'
        : 'ফ্রি ট্রায়াল কিউ (র‍্যাংক ৪)';

    return NextResponse.json({
      success: true,
      message: `${rankLabel}-এ সফলভাবে যোগ করা হয়েছে। আপনার অবস্থান #${queueInfo.position}।`,
      status: 'queued',
      queuePosition: queueInfo.position,
      estimatedWaitMinutes: queueInfo.estimatedWaitMinutes,
      priorityRank,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to trigger automation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
