import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import {
  createApplication,
  enqueueApplication,
  getApplicationQueuePosition,
  getSavedProfileById,
  updateApplication,
} from '@/lib/db';
import { triggerQueueWorker } from '@/services/automationQueue';
import { downloadR2Buffer, uploadBufferToStorage } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await requirePermission('applications.batch');
    const body = await request.json() as { profileIds?: unknown };
    if (!Array.isArray(body.profileIds) || body.profileIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one saved profile.' }, { status: 400 });
    }

    const profileIds = [...new Set(body.profileIds.filter((id): id is string => typeof id === 'string'))];
    if (profileIds.length === 0 || profileIds.length > 50) {
      return NextResponse.json({ error: 'A batch must contain between 1 and 50 profiles.' }, { status: 400 });
    }

    const applications = [];
    for (const profileId of profileIds) {
      const savedProfile = getSavedProfileById(profileId, user.id);
      if (!savedProfile) continue;

      let formData: Record<string, unknown>;
      try {
        formData = JSON.parse(savedProfile.data_json) as Record<string, unknown>;
      } catch {
        continue;
      }

      const registration = formData.step1_registration as { visaPurpose?: string } | undefined;
      const application = createApplication({
        userId: user.id,
        applicantName: savedProfile.profile_name || 'APPLICANT',
        passportNumber: savedProfile.passport_number || 'NA',
        visaType: registration?.visaPurpose || '544',
        formData,
      });

      const media: { photo_url?: string; passport_pdf_url?: string } = {};
      try {
        const photo = await downloadR2Buffer(`profiles/${profileId}/photo.jpg`);
        media.photo_url = (await uploadBufferToStorage({
          key: `applications/${application.id}/photo.jpg`,
          buffer: photo,
          contentType: 'image/jpeg',
        })).url;
      } catch {}
      try {
        const passport = await downloadR2Buffer(`profiles/${profileId}/passport.pdf`);
        media.passport_pdf_url = (await uploadBufferToStorage({
          key: `applications/${application.id}/passport.pdf`,
          buffer: passport,
          contentType: 'application/pdf',
        })).url;
      } catch {}
      if (media.photo_url || media.passport_pdf_url) updateApplication(application.id, media);

      enqueueApplication(application.id, 1);
      const position = getApplicationQueuePosition(application.id);
      applications.push({
        id: application.id,
        applicantName: application.applicant_name,
        passportNumber: application.passport_number,
        queuePosition: position.position,
        estimatedWaitMinutes: position.estimatedWaitMinutes,
      });
    }

    if (applications.length === 0) {
      return NextResponse.json({ error: 'No valid profiles were found.' }, { status: 400 });
    }

    void triggerQueueWorker().catch((error) => console.error('[Batch Run] Worker error:', error));
    return NextResponse.json({
      success: true,
      message: `${applications.length} applications were added to the paid priority queue.`,
      count: applications.length,
      applications,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to batch process profiles');
  }
}
