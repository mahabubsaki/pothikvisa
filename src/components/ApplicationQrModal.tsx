'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  Copy,
  Check,
  QrCode as QrIcon,
  Smartphone,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import type { ApplicationItem } from '@/app/dashboard/page';

interface ApplicationQrModalProps {
  application: ApplicationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicationQrModal({
  application,
  isOpen,
  onClose,
}: ApplicationQrModalProps) {
  const { isBn } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const appId = application?.id || '';
  const webFileNo = application?.web_file_number || application?.temp_id || appId;
  const applicantName = application?.applicant_name || 'APPLICANT';
  const passportNumber = application?.passport_number || 'N/A';

  useEffect(() => {
    if (!isOpen || !application) {
      setQrDataUrl(null);
      return;
    }

    setLoading(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const pdfUrl = `${origin}/api/applications/${application.id}/pdf`;

    QRCode.toDataURL(pdfUrl, {
      width: 320,
      margin: 1.5,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#09090b',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
        setLoading(false);
      });
  }, [isOpen, application]);

  if (!isOpen || !application) return null;

  const pdfDownloadUrl = `/api/applications/${application.id}/pdf`;

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const fullUrl = `${origin}${pdfDownloadUrl}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadPdf = () => {
    window.open(pdfDownloadUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 font-bangla">
                {isBn ? 'আবেদন কিউআর কোড (QR Code)' : 'Application QR Code'}
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {webFileNo}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 text-center flex flex-col items-center">
          {/* Applicant Info Pills */}
          <div className="w-full bg-zinc-50 rounded-2xl p-3 border border-zinc-100 flex items-center justify-between text-xs font-mono">
            <div className="text-left truncate max-w-[170px]">
              <span className="text-[10px] uppercase text-zinc-400 block font-bangla">
                {isBn ? 'নাম' : 'Applicant'}
              </span>
              <span className="font-bold text-zinc-800 truncate block">
                {applicantName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-zinc-400 block font-bangla">
                {isBn ? 'পাসপোর্ট' : 'Passport'}
              </span>
              <span className="font-bold text-zinc-800">
                {passportNumber}
              </span>
            </div>
          </div>

          {/* Interactive QR Code Card */}
          <div
            onClick={handleDownloadPdf}
            className="group relative p-3 bg-white rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5"
            title={isBn ? 'পিডিএফ ডাউনলোড করতে ক্লিক করুন' : 'Click to download PDF'}
          >
            {loading ? (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400 font-bangla">
                  {isBn ? 'কিউআর কোড তৈরি হচ্ছে...' : 'Generating QR code...'}
                </span>
              </div>
            ) : qrDataUrl ? (
              <div className="relative">
                {/* QR Image */}
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${webFileNo}`}
                  className="w-56 h-56 sm:w-60 sm:h-60 object-contain rounded-xl block mx-auto transition-transform group-hover:scale-[1.02]"
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-emerald-950/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                  <Download className="w-8 h-8 mb-1.5 text-emerald-300 animate-bounce" />
                  <span className="text-xs font-bold font-bangla text-center">
                    {isBn ? 'ক্লিক করে PDF ডাউনলোড করুন' : 'Click to Download PDF'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-rose-500 text-xs font-bangla">
                {isBn ? 'কিউআর তৈরি করা যায়নি' : 'Failed to generate QR'}
              </div>
            )}

            {/* Click to download badge */}
            <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              <Download className="w-3 h-3 text-emerald-600" />
              <span>{isBn ? 'ক্লিক করলেই PDF ডাউনলোড হবে' : 'Click QR to Download PDF'}</span>
            </div>
          </div>

          {/* Smartphone Scan Instruction */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-bangla max-w-xs leading-relaxed">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isBn
                ? 'যেকোনো মোবাইল ক্যামেরা বা স্ক্যানার দিয়ে স্ক্যান করলে সরাসরি অফিসিয়াল ভিসা PDF ডাউনলোড হবে।'
                : 'Scan with any mobile camera or QR reader to directly download the official visa application PDF.'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <Button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl shadow-sm gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="w-full border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs h-10 rounded-xl gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{isBn ? 'কপি হয়েছে' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-500" />
                  <span>{isBn ? 'লিঙ্ক কপি করুন' : 'Copy PDF Link'}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Government PDF</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-800 font-medium"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
