import { NextResponse } from 'next/server';
import { requireApplicationAccess } from '@/lib/currentAuth';
import { deleteApplication, updateApplication } from '@/lib/db';
import { apiErrorResponse } from '@/lib/api-error';
import { stopApplicationAutomation } from '@/services/formRunner';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { application } = await requireApplicationAccess(id, 'applications.read');

    return NextResponse.json({ application });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to fetch application');
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { application } = await requireApplicationAccess(id, 'applications.write');

    // Immediately stop and close any active browser process for this application
    await stopApplicationAutomation(id);

    const success = deleteApplication(id, application.user_id);
    return NextResponse.json({ success });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to delete application');
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { application } = await requireApplicationAccess(id, 'applications.write');

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
    return apiErrorResponse(error, 'Failed to update application');
  }
}
