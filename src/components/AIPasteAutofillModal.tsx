'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  FileSpreadsheet,
  MessageSquare,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { VisaApplicantProfile } from '@/types/profile';
import { useLanguage } from '@/context/LanguageContext';

interface AIPasteAutofillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileExtracted: (
    profile: VisaApplicantProfile,
    meta: {
      fieldsCount: number;
      detectedFormat: string;
      sanitizationNotices: string[];
      providerUsed: string;
    }
  ) => void;
}

const SAMPLE_WHATSAPP = `Bhai eta amar client Md. Robiul Islam er visa file:
Passport: A17601265
Issue: 12/03/2021, Exp: 11/03/2031, Place: Dhaka
DOB: 15 June 1995 in Dhaka
Religion: Islam, Education: Graduate, Marital: Married
Father: Late Abdur Rahim
Mother: Fatema Begum
Wife: Tahmina Akter
Address: House 42, Road 11, Block D, Mirpur, Dhaka-1216
Mobile: 01712345678, Email: robiul.islam95@gmail.com
Occupation: Senior Software Engineer at Walton Digitech Ltd
Trip: 10 days tourist visa to Kolkata via Haridaspur on 15/11/2026
Stay: Lindsay Hotel, 8B Lindsay Street, New Market, Kolkata, Phone 03322521111
Emergency BD contact: Brother Kamal Hossain, 01811223344, Mirpur Dhaka`;

const SAMPLE_EXCEL = `Client Name	Md. Arif Hossain
Passport Number	A09482173
Date of Birth	14/08/1992
Passport Issue Date	10/05/2020
Passport Expiry Date	09/05/2030
Father Name	Abdul Jalil
Mother Name	Rezia Begum
Spouse Name	Sumi Akhter
Present Address	Flat 5A, Plot 14, Sector 7, Uttara, Dhaka 1230
Mobile	01819223344
Email	arif.hossain@eximbankbd.com
Occupation	Bank Officer
Employer	EXIM Bank Bangladesh Ltd
Hotel in India	The Oberoi Grand Kolkata
Hotel Phone	03322492323
BD Contact	Brother Tariqul Islam, 01712998877`;

export function AIPasteAutofillModal({
  isOpen,
  onClose,
  onProfileExtracted,
}: AIPasteAutofillModalProps) {
  const { isBn } = useLanguage();
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!rawText.trim()) {
      setErrorMsg(
        isBn
          ? 'অনুগ্রহ করে হোয়াটসঅ্যাপ মেসেজ, এক্সেল ডাটা বা বায়ো-ডাটা টেক্সট পেস্ট করুন।'
          : 'Please paste WhatsApp messages, Excel data, or bio-data text first.'
      );
      return;
    }

    setErrorMsg(null);
    setExtracting(true);

    try {
      const res = await fetch('/api/ai/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to extract profile');
      }

      onProfileExtracted(data.profile, {
        fieldsCount: data.fieldsCount,
        detectedFormat: data.detectedFormat,
        sanitizationNotices: data.sanitizationNotices || [],
        providerUsed: data.providerUsed,
      });

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during AI extraction.');
    } finally {
      setExtracting(false);
    }
  };

  const detectedFormat = rawText.includes('\t')
    ? 'Excel / TSV Table'
    : /client|vai|bhai|dob|passport/i.test(rawText)
    ? 'WhatsApp / Chat Notes'
    : rawText.trim()
    ? 'Unstructured Text'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-zinc-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight font-bangla">
                  {isBn ? '✨ স্মার্ট এআই ফর্ম ফিলার' : '✨ Smart AI Form Filler'}
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold">
                  {isBn ? 'পেইড (৫০০ ৳)' : 'Paid (500 ৳)'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 font-bangla mt-0.5">
                {isBn
                  ? 'হোয়াটসঅ্যাপ চ্যাট, এক্সেল রো বা বায়ো-ডাটা পেস্ট করুন — এক ক্লিকে ৯টি ধাপই পূরণ হবে'
                  : 'Paste WhatsApp messages, Excel rows, or raw client notes to auto-populate all 9 steps'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-bangla">
              {isBn ? 'নমুনা ডাটা লোড করুন:' : 'Load Sample Data:'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRawText(SAMPLE_WHATSAPP)}
                className="text-xs h-7 rounded-lg border-zinc-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 gap-1.5"
              >
                <MessageSquare className="w-3 h-3 text-emerald-600" />
                <span>{isBn ? 'হোয়াটসঅ্যাপ মেসেজ' : 'Sample WhatsApp'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRawText(SAMPLE_EXCEL)}
                className="text-xs h-7 rounded-lg border-zinc-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 gap-1.5"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>{isBn ? 'এক্সেল ডাটা' : 'Sample Excel'}</span>
              </Button>
              {rawText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRawText('')}
                  className="text-xs h-7 rounded-lg text-zinc-500 hover:text-rose-600 gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isBn ? 'মুছুন' : 'Clear'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Paste Textarea */}
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={9}
              placeholder={
                isBn
                  ? 'এখানে ক্লায়েন্টের যে কোনো মেসেজ, নোট বা এক্সেলের সারি পেস্ট করুন...\n\nউদাহরণ:\nক্লায়েন্ট: মোঃ আরিফুল ইসলাম\nপাসপোর্ট: A04523910, ইস্যু: 10/05/2021, মেয়াদ: 09/05/2031\nজন্ম: 12 Jan 1994, ঢাকা। পিতা: নূরুল হক, মাতা: জাহানারা বেগম...\nমোবাইল: 01711223344, হোটেল: ওবেরয় গ্র্যান্ড কলকাতা...'
                  : 'Paste raw client text, WhatsApp chats, or Excel spreadsheet copy here...\n\nExample:\nClient: Md. Robiul Islam\nPassport: A17601265, Issued Dhaka 12/03/2021, Exp: 11/03/2031\nDOB: 15 June 1995 in Dhaka. Married to Tahmina Akter.\nFather: Abdur Rahim. Mother: Fatema Begum.\nAddress: House 42, Road 11, Block D, Mirpur, Dhaka-1216. Phone: 01712345678...'
              }
              className="w-full text-xs font-mono p-4 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-zinc-50/60 leading-relaxed resize-none transition-all placeholder:text-zinc-400"
            />
            {detectedFormat && (
              <div className="absolute bottom-3 right-3">
                <Badge className="bg-zinc-900/90 text-white text-[10px] font-medium backdrop-blur-xs shadow-xs">
                  {detectedFormat}
                </Badge>
              </div>
            )}
          </div>

          {/* Feature Highlights Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-2.5 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight font-bangla">
                <strong className="text-zinc-900 font-bold block">
                  {isBn ? 'ডট মুক্ত নাম' : 'No Dots in Names'}
                </strong>
                <span className="text-zinc-500 text-[10px]">
                  {isBn ? 'Md. বা Dr. থেকে ডট স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়' : 'Auto strips dots (Md. -> MD)'}
                </span>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-2.5 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight font-bangla">
                <strong className="text-zinc-900 font-bold block">
                  {isBn ? 'ঠিকানা ৩৫ অক্ষরে সীমিত' : '35-Char Address Limit'}
                </strong>
                <span className="text-zinc-500 text-[10px]">
                  {isBn ? 'আইভ্যাক পোর্টালের সর্বোচ্চ সীমা অনুযায়ী প্রস্তুত' : 'Auto truncates address line 1'}
                </span>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-2.5 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight font-bangla">
                <strong className="text-zinc-900 font-bold block">
                  {isBn ? 'সঠিক কোড ও পোর্ট ম্যাপিং' : 'Consular Port Codes'}
                </strong>
                <span className="text-zinc-500 text-[10px]">
                  {isBn ? 'হরিদাসপুর, গেদে বা বাই এয়ার কোড নির্ধারণ' : 'Maps Haridaspur / Gede codes'}
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{isBn ? 'ত্রুটি' : 'Error'}</AlertTitle>
              <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200/90 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 font-bangla flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isBn
                ? 'আইভ্যাক কনস্যুলার নিয়মে ৯টি ধাপ স্বয়ংক্রিয়ভাবে পূরণ হবে'
                : 'Instantly populates all 9 steps with consular precision'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={extracting}
              className="rounded-xl text-xs"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleExtract}
              disabled={extracting || !rawText.trim()}
              className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
            >
              {extracting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isBn ? 'এআই পার্স করছে...' : 'Extracting with AI...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isBn ? 'অটো-ফিল করুন' : 'Extract & Fill Form'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
