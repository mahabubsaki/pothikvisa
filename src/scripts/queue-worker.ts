import { triggerQueueWorker } from '../services/automationQueue';

const POLL_INTERVAL_MS = 2_000;
let stopping = false;

process.once('SIGINT', () => { stopping = true; });
process.once('SIGTERM', () => { stopping = true; });

console.log('[Priority Queue] Durable worker started.');

while (!stopping) {
  try {
    await triggerQueueWorker();
  } catch (error) {
    console.error('[Priority Queue] Worker cycle failed:', error);
  }
  if (!stopping) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

console.log('[Priority Queue] Worker stopped.');
