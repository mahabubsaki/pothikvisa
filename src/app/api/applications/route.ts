import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import {
  getUserApplications,
  createApplication,
  hasRemainingQuota,
} from '@/lib/db';
import { sanitizeProfileDefaults } from '@/lib/profile-constants';

export async function GET() {
  try {
    const profile = await requirePermission('applications.read');

    const applications = getUserApplications(profile.id);
    return NextResponse.json({ applications });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to fetch applications');
  }
}

export async function POST(req: Request) {
  try {
    const profile = await requirePermission('applications.write');

    const body = await req.json();
    const { applicantName, passportNumber, visaType, formData } = body;

    // Check user quota
    const sub = profile.subscription;
    if (!profile.isAdmin && !hasRemainingQuota(sub)) {
      return NextResponse.json(
        {
          error: 'QUOTA_EXCEEDED',
          message: 'আপনার অ্যাকাউন্টে পর্যাপ্ত ফর্ম কোটা অবশিষ্ট নেই। অনুগ্রহ করে সাবস্ক্রিপশন রিনিউ করুন।',
        },
        { status: 403 }
      );
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
      formData: sanitizeProfileDefaults(formData || {}),
    });

    return NextResponse.json({
      success: true,
      application: newApp,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to create application');
  }
}
