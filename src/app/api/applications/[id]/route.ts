import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getApplicationById, deleteApplication, updateApplication } from '@/lib/db';
import { stopApplicationAutomation } from '@/services/formRunner';

export async function GET(
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

    // Ensure ownership unless admin
    if (application.user_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch application';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    // Immediately stop and close any active browser process for this application
    await stopApplicationAutomation(id);

    const success = deleteApplication(id, application.user_id);
    return NextResponse.json({ success });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete application';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
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

    const body = await req.json();
    let currentFormData: Record<string, unknown> = {};
    try {
      currentFormData = JSON.parse(application.form_data_json || '{}') as Record<string, unknown>;
    } catch {}

    const updatedFormData = body.formData
      ? { ...currentFormData, ...body.formData }
      : currentFormData;

    const applicantName = body.applicantName || application.applicant_name;
    const passportNumber = (body.passportNumber || application.passport_number).toUpperCase().trim();
    const visaType = body.visaType || application.visa_type;

    const updated = updateApplication(id, {
      applicant_name: applicantName,
      passport_number: passportNumber,
      visa_type: visaType,
      form_data_json: JSON.stringify(updatedFormData),
      failure_reason: body.resetError ? null : application.failure_reason,
      status: body.resetError && application.status === 'failed' ? 'draft' : application.status,
    });

    return NextResponse.json({
      success: true,
      application: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update application';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

