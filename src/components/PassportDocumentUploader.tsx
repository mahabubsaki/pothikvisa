'use client';

import React, { useState, useRef } from 'react';
import { FileText, Check, RefreshCw, Upload, AlertCircle, Sparkles, ShieldCheck, Trash2, Lock, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export interface ExtractedFields {
  surname: string;
  givenName: string;
  passportNumber: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'X';
  nationality: string;
  passportDateOfExpiry: string;
  passportDateOfIssue: string;
  passportPlaceOfIssue: string;
  birthCity: string;
  nationalIdNumber: string;
  previousPassportNumber?: string;
  hasOtherPassport?: boolean;
  fatherName: string;
  motherName: string;
  presentAddressLine1: string;
  presentCity: string;
  presentStateDistrict: string;
  postalCode: string;
  address: string;
}

interface PassportDocumentUploaderProps {
  onPassportExtracted: (fields: ExtractedFields, file: File) => void;
  onPdfUploaded?: (file: File) => void;
  onClear?: () => void;
  plan?: string;
  isStandardSubscriber?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  uploadedFileName?: string;
  uploadedFileSizeKb?: number;
}

export function PassportDocumentUploader({
  onPassportExtracted,
  onPdfUploaded,
  onClear,
  plan = 'starter',
  isStandardSubscriber = false,
  hasError = false,
  errorMessage,
  uploadedFileName,
  uploadedFileSizeKb,
}: PassportDocumentUploaderProps) {
  const { isBn } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(uploadedFileName || null);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(uploadedFileSizeKb || null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedFields | null>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (uploadedFileName) {
      setFileName(uploadedFileName);
      setFileSizeKb(uploadedFileSizeKb || 16);
    } else {
      setFileName(null);
      setFileSizeKb(null);
      setCurrentFile(null);
    }
  }, [uploadedFileName, uploadedFileSizeKb]);

  const processPassportFile = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMsg(
        isBn
          ? 'শুধুমাত্র পাসপোর্ট বায়ো-ডাটা পিডিএফ (.pdf) ফাইল গ্রহণযোগ্য। কোনো ছবি ফাইল গ্রহণযোগ্য নয়।'
          : 'Only passport bio-data PDF (.pdf) files are acceptable. Images are not supported.'
      );
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    if (sizeKb < 10) {
      setErrorMsg(
        isBn
          ? `পিডিএফ ফাইল সাইজ (${sizeKb} KB) খুব ছোট। ন্যূনতম ১০ KB আবশ্যক।`
          : `PDF file size (${sizeKb} KB) is too small. Minimum 10 KB required.`
      );
      return;
    }

    const maxLimitKb = isStandardSubscriber ? 10 * 1024 : 500;
    if (sizeKb > maxLimitKb) {
      if (!isStandardSubscriber) {
        setErrorMsg(
          isBn
            ? `Starter প্ল্যানে পিডিএফের সাইজ সর্বোচ্চ ৫০০ KB। ১০ MB পর্যন্ত বড় ফাইল আপলোড করতে Standard বা Agency Pro প্ল্যানে আপগ্রেড করুন। (${sizeKb} KB আপলোড করেছেন)`
            : `On Starter plan, PDF size limit is 500 KB. Upgrade to Standard or Agency Pro to upload files up to 10 MB. (Uploaded: ${sizeKb} KB)`
        );
      } else {
        setErrorMsg(
          isBn
            ? `পিডিএফ ফাইলের সাইজ (${(sizeKb / 1024).toFixed(1)} MB) খুব বেশি। সর্বোচ্চ ১০ MB পর্যন্ত ফাইল গ্রহণযোগ্য।`
            : `PDF file size (${(sizeKb / 1024).toFixed(1)} MB) is too large. Maximum 10 MB allowed.`
        );
      }
      return;
    }

    setFileName(file.name);
    setFileSizeKb(sizeKb);
    setCurrentFile(file);
    setIsAutoFilled(false);
    setErrorMsg(null);
    setExtracting(true);

    // Notify parent immediately that valid PDF document is attached
    if (onPdfUploaded) {
      onPdfUploaded(file);
    }

    try {
      const formData = new FormData();
      formData.append('passport', file);

      const res = await fetch('/api/passport/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            (isBn
              ? 'পাসপোর্টের নিচের দুটি লাইন (MRZ) পড়া যায়নি। তবে পিডিএফটি সঠিকভাবে যুক্ত হয়েছে।'
              : 'Could not parse MRZ lines automatically. However, the passport PDF has been attached successfully.')
        );
      }

      setExtractedData(data.fields);
      // NOTE: We deliberately DO NOT auto-fill immediately per user request.
      // Auto-fill is executed via the explicit button below if standard subscription holder.
    } catch (err: unknown) {
      setErrorMsg(
        (err instanceof Error ? err.message : '') ||
          (isBn
            ? 'পাসপোর্ট প্রসেসিংয়ে সমস্যা হয়েছে। অনুগ্রহ করে ফাইল চেক করুন।'
            : 'Error processing passport document.')
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleApplyAutoFill = () => {
    if (!extractedData || !currentFile) return;
    onPassportExtracted(extractedData, currentFile);
    setIsAutoFilled(true);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    setFileSizeKb(null);
    setCurrentFile(null);
    setExtractedData(null);
    setIsAutoFilled(false);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) {
      onClear();
    }
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPassportFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
          <h3 className="text-xs font-bold text-zinc-900 font-bangla truncate">
            {isBn ? 'পাসপোর্ট বায়ো-ডাটা পিডিএফ (Passport PDF)' : 'Passport Bio-Data PDF'}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold font-mono">
            {isStandardSubscriber ? '*PDF ONLY (10 KB - 10 MB)' : '*PDF ONLY (10-500 KB)'}
          </Badge>
          {hasError && !extractedData && !fileName && (
            <Badge className="bg-rose-600 text-white text-[10px] font-bold font-mono">
              REQUIRED
            </Badge>
          )}
          {(fileName || extractedData) && (
            <button
              type="button"
              onClick={handleRemove}
              title={isBn ? 'পিডিএফ মুছে ফেলুন' : 'Remove PDF'}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'মুছুন' : 'Remove'}</span>
            </button>
          )}
        </div>
      </div>

      <input
        id="passport-pdf-upload-input"
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processPassportFile(e.target.files[0]);
          }
        }}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={handleTriggerFileInput}
        className={`border-2 border-dashed rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 cursor-pointer transition-all ${
          extractedData || fileName
            ? 'border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/40'
            : hasError
            ? 'border-rose-400 bg-rose-50/20 hover:bg-rose-50/40'
            : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
        }`}
      >
        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg border flex flex-col items-center justify-center shrink-0 shadow-inner ${
          hasError && !extractedData && !fileName ? 'bg-rose-50/50 border-rose-300' : 'bg-zinc-100 border-zinc-200'
        }`}>
          {extracting ? (
            <div className="flex flex-col items-center gap-1 p-2 text-center">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-800 font-bangla">
                {isBn ? 'পড়া হচ্ছে...' : 'Scanning...'}
              </span>
            </div>
          ) : extractedData ? (
            <div className="flex flex-col items-center gap-0.5 p-2 text-center text-emerald-700">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <span className="text-[10px] font-black uppercase font-mono tracking-wider truncate max-w-[70px]">
                {extractedData.passportNumber}
              </span>
              <span className="text-[9px] text-zinc-500 font-bangla">
                {isBn ? 'সংযুক্ত' : 'Attached'}
              </span>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-0.5 p-2 text-center text-emerald-700">
              <Check className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
              <span className="text-[9px] font-mono truncate max-w-[70px]">
                {fileName}
              </span>
              <span className="text-[9px] text-zinc-500 font-bangla">
                {fileSizeKb} KB
              </span>
            </div>
          ) : (
            <div className={`flex flex-col items-center p-2 text-center ${
              hasError ? 'text-rose-500' : 'text-zinc-400'
            }`}>
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold font-bangla">
                {isBn ? 'ক্লিক বা ড্রপ' : 'Click / Drop'}
              </span>
              <span className="text-[8px] font-mono">
                {isStandardSubscriber ? '(10 KB - 10 MB)' : '(10-500 KB)'}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-1.5 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <span className={`text-xs font-bold font-bangla truncate ${
              hasError && !extractedData && !fileName ? 'text-rose-700' : 'text-zinc-900'
            }`}>
              {fileName
                ? isBn
                  ? 'পিডিএফ ফাইল সফলভাবে সংযুক্ত হয়েছে'
                  : 'PDF Document Attached'
                : isBn
                ? 'পাসপোর্ট বায়ো-ডাটা পিডিএফ নির্বাচন করুন (বাধ্যতামূলক)'
                : 'Select Passport Bio-Data PDF (Mandatory)'}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </div>

          <p className="text-[11px] text-zinc-500 font-bangla leading-relaxed">
            {isStandardSubscriber
              ? (isBn
                  ? 'ক্লিক করে আপনার পাসপোর্ট বায়ো-ডাটা পিডিএফ নির্বাচন করুন (১০ KB - ১০ MB)।'
                  : 'Click to browse or drop your bio-data PDF (10 KB - 10 MB).')
              : (isBn
                  ? 'ক্লিক করে আপনার পাসপোর্ট বায়ো-ডাটা পিডিএফ নির্বাচন করুন (১০ KB - ৫০০ KB)।'
                  : 'Click to browse or drop your bio-data PDF (10 KB - 500 KB).')}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <label
              htmlFor="passport-pdf-upload-input"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-300 hover:border-zinc-500 rounded-lg shadow-2xs text-zinc-800 transition-all cursor-pointer font-bangla select-none"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{fileName ? (isBn ? 'ফাইল পরিবর্তন করুন' : 'Change PDF') : (isBn ? 'ফাইল নির্বাচন করুন' : 'Browse PDF')}</span>
            </label>

            {extractedData && (
              <Badge variant="outline" className="bg-white font-mono text-zinc-700 border-zinc-300 text-[10px]">
                {extractedData.passportNumber} ({extractedData.givenName})
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Auto-fill trigger button for Standard & Agency Pro subscription holders */}
      {extractedData && currentFile && (
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {isStandardSubscriber ? (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl">
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-950 font-bangla block">
                  {isBn ? 'পাসপোর্ট থেকে তথ্য অটো-ফিল করতে চান?' : 'Auto-fill form using Passport PDF?'}
                </span>
                <span className="text-[11px] text-emerald-700 font-bangla block">
                  {isBn
                    ? 'স্ট্যান্ডার্ড ও এজেন্সি প্রো সাবস্ক্রিপশন সচল রয়েছে। নিচের বাটনে ক্লিক করলে ২য় ও ৩য় ধাপ স্বয়ংক্রিয়ভাবে পূরণ হবে।'
                    : 'Standard & Agency Pro subscription active. Click button below to populate Steps 2 & 3.'}
                </span>
              </div>
              <Button
                type="button"
                onClick={handleApplyAutoFill}
                disabled={isAutoFilled}
                className={cn(
                  'shrink-0 text-xs font-bold font-bangla h-9 px-4 transition-all shadow-sm',
                  isAutoFilled
                    ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-200 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                {isAutoFilled ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>{isBn ? 'ফর্ম পূরণ করা হয়েছে' : 'Form Populated'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>{isBn ? 'পাসপোর্ট থেকে তথ্য পূরণ করুন' : 'Auto-Fill Form Now'}</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 font-bangla">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-[11px] text-amber-800 font-medium">
                  {isBn
                    ? 'পাসপোর্ট থেকে স্বয়ংক্রিয় এআই ফর্ম পূরণের জন্য স্ট্যান্ডার্ড বা এজেন্সি প্রো সাবস্ক্রিপশন প্রয়োজন।'
                    : 'AI auto-fill from Passport PDF requires a Standard or Agency Pro Subscription.'}
                </span>
              </div>
              <Badge className="bg-amber-600 text-white text-[10px] shrink-0 font-bangla">
                {isBn ? 'স্ট্যান্ডার্ড ও প্রো ফিচার' : 'Standard & Pro Tier'}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Portal Document Status Bar (Mirrors Official Step 7 Table) */}
      <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-zinc-400 font-bold">#1</span>
          <span className="font-bold text-zinc-800 font-bangla truncate">
            {isBn ? 'পাসপোর্ট বায়ো-ডাটা পেজ (বাধ্যতামূলক)' : 'Copy of Passport Bio-Data Page (Mandatory)'}
          </span>
        </div>
        <Badge
          className={cn(
            'text-[10px] font-mono font-bold shrink-0',
            fileName || extractedData
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-zinc-200 text-zinc-600 border-zinc-300'
          )}
        >
          {fileName || extractedData ? (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              Uploaded
            </span>
          ) : (
            'Not Uploaded'
          )}
        </Badge>
      </div>

      {/* AI Passport PDF Optimizer Callout */}
      {isStandardSubscriber ? (
        <div className="flex items-center gap-2 text-xs text-sky-800 bg-sky-50/70 border border-sky-200/80 rounded-xl px-3 py-2 font-bangla">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>
            {isBn
              ? 'স্ট্যান্ডার্ড ও এজেন্সি প্রো সুবিধা: যেকোনো সাইজের পিডিএফ আপলোড করুন (১০ MB পর্যন্ত), আমরা স্বয়ংক্রিয়ভাবে অপটিমাইজ করে নেব।'
              : 'Standard & Agency Pro Feature: Upload any size of PDF (up to 10 MB) — we will enhance based on requirement.'}
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-sky-200/90 bg-sky-50/60 p-3 sm:p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-sky-950 font-bangla">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>{isBn ? 'এআই পাসপোর্ট পিডিএফ অপটিমাইজার সচল' : 'AI Passport PDF Optimizer Active'}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[11px] font-medium">
            <div className="bg-white/95 border border-sky-200/80 rounded-xl p-2 text-center shadow-2xs flex flex-col justify-center min-w-0">
              <span className="text-[10px] text-zinc-500 font-bangla block truncate leading-tight">
                {isBn ? 'স্বয়ংক্রিয় ফরম্যাট' : 'Auto Format'}
              </span>
              <span className="font-bold text-zinc-900 font-mono text-[11px] block mt-0.5 truncate">
                PDF Only
              </span>
            </div>
            <div className="bg-white/95 border border-sky-200/80 rounded-xl p-2 text-center shadow-2xs flex flex-col justify-center min-w-0">
              <span className="text-[10px] text-zinc-500 font-bangla block truncate leading-tight">
                {isBn ? 'সাইজ অপটিমাইজ' : 'Size Limit'}
              </span>
              <span className="font-bold text-zinc-900 font-mono text-[11px] block mt-0.5 truncate">
                10–500 KB
              </span>
            </div>
            <div className="bg-white/95 border border-sky-200/80 rounded-xl p-2 text-center shadow-2xs flex flex-col justify-center min-w-0">
              <span className="text-[10px] text-zinc-500 font-bangla block truncate leading-tight">
                {isBn ? 'ডকুমেন্ট' : 'Doc Type'}
              </span>
              <span className="font-bold text-zinc-900 font-bangla text-[11px] block mt-0.5 truncate">
                {isBn ? 'বায়ো পাতা (A4)' : 'Bio Page (A4)'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-sky-950 font-bangla leading-relaxed pt-0.5">
            {isBn
              ? 'পাসপোর্ট বায়ো-ডাটা পিডিএফ আপলোড করুন। আমাদের ইঞ্জিন স্বয়ংক্রিয়ভাবে এটিকে সরকারি এ৪ পিডিএফ ফরম্যাটে রূপান্তর ও ৫০০ KB এর মধ্যে অপটিমাইজ করবে।'
              : 'Upload your passport bio-data PDF — our engine automatically optimizes the size under 500 KB for zero IVAC rejection.'}
          </p>
        </div>
      )}

      {(errorMessage || errorMsg) && (
        <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 p-2.5 sm:p-3 rounded-xl flex items-start gap-2 font-bangla">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <span className="font-bold block text-xs">
              {isBn ? 'পাসপোর্ট পিডিএফ ত্রুটি' : 'Passport PDF Error'}
            </span>
            <span className="text-[11px] leading-relaxed block break-words">{errorMessage || errorMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
