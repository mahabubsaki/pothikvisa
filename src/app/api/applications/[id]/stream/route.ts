import { requireApplicationAccess } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { subscribeProgress, ProgressPayload, ProgressLogItem } from '@/lib/progressEmitter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { application } = await requireApplicationAccess(id, 'applications.read');

    let existingLogs: ProgressLogItem[] = [];
    if (application.live_logs) {
      try {
        existingLogs = JSON.parse(application.live_logs);
      } catch {}
    }

    const initialPayload: ProgressPayload = {
      step: application.current_step,
      status: application.status,
      message: application.status_message || (application.status === 'completed' ? 'আবেদন সফলভাবে সম্পন্ন হয়েছে!' : 'অটোমেশন সক্রিয় আছে...'),
      timestamp: application.updated_at,
      webFileNumber: application.web_file_number,
      tempId: application.temp_id,
      pdfAvailable: Boolean(application.pdf_path),
      downloadUrl: `/api/applications/${id}/pdf`,
      error: application.failure_reason,
      logs: existingLogs,
    };

    let unsubscribe: (() => void) | null = null;
    let keepAliveInterval: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // 1. Send initial state immediately
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(initialPayload)}\n\n`)
        );

        // If already in a terminal state, close cleanly
        if (application.status === 'completed' || application.status === 'failed') {
          controller.close();
          return;
        }

        // 2. Subscribe to live progress
        unsubscribe = subscribeProgress(id, (payload) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
            );
            if (payload.status === 'completed' || payload.status === 'failed') {
              cleanup();
              controller.close();
            }
          } catch {
            cleanup();
          }
        });

        // 3. Heartbeat ping every 15s to keep connection alive
        keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'));
          } catch {
            cleanup();
          }
        }, 15000);

        function cleanup() {
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
          }
        }
      },
      cancel() {
        if (unsubscribe) unsubscribe();
        if (keepAliveInterval) clearInterval(keepAliveInterval);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Stream error');
  }
}
