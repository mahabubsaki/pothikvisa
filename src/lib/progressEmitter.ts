import { EventEmitter } from 'events';
import { getApplicationById, updateApplication } from './db';

export interface ProgressLogItem {
  step: number;
  message: string;
  messageBn?: string;
  timestamp: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface ProgressPayload {
  step: number;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  messageBn?: string;
  timestamp: string;
  webFileNumber?: string | null;
  tempId?: string | null;
  pdfAvailable?: boolean;
  downloadUrl?: string | null;
  error?: string | null;
  logs: ProgressLogItem[];
}

declare global {
  var __progressEmitter: EventEmitter | undefined;
}

const emitter: EventEmitter = globalThis.__progressEmitter || new EventEmitter();
emitter.setMaxListeners(100);
if (process.env.NODE_ENV !== 'production') {
  globalThis.__progressEmitter = emitter;
}

/**
 * Emits real-time progress for an application and records it in the database.
 */
export function emitProgress(
  applicationId: string,
  update: {
    step: number;
    status?: 'processing' | 'completed' | 'failed';
    message: string;
    messageBn?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    webFileNumber?: string | null;
    tempId?: string | null;
    pdfAvailable?: boolean;
    downloadUrl?: string | null;
    error?: string | null;
  }
) {
  const now = new Date().toISOString();
  const application = getApplicationById(applicationId);

  let existingLogs: ProgressLogItem[] = [];
  if (application && application.live_logs) {
    try {
      existingLogs = JSON.parse(application.live_logs);
    } catch {}
  }

  const newLogItem: ProgressLogItem = {
    step: update.step,
    message: update.message,
    messageBn: update.messageBn,
    timestamp: now,
    type: update.type || (update.status === 'failed' ? 'error' : update.status === 'completed' ? 'success' : 'info'),
  };

  const updatedLogs = [...existingLogs, newLogItem];

  // Persist to SQLite
  updateApplication(applicationId, {
    current_step: update.step,
    status: update.status || application?.status || 'processing',
    status_message: update.message,
    web_file_number: update.webFileNumber !== undefined ? update.webFileNumber : application?.web_file_number,
    temp_id: update.tempId !== undefined ? update.tempId : application?.temp_id,
    live_logs: JSON.stringify(updatedLogs),
  });

  const fullPayload: ProgressPayload = {
    step: update.step,
    status: update.status || application?.status || 'processing',
    message: update.message,
    messageBn: update.messageBn,
    timestamp: now,
    webFileNumber: update.webFileNumber !== undefined ? update.webFileNumber : application?.web_file_number,
    tempId: update.tempId !== undefined ? update.tempId : application?.temp_id,
    pdfAvailable: update.pdfAvailable ?? Boolean(application?.pdf_path),
    downloadUrl: update.downloadUrl || (application?.id ? `/api/applications/${application.id}/pdf` : null),
    error: update.error || null,
    logs: updatedLogs,
  };

  emitter.emit(`progress:${applicationId}`, fullPayload);
}

/**
 * Subscribes to real-time progress events for a given application ID.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeProgress(
  applicationId: string,
  callback: (payload: ProgressPayload) => void
): () => void {
  const eventName = `progress:${applicationId}`;
  emitter.on(eventName, callback);
  return () => {
    emitter.off(eventName, callback);
  };
}
