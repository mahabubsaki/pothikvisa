import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import {
  getUserSubscription,
  getSavedProfileById,
  createApplication,
  enqueueApplication,
  getApplicationQueuePosition,
} from '@/lib/db';
import { triggerQueueWorker } from '@/services/automationQueue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const sub = getUserSubscription(user.id);
    const isAgencyOrAdmin = user.role === 'admin' || sub?.plan === 'agency';

    if (!isAgencyOrAdmin) {
      return NextResponse.json(
        {
          error: 'UPGRADE_REQUIRED',
          message: 'মাল্টি-অ্যাপ্লিক্যান্ট ব্যাচ প্রসেসিং ফিচারটি শুধুমাত্র Agency Pro প্ল্যানের জন্য সংরক্ষিত। অনুগ্রহ করে প্ল্যান আপগ্রেড করুন।',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { profileIds } = body;

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'ব্যাচ প্রসেসিংয়ের জন্য অনুগ্রহ করে কমপক্ষে একটি ক্লায়েন্ট প্রোফাইল নির্বাচন করুন।',
        },
        { status: 400 }
      );
    }

    const createdApplications: Array<{
      id: string;
      applicantName: string;
      passportNumber: string;
      queuePosition: number;
      estimatedWaitMinutes: number;
    }> = [];

    for (const profileId of profileIds) {
      const savedProf = getSavedProfileById(profileId, user.id);
      if (!savedProf) continue;

      let formData: any = {};
      try {
        formData = JSON.parse(savedProf.data_json);
      } catch (err) {
        console.warn(`Failed to parse profile data for ${profileId}:`, err);
        continue;
      }

      const applicantName = savedProf.profile_name || 'APPLICANT';
      const passportNumber = savedProf.passport_number || 'NA';
      const visaType = formData.step1_registration?.visaPurpose || '544';

      // 1. Create application record in database
      const app = createApplication({
        userId: user.id,
        applicantName,
        passportNumber,
        visaType,
        photoUrl: formData.photoUrl || null,
        passportPdfUrl: formData.passportPdfUrl || null,
        formData,
      });

      // 2. Enqueue with Agency Pro Rank 1 (Top Priority)
      enqueueApplication(app.id, 1);
      const qPos = getApplicationQueuePosition(app.id);

      createdApplications.push({
        id: app.id,
        applicantName,
        passportNumber,
        queuePosition: qPos.position,
        estimatedWaitMinutes: qPos.estimatedWaitMinutes,
      });
    }

    if (createdApplications.length === 0) {
      return NextResponse.json(
        {
          error: 'NO_VALID_PROFILES',
          message: 'কোনো কার্যকর ক্লায়েন্ট প্রোফাইল পাওয়া যায়নি।',
        },
        { status: 400 }
      );
    }

    // 3. Trigger sequential priority worker in background
    triggerQueueWorker().catch((err) => {
      console.error('[Batch Run] Worker trigger error:', err);
    });

    return NextResponse.json({
      success: true,
      message: `সাফল্যের সাথে ${createdApplications.length}টি আবেদন Agency Pro প্রায়োরিটি কিউতে যোগ করা হয়েছে (র‍্যাংক ১)।`,
      count: createdApplications.length,
      applications: createdApplications,
    });
  } catch (error: unknown) {
    console.error('Batch applications error:', error);
    const message = error instanceof Error ? error.message : 'Failed to batch process profiles';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
