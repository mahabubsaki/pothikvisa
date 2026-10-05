import { NextResponse } from 'next/server';
import { requireApplicationAccess } from '@/lib/currentAuth';
import { updateApplication } from '@/lib/db';
import { apiErrorResponse } from '@/lib/api-error';
import { uploadBufferToStorage } from '@/lib/r2';
import { enhanceConsularPhoto, enhancePassportDocument } from '@/lib/media-enhancer';
import { validateMediaUpload } from '@/lib/upload-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user: profile, application } = await requireApplicationAccess(id, 'applications.write');

    const formData = await req.formData();
    const photoFile = formData.get('photo') as File | null;
    const passportPdfFile = formData.get('passportPdf') as File | null;
    const hasPaidLimits = profile.isAdmin || profile.tier === 'paid';
    const uploadError = validateMediaUpload(photoFile, 'photo', hasPaidLimits)
      || validateMediaUpload(passportPdfFile, 'passport', hasPaidLimits);
    if (uploadError) return NextResponse.json({ error: uploadError }, { status: 413 });

    let photoUrl = application.photo_url;
    let passportPdfUrl = application.passport_pdf_url;

    let photoNotes: string[] = [];
    let passportNotes: string[] = [];

    // 1. Handle Photo Upload with Auto-Enhancer
    if (photoFile && photoFile.size > 0) {
      const rawBuffer = Buffer.from(await photoFile.arrayBuffer());
      const enhanced = await enhanceConsularPhoto(rawBuffer);
      photoNotes = enhanced.notes;

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

      const r2Key = `applications/${id}/passport.pdf`;
      const result = await uploadBufferToStorage({
        key: r2Key,
        buffer: enhancedPdf.buffer,
        contentType: 'application/pdf',
      });
      passportPdfUrl = result.url;
      console.log(`📄 [App ${id}] Passport document processed: ${enhancedPdf.sizeKb} KB (${passportNotes.join('; ') || 'Standard'})`);
    }

    // Store opaque private-storage locators; the worker materializes them when needed.
    const updated = updateApplication(id, {
      photo_url: photoUrl,
      passport_pdf_url: passportPdfUrl,
    });

    console.log(`📎 [App ${id}] Uploaded private media: photo=${Boolean(photoFile)}, passport=${Boolean(passportPdfFile)}`);

    return NextResponse.json({
      success: true,
      application: updated,
      photoUrl,
      passportPdfUrl,
      photoNotes,
      passportNotes,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Upload failed');
  }
}
