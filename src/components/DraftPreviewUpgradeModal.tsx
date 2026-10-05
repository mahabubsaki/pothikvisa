'use client';

import React from 'react';
import Link from 'next/link';
import { X, Sparkles, FileText, CheckCircle2, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';

interface DraftPreviewUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DraftPreviewUpgradeModal({
  isOpen,
  onClose,
}: DraftPreviewUpgradeModalProps) {
  const { isBn } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden text-zinc-900">
        {/* Header with gradient badge */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50 via-zinc-50 to-white border-b border-zinc-100 flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold px-2 py-0.5">
                <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                {isBn ? 'Standard ও Pro এক্সক্লুসিভ' : 'Standard & Agency Pro Feature'}
              </Badge>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-bangla flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isBn ? 'ড্রাফট পিডিএফ প্রিভিউ আনলক করুন' : 'Unlock Official Draft Preview'}</span>
            </h3>
            <p className="text-xs text-zinc-600 font-bangla leading-relaxed">
              {isBn
                ? 'আবেদনের আগেই সরকারি মূল ফর্মের হুবহু ২-পৃষ্ঠা প্রিভিউ ও বারকোড যাচাই করার সুবিধা শুধুমাত্র Standard ও Agency Pro প্ল্যানে উপলব্ধ।'
                : 'Pixel-perfect 2-page canvas replica with authentic 1D & 2D barcodes is available on Standard and Agency Pro plans.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-bangla">
              {isBn ? 'ড্রাফট প্রিভিউ-এর প্রিমিয়াম সুবিধাসমূহ:' : 'Included in Draft Preview:'}
            </h4>
            <div className="space-y-2 text-xs font-bangla">
              <div className="flex items-start gap-2 text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? 'সরকারি মূল পোর্টালের হুবহু কালার স্কিম, ফন্ট ও ২-পৃষ্ঠার লেআউট।'
                    : '100% exact replica of official Indian visa portal layout and fonts.'}
                </span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? 'ডাইনামিক 1D বারকোড এবং সেকশন D-এর খাঁটি 2D PDF417 বারকোড ভেরিফিকেশন।'
                    : 'Dynamic 1D barcode and Section D authentic 2D PDF417 barcode rendering.'}
                </span>
              </div>
              <div className="flex items-start gap-2 text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? 'ব্রাউজারে সরাসরি ক্যানভাস প্রিভিউ — কোনো ফাইল ডাউনলোড বা আইডিএম (IDM) ঝুটঝামেলা ছাড়া।'
                    : 'In-browser canvas preview with zero download popups or IDM interference.'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link
              href="/checkout?plan=standard"
              className="p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Standard</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">৩০০ ৳</Badge>
                </div>
                <p className="text-[11px] text-zinc-600 mt-1 font-bangla">
                  {isBn ? 'ড্রাফট প্রিভিউ + প্রায়োরিটি কিউ (র‍্যাংক ২)' : 'Draft Preview + Priority Queue'}
                </p>
              </div>
              <div className="mt-3 flex items-center text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                <span>{isBn ? 'আপগ্রেড করুন' : 'Upgrade Now'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/checkout?plan=agency"
              className="p-3.5 rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">Agency Pro</span>
                  <Badge variant="outline" className="text-zinc-800 border-zinc-300 text-[10px]">৫০০ ৳</Badge>
                </div>
                <p className="text-[11px] text-zinc-600 mt-1 font-bangla">
                  {isBn ? 'আনলিমিটেড + ব্যাচ প্রসেসিং + র‍্যাংক ১' : 'Unlimited + Batch Queue + Rank 1'}
                </p>
              </div>
              <div className="mt-3 flex items-center text-xs font-bold text-zinc-700 group-hover:text-zinc-900">
                <span>{isBn ? 'Agency Pro নিন' : 'Get Agency Pro'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-xl"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
