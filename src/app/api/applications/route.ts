import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import {
  getUserApplications,
  createApplication,
  getUserSubscription,
  checkAndRecordFreeTrialUsage,
} from '@/lib/db';

export async function GET() {
  try {
    const profile = await getAuthenticatedUser();
    if (!profile) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const applications = getUserApplications(profile.id);
    return NextResponse.json({ applications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch applications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await getAuthenticatedUser();
    if (!profile) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const { applicantName, passportNumber, visaType, formData, deviceFingerprint } = body;

    // Check user quota
    const sub = getUserSubscription(profile.id);
    if (!sub || (sub.plan !== 'agency' && sub.quota_used >= sub.quota_total)) {
      return NextResponse.json(
        {
          error: 'QUOTA_EXCEEDED',
          message: 'আপনার অ্যাকাউন্টে পর্যাপ্ত ফর্ম কোটা অবশিষ্ট নেই। অনুগ্রহ করে সাবস্ক্রিপশন রিনিউ করুন।',
        },
        { status: 403 }
      );
    }

    // Anti-Abuse Shield: If user is on Free Trial, check hardware device fingerprint!
    if (sub.plan === 'free') {
      const forwarded = req.headers.get('x-forwarded-for') || '';
      const clientIp = forwarded.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
      const fp = (deviceFingerprint || req.headers.get('x-device-fingerprint') || 'untracked_fp').trim();

      const fpCheck = checkAndRecordFreeTrialUsage({
        fingerprint: fp,
        userId: profile.id,
        email: profile.email,
        ipAddress: clientIp,
        increment: true,
      });

      if (!fpCheck.allowed) {
        return NextResponse.json(
          {
            error: 'DEVICE_TRIAL_LIMIT_EXCEEDED',
            message: 'এই কম্পিউটার বা ডিভাইস থেকে ইতোমধ্যে ৩টি ফ্রি ট্রায়াল ফাইল ব্যবহার করা হয়েছে। অন্য জিমেইল অ্যাকাউন্ট ব্যবহার করলেও বিনামূল্যে কোটা পাওয়া যাবে না। দয়া করে ১৫০ ৳ বা ৩০০ ৳ প্যাকেজে আপগ্রেড করুন।',
          },
          { status: 403 }
        );
      }
    }

    if (!applicantName || !passportNumber) {
      return NextResponse.json(
        { error: 'INVALID_DATA', message: 'Applicant name and passport number are required.' },
        { status: 400 }
      );
    }

    const newApp = createApplication({
      userId: profile.id,
      applicantName,
      passportNumber,
      visaType: visaType || '544',
      formData: formData || {},
    });

    return NextResponse.json({
      success: true,
      application: newApp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create application';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
