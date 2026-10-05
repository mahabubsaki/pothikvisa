import {
  claimNextQueuedApplication,
  enqueueApplication,
  getApplicationQueuePosition,
  getNextQueuedApplication,
  isAnyApplicationProcessing,
  recoverStaleProcessingApplications,
  refreshApplicationHeartbeat,
  releaseApplicationClaim,
  updateApplication,
} from '@/lib/db';
import { runApplicationAutomation } from '@/services/formRunner';

// Chromium is memory-intensive; keep one automation per worker process.
let isWorkerRunning = false;

export function isQueueWorkerRunning(): boolean {
  return isWorkerRunning;
}

/** Drain the SQLite-backed priority queue, claiming jobs atomically across processes. */
export async function triggerQueueWorker(): Promise<void> {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  const workerId = `queue-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    recoverStaleProcessingApplications();
    while (true) {
      const job = claimNextQueuedApplication(workerId);
      if (!job) break;

      console.log(`[Priority Queue] Starting ${job.id} (rank ${job.priority_rank})`);
      const heartbeat = setInterval(() => {
        try {
          if (!refreshApplicationHeartbeat(job.id, workerId)) {
            console.error(`[Priority Queue] Lost claim for ${job.id}`);
          }
        } catch (error) {
          console.error(`[Priority Queue] Heartbeat failed for ${job.id}:`, error);
        }
      }, 20_000);

      try {
        const result = await runApplicationAutomation(job.id);
        if (!result.success) {
          const current = updateApplication(job.id, {
            completed_at: new Date().toISOString(),
          });
          if (current?.status === 'processing') {
            updateApplication(job.id, {
              status: 'failed',
              failure_reason: result.error || 'Automation failed.',
            });
          }
        } else {
          updateApplication(job.id, { completed_at: new Date().toISOString() });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Priority Queue] Job ${job.id} failed:`, message);
        updateApplication(job.id, {
          status: 'failed',
          failure_reason: message,
          completed_at: new Date().toISOString(),
        });
      } finally {
        clearInterval(heartbeat);
        releaseApplicationClaim(job.id, workerId);
      }
    }
  } finally {
    isWorkerRunning = false;
    // Cover an enqueue that raced with the final empty-queue check.
    if (!isAnyApplicationProcessing() && getNextQueuedApplication()) {
      void triggerQueueWorker().catch((error) => {
        console.error('[Priority Queue] Follow-up worker failed:', error);
      });
    }
  }
}

export async function enqueueAndProcess(
  applicationId: string,
  priorityRank: number
): Promise<{
  position: number;
  estimatedWaitMinutes: number;
  totalInQueue: number;
  isProcessing: boolean;
}> {
  enqueueApplication(applicationId, priorityRank);
  void triggerQueueWorker().catch((error) => {
    console.error(`[Priority Queue] Worker error for app ${applicationId}:`, error);
  });
  return getApplicationQueuePosition(applicationId);
}
