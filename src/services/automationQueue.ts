import {
  getNextQueuedApplication,
  updateApplication,
  enqueueApplication,
  getApplicationQueuePosition,
  getDb,
} from '@/lib/db';
import { runApplicationAutomation } from '@/services/formRunner';

// Single concurrency flag: ensures only 1 Chromium browser instance runs at a time (protects 2GB RAM VPS)
let isWorkerRunning = false;

// Clean up stale 'processing' jobs on cold start
try {
  const db = getDb();
  db.prepare(`
    UPDATE applications
    SET status = 'failed',
        failure_reason = 'সার্ভার রিস্টার্টের কারণে আবেদনটি স্থগিত হয়েছে। পুনরায় রান করতে "রিজিউম" বা "রান করুন" চাপুন।',
        status_message = 'সার্ভার রিস্টার্টের কারণে স্থগিত হয়েছিল।'
    WHERE status = 'processing'
  `).run();
} catch (err) {
  console.warn('Could not reset stale processing jobs on startup:', err);
}

// Auto-trigger worker on startup if there are existing queued jobs
setTimeout(() => {
  triggerQueueWorker().catch((err) => {
    console.error('Initial queue worker check failed:', err);
  });
}, 2000);

export function isQueueWorkerRunning(): boolean {
  return isWorkerRunning;
}

/**
 * Sequential Priority Queue Worker
 * Orders jobs strictly by:
 * 1. priority_rank ASC (1 = Agency Pro, 2 = Standard, 3 = Starter, 4 = Free)
 * 2. queued_at ASC (FIFO within same rank)
 * Strictly runs 1 automation job at a time to prevent VPS OOM memory crashes.
 */
export async function triggerQueueWorker(): Promise<void> {
  if (isWorkerRunning) {
    return;
  }

  isWorkerRunning = true;

  try {
    while (true) {
      const nextJob = getNextQueuedApplication();
      if (!nextJob) {
        break; // Queue is empty
      }

      console.log(
        `\n🚀 [Priority Queue] Starting Job: ${nextJob.id} | Rank: ${nextJob.priority_rank} | Applicant: ${nextJob.applicant_name} | Passport: ${nextJob.passport_number}`
      );

      const startedAt = new Date().toISOString();
      updateApplication(nextJob.id, {
        started_at: startedAt,
      });

      try {
        await runApplicationAutomation(nextJob.id);
      } catch (jobErr: unknown) {
        const errorMsg = jobErr instanceof Error ? jobErr.message : String(jobErr);
        console.error(`💥 [Priority Queue] Job ${nextJob.id} execution failed:`, errorMsg);
      } finally {
        updateApplication(nextJob.id, {
          completed_at: new Date().toISOString(),
        });
      }
    }
  } finally {
    isWorkerRunning = false;

    // In case a job was enqueued right as we were exiting
    const lingering = getNextQueuedApplication();
    if (lingering) {
      triggerQueueWorker().catch(console.error);
    }
  }
}

/**
 * Enqueues an application into the priority queue and activates the single-concurrency worker.
 */
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

  // Trigger worker asynchronously (does not block HTTP response)
  triggerQueueWorker().catch((err) => {
    console.error(`[Priority Queue] Worker background error for app ${applicationId}:`, err);
  });

  return getApplicationQueuePosition(applicationId);
}
