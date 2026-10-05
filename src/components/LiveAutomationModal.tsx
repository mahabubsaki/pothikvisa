'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileDown,
  Terminal,
  ExternalLink,
  X,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { ProgressPayload, ProgressLogItem } from '@/lib/progressEmitter';
import { IvacChecklistModal } from '@/components/IvacChecklistModal';

interface LiveAutomationModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewDashboard?: () => void;
}

const STEPS = [
  { step: 1, nameEn: 'Captcha & Reg', nameBn: 'ক্যাপচা ও নিবন্ধন' },
  { step: 2, nameEn: 'Applicant', nameBn: 'আবেদনকারী' },
  { step: 3, nameEn: 'Family & Addr', nameBn: 'ঠিকানা ও পরিবার' },
  { step: 4, nameEn: 'Visa & Ports', nameBn: 'ভিসা ও পোর্ট' },
  { step: 5, nameEn: 'Security', nameBn: 'আইনি ঘোষণা' },
  { step: 6, nameEn: '2×2 Photo', nameBn: '২×২ ছবি আপলোড' },
  { step: 7, nameEn: 'Passport Doc', nameBn: 'পাসপোর্ট ডকুমেন্ট' },
  { step: 8, nameEn: 'Stay Details', nameBn: 'হোটেল অবস্থান' },
  { step: 9, nameEn: 'Web File No', nameBn: 'চূড়ান্ত আবেদন ও PDF' },
];

export function LiveAutomationModal({
  applicationId,
  isOpen,
  onClose,
  onViewDashboard,
}: LiveAutomationModalProps) {
  const { isBn } = useLanguage();
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.logs]);

  // Connect to SSE stream
  useEffect(() => {
    if (!isOpen || !applicationId) return;

    let eventSource: EventSource | null = null;
    let fallbackPoll: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource(`/api/applications/${applicationId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const payload: ProgressPayload = JSON.parse(event.data);
          setData(payload);
          if (payload.status === 'completed' || payload.status === 'failed') {
            eventSource?.close();
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      eventSource.onerror = () => {
        // Fallback to polling every 2s if SSE fails or disconnects
        eventSource?.close();
        fallbackPoll = setInterval(async () => {
          try {
            const res = await fetch(`/api/applications/${applicationId}`);
            if (res.ok) {
              const resData = await res.json();
              if (resData.application) {
                const app = resData.application;
                let parsedLogs: ProgressLogItem[] = [];
                try {
                  parsedLogs = JSON.parse(app.live_logs || '[]');
                } catch {}

                setData({
                  step: app.current_step,
                  status: app.status,
                  message: app.status_message || (app.status === 'completed' ? 'আবেদন সম্পন্ন হয়েছে' : 'প্রক্রিয়াকরণ চলছে...'),
                  timestamp: app.updated_at,
                  webFileNumber: app.web_file_number,
                  tempId: app.temp_id,
                  pdfAvailable: Boolean(app.pdf_path),
                  downloadUrl: `/api/applications/${applicationId}/pdf`,
                  error: app.failure_reason,
                  logs: parsedLogs,
                });

                if (app.status === 'completed' || app.status === 'failed') {
                  if (fallbackPoll) clearInterval(fallbackPoll);
                }
              }
            }
          } catch {}
        }, 2000);
      };
    } catch {
      // Fallback
    }

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackPoll) clearInterval(fallbackPoll);
    };
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  const currentStep = data?.step || 1;
  const isCompleted = data?.status === 'completed';
  const isFailed = data?.status === 'failed';
  const isQueued = data?.status === 'queued';
  const isProcessing = data?.status === 'processing' || (!isCompleted && !isFailed && !isQueued);

  const handleCopyWebFileNo = () => {
    if (data?.webFileNumber) {
      navigator.clipboard.writeText(data.webFileNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 text-white rounded-2xl sm:rounded-3xl border border-zinc-800/90 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              {isQueued ? (
                <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
              ) : isProcessing ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </>
              ) : isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5 sm:gap-2 font-bangla truncate">
                <span className="truncate">{isBn ? 'লাইভ সরকারি ফর্ম অটোমেশন ফিড' : 'Live Indian Visa Portal Automation'}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] sm:text-[10px] uppercase font-mono tracking-wider shrink-0 ${
                    isCompleted
                      ? 'border-emerald-700 text-emerald-300 bg-emerald-950/40'
                      : isFailed
                      ? 'border-rose-700 text-rose-300 bg-rose-950/40'
                      : isQueued
                      ? 'border-sky-700 text-sky-300 bg-sky-950/40 animate-pulse'
                      : 'border-zinc-700 text-zinc-300 bg-zinc-900'
                  }`}
                >
                  {isCompleted ? 'COMPLETED' : isFailed ? 'FAILED' : isQueued ? 'QUEUED' : 'AUTORUNNING'}
                </Badge>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-xl hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 sm:space-y-5">
          {/* Stepper Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-0.5">
              <span>
                {isBn ? `ধাপ ${currentStep} / ৯` : `Step ${currentStep} of 9`}
              </span>
              <span className="text-emerald-400 font-bold">
                {Math.round((currentStep / 9) * 100)}%
              </span>
            </div>

            {/* Stepper Dots (horizontally scrollable on small screens to prevent squeezing) */}
            <div className="overflow-x-auto pb-1.5 -mx-1 px-1">
              <div className="min-w-[380px] sm:min-w-0 grid grid-cols-9 gap-1.5 sm:gap-2">
                {STEPS.map((s) => {
                  const isPast = s.step < currentStep || isCompleted;
                  const isCurrent = s.step === currentStep && !isCompleted && !isFailed;
                  return (
                    <div
                      key={s.step}
                      className="flex flex-col items-center gap-1 text-center group"
                    >
                      <div
                        className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                          isPast
                            ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                            : isCurrent
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-zinc-800'
                        }`}
                      />
                      <span
                        className={`text-[9px] truncate max-w-full font-bangla ${
                          isPast
                            ? 'text-emerald-400 font-bold'
                            : isCurrent
                            ? 'text-white font-bold'
                            : 'text-zinc-600'
                        }`}
                      >
                        {s.step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Status Banner */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
              isCompleted
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : isFailed
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : isQueued
                ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                : 'bg-zinc-900/70 border-zinc-800 text-zinc-200'
            }`}
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              {isQueued && (
                <RefreshCw className="w-5 h-5 text-sky-400 animate-spin shrink-0 mt-0.5" />
              )}
              {isProcessing && !isQueued && (
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin shrink-0 mt-0.5" />
              )}
              {isCompleted && (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              {isFailed && (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-xs font-bold font-bangla text-zinc-100 break-words">
                    {isBn
                      ? data?.messageBn || data?.message || (isQueued ? 'সারিবদ্ধ রয়েছে (অটোমেশন শুরুর অপেক্ষায়)...' : 'প্রসেসিং চলছে...')
                      : data?.message || (isQueued ? 'In queue waiting for execution...' : 'Processing automation...')}
                  </span>

                  {data?.tempId && (
                    <Badge variant="outline" className="font-mono text-[9px] sm:text-[10px] bg-zinc-950 border-zinc-700 text-zinc-300 shrink-0">
                      ID: {data.tempId}
                    </Badge>
                  )}
                </div>

                {isQueued && (
                  <p className="text-[11px] text-sky-300/90 font-bangla pt-1 leading-relaxed">
                    {isBn
                      ? 'আপনার আবেদনটি কিউতে রয়েছে। সিরিয়াল অনুযায়ী স্বয়ংক্রিয়ভাবে প্রসেস শুরু হবে।'
                      : 'Your application is queued. Processing will begin automatically shortly.'}
                  </p>
                )}

                {isCompleted && data?.webFileNumber && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-900/30 p-2.5 rounded-xl border border-emerald-500/30">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bangla block">
                        {isBn ? 'সরকারি ওয়েব ফাইল নম্বর (Web File Number):' : 'Official Web File Number:'}
                      </span>
                      <span className="text-sm font-black font-mono tracking-wider text-white">
                        {data.webFileNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyWebFileNo}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 text-white text-xs font-mono transition-colors self-start sm:self-auto"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isFailed && data?.error && (
                  <p className="text-[11px] text-rose-300/90 font-mono pt-1 break-all break-words leading-relaxed">
                    {data.error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Terminal Console Stream */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Console Output</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {data?.logs?.length || 0} events
              </span>
            </div>

            <div className="bg-black/95 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-zinc-800/80 font-mono text-xs max-h-48 sm:max-h-56 overflow-y-auto space-y-1.5 shadow-inner">
              {(!data?.logs || data.logs.length === 0) ? (
                <div className="text-zinc-600 italic py-2 text-[11px]">
                  Waiting for portal stream events...
                </div>
              ) : (
                data.logs.map((log, index) => {
                  const time = new Date(log.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] leading-relaxed ${
                        log.type === 'success'
                          ? 'text-emerald-400'
                          : log.type === 'error'
                          ? 'text-rose-400'
                          : log.type === 'warning'
                          ? 'text-amber-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      <span className="text-zinc-600 shrink-0">[{time}]</span>
                      <span className="text-zinc-500 font-bold shrink-0">
                        [STEP {log.step}]
                      </span>
                      <span className="break-all break-words font-bangla">
                        {isBn && log.messageBn ? log.messageBn : log.message}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3.5 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 font-bangla text-center sm:text-left">
            {isCompleted
              ? isBn
                ? 'আবেদন সম্পন্ন হয়েছে! অফিসিয়াল কনফার্মেশন পিডিএফ ডাউনলোড করুন।'
                : 'Form successfully registered on the portal! Ready to download.'
              : isProcessing
              ? isBn
                ? 'আপনি এই পেজ ত্যাগ করলেও ব্যাকগ্রাউন্ডে অটোমেশন চলতে থাকবে।'
                : 'Automation continues running in background if closed.'
              : isBn
              ? 'ত্রুটি সমাধান করে ড্যাশবোর্ড থেকে পুনরায় আবেদন করতে পারেন।'
              : 'You can fix errors and retry anytime from dashboard.'}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto justify-end">
            {(isCompleted || Boolean(data?.webFileNumber)) && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowChecklistModal(true)}
                  className="w-full sm:w-auto rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs gap-1.5 border border-zinc-700 shadow-sm"
                >
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isBn ? 'আইভ্যাক চেকলিস্ট' : 'IVAC Checklist'}</span>
                </Button>

                <a
                  href={`/api/applications/${applicationId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</span>
                  </Button>
                </a>
              </>
            )}

            {onViewDashboard && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewDashboard}
                className="w-full sm:w-auto rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xs gap-1.5"
              >
                <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}

            {isFailed ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs border border-zinc-800"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </Button>
            ) : !isCompleted && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl text-zinc-400 hover:text-zinc-200 text-xs"
              >
                {isBn ? 'ব্যাকগ্রাউন্ডে রাখুন' : 'Run in Background'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Embedded IVAC Checklist Modal */}
      <IvacChecklistModal
        applicationId={applicationId}
        isOpen={showChecklistModal}
        onClose={() => setShowChecklistModal(false)}
      />
    </div>
  );
}
