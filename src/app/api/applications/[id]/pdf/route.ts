import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireApplicationAccess } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { downloadR2Buffer } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { application } = await requireApplicationAccess(id, 'applications.read');

    let pdfBuffer: Buffer | null = null;
    const localPath = application.pdf_path;

    if (localPath && fs.existsSync(localPath)) {
      pdfBuffer = fs.readFileSync(localPath);
    } else if (application.web_file_number) {
      const defaultDownloadPath = path.resolve(process.cwd(), 'downloads', `${application.web_file_number}.pdf`);
      if (fs.existsSync(defaultDownloadPath)) {
        pdfBuffer = fs.readFileSync(defaultDownloadPath);
      } else {
        // Also look for government pattern in downloads directory: <WebFileNumber>*.pdf
        const downloadsDir = path.resolve(process.cwd(), 'downloads');
        if (fs.existsSync(downloadsDir)) {
          const cleanNo = application.web_file_number.toUpperCase();
          const match = fs.readdirSync(downloadsDir).find((f) => {
            const up = f.toUpperCase();
            return up.startsWith(cleanNo) && up.endsWith('.PDF') && !up.endsWith('.CRDOWNLOAD');
          });
          if (match) {
            const foundPath = path.join(downloadsDir, match);
            pdfBuffer = fs.readFileSync(foundPath);
          }
        }
      }
    }

    if (!pdfBuffer && application.final_pdf_url) {
      if (application.final_pdf_url.startsWith('http://') || application.final_pdf_url.startsWith('https://')) {
        try {
          const res = await fetch(application.final_pdf_url);
          if (res.ok) {
            const arrBuf = await res.arrayBuffer();
            pdfBuffer = Buffer.from(arrBuf);
          }
        } catch {}
      }
      
      // Fallback: fetch directly from R2 bucket / storage using object key
      if (!pdfBuffer) {
        try {
          const key = `applications/${id}/${application.web_file_number || 'visa_application'}.pdf`;
          pdfBuffer = await downloadR2Buffer(key);
        } catch {}
      }
    }

    // === FALLBACK: If PDF is not in storage, but we have a Web File Number, fetch from Indian Visa Portal! ===
    if ((!pdfBuffer || pdfBuffer.length === 0) && application.web_file_number) {
      console.log(`📥 [PDF Route] PDF not found in storage for ${application.web_file_number}. Triggering on-demand portal reprint...`);
      const { reprintOfficialPdf } = await import('@/services/reprintPdf');
      const reprintResult = await reprintOfficialPdf(application.id);
      if (reprintResult.success && reprintResult.pdfBuffer) {
        pdfBuffer = reprintResult.pdfBuffer;
      }
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json(
        {
          error: 'PDF_NOT_FOUND',
          message: 'অফিসিয়াল পিডিএফ ফাইলটি এখনো প্রস্তুত হয়নি বা সরকারি সার্ভার থেকে ডাউনলোড করা সম্ভব হয়নি।',
        },
        { status: 404 }
      );
    }

    const filename = `Indian_Visa_${application.web_file_number || application.temp_id || id}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to retrieve PDF');
  }
}
