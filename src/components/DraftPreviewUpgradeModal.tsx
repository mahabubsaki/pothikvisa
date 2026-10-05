'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { ACCESS_POLICY } from '@/lib/access-policy';

interface DraftPreviewUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DraftPreviewUpgradeModal({ isOpen, onClose }: DraftPreviewUpgradeModalProps) {
  const { isBn } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><FileText className="h-6 w-6" /></div>
        <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700"><Lock className="h-3.5 w-3.5" />Paid feature</div>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">{isBn ? 'অফিসিয়াল PDF প্রিভিউ আনলক করুন' : 'Unlock official PDF preview'}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{isBn ? 'PDF প্রিভিউ, পাসপোর্ট OCR, AI ফিলার এবং ব্যাচ প্রসেসিং পেইড প্ল্যানে অন্তর্ভুক্ত।' : 'PDF preview, passport OCR, AI extraction, and batch processing are included with Paid access.'}</p>
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between"><span className="font-bold">Paid</span><span className="text-lg font-black">৳{ACCESS_POLICY.paid.priceBdt}</span></div>
          <div className="mt-1 text-xs text-emerald-800">30 days · unlimited web files · 50 profiles</div>
        </div>
        <Button asChild className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700"><Link href="/checkout?plan=paid">{isBn ? 'পেইড নিন' : 'Upgrade to Paid'}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </div>
    </div>
  );
}
