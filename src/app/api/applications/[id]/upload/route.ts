import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getApplicationById, updateApplication } from '@/lib/db';
import { uploadBufferToStorage } from '@/lib/r2';
import { enhanceConsularPhoto, enhancePassportDocument } from '@/lib/media-enhancer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
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

    const formData = await req.formData();
    const photoFile = formData.get('photo') as File | null;
    const passportPdfFile = formData.get('passportPdf') as File | null;

    let photoUrl = application.photo_url;
    let passportPdfUrl = application.passport_pdf_url;

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'applications', id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let localPhotoPath: string | undefined;
    let localPassportPdfPath: string | undefined;
    let photoNotes: string[] = [];
    let passportNotes: string[] = [];

    // 1. Handle Photo Upload with Auto-Enhancer
    if (photoFile && photoFile.size > 0) {
      const rawBuffer = Buffer.from(await photoFile.arrayBuffer());
      const enhanced = await enhanceConsularPhoto(rawBuffer);
      photoNotes = enhanced.notes;

      localPhotoPath = path.join(uploadsDir, 'photo.jpg');
      fs.writeFileSync(localPhotoPath, enhanced.buffer);

      const r2Key = `applications/${id}/photo.jpg`;
      const result = await uploadBufferToStorage({
        key: r2Key,
        buffer: enhanced.buffer,
        contentType: 'image/jpeg',
      });
      photoUrl = result.url;
      console.log(`📸 [App ${id}] Consular photo processed: ${enhanced.sizeKb} KB, ${enhanced.width}×${enhanced.height} px (${photoNotes.join('; ') || 'Standard'})`);
    }

    // 2. Handle Passport PDF Upload with Auto-Enhancer
    if (passportPdfFile && passportPdfFile.size > 0) {
      const rawBuffer = Buffer.from(await passportPdfFile.arrayBuffer());
      const enhancedPdf = await enhancePassportDocument(rawBuffer, passportPdfFile.name);
      passportNotes = enhancedPdf.notes;

      localPassportPdfPath = path.join(uploadsDir, 'passport.pdf');
      fs.writeFileSync(localPassportPdfPath, enhancedPdf.buffer);

      const r2Key = `applications/${id}/passport.pdf`;
      const result = await uploadBufferToStorage({
        key: r2Key,
        buffer: enhancedPdf.buffer,
        contentType: 'application/pdf',
      });
      passportPdfUrl = result.url;
      console.log(`📄 [App ${id}] Passport document processed: ${enhancedPdf.sizeKb} KB (${passportNotes.join('; ') || 'Standard'})`);
    }

    // 3. Update form_data_json with direct local file paths for Stagehand
    let formDataObj: Record<string, unknown> = {};
    try {
      formDataObj = JSON.parse(application.form_data_json || '{}') as Record<string, unknown>;
    } catch {}

    if (localPhotoPath) formDataObj.photoFilePath = localPhotoPath;
    if (localPassportPdfPath) formDataObj.passportPdfPath = localPassportPdfPath;

    // 4. Sync to SQLite database
    const updated = updateApplication(id, {
      photo_url: photoUrl,
      passport_pdf_url: passportPdfUrl,
      form_data_json: JSON.stringify(formDataObj),
    });

    console.log(`📎 [App ${id}] Uploaded media attached: photo=${Boolean(localPhotoPath)}, passport=${Boolean(localPassportPdfPath)}`);

    return NextResponse.json({
      success: true,
      application: updated,
      photoUrl,
      passportPdfUrl,
      photoFilePath: localPhotoPath,
      passportPdfPath: localPassportPdfPath,
      photoNotes,
      passportNotes,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
