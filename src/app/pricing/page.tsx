'use client';

import React from 'react';
import { PricingCards } from '@/components/PricingCards';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { Check, X, Sparkles, ShieldCheck, FileCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function PricingPage() {
  const { t, isBn } = useLanguage();

  const comparisonMatrix = [
    {
      feature: isBn ? 'মাসিক ওয়েব ফাইলের কোটা' : 'Monthly Web File quota',
      starter: isBn ? '৭৫টি ওয়েব ফাইল' : '75 Web Files',
      standard: isBn ? '২০০টি ওয়েব ফাইল' : '200 Web Files',
      agency: isBn ? 'সীমাহীন (আনলিমিটেড)' : 'Unlimited',
    },
    {
      feature: isBn ? 'পূর্ব সংরক্ষিত প্রোফাইল ভল্ট (পূর্বে সংরক্ষিত প্রোফাইল থেকে লোড)' : 'Saved Profile Vault (Load from saved profiles)',
      starter: isBn ? '৫টি প্রোফাইল' : '5 Profiles',
      standard: isBn ? '১০টি প্রোফাইল' : '10 Profiles',
      agency: isBn ? '৫০টি প্রোফাইল' : '50 Profiles',
    },
    {
      feature: isBn ? 'প্রতি ফাইলের গড় খরচ' : 'Cost per Web File',
      starter: isBn ? '২ ৳ / ফাইল' : '2 ৳ / file',
      standard: isBn ? '১.৫ ৳ / ফাইল' : '1.5 ৳ / file',
      agency: isBn ? 'সেরা সাশ্রয়ী' : 'Uncapped Value',
    },
    {
      feature: isBn ? 'সম্পূর্ণ ৯টি ধাপ স্বয়ংক্রিয় পূরণ' : '9-step continuous form fill',
      starter: true,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'তাৎক্ষণিক সিকিউরিটি ক্লিয়ারেন্স' : 'Instant security clearance verification',
      starter: true,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'কনস্যুলার ২×২ ফটো এআই অটো-এনহ্যান্সার ও বিউটিফায়ার' : 'AI Consular 2×2 Photo Enhancer & Beautifier',
      starter: true,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'বড় পাসপোর্ট পিডিএফ অটো-কম্প্রেশন (১০ MB পর্যন্ত)' : 'Large Passport PDF Auto-Compression (up to 10 MB)',
      starter: false,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'পাসপোর্ট পিডিএফ (.pdf) আপলোড সীমা' : 'Passport Bio-Data PDF (.pdf) upload limit',
      starter: isBn ? '১০–৫০০ KB (অফিসিয়াল সাইজ)' : '10–500 KB (Portal ready)',
      standard: isBn ? '১০ MB পর্যন্ত (স্বয়ংক্রিয় কম্প্রেশন)' : 'Up to 10 MB (Auto-compressed)',
      agency: isBn ? '১০ MB পর্যন্ত (স্বয়ংক্রিয় কম্প্রেশন)' : 'Up to 10 MB (Auto-compressed)',
    },
    {
      feature: isBn ? 'ছবি আপলোড সাইজ সীমা' : 'Photo upload size limit',
      starter: isBn ? '১০ KB – ১ MB' : '10 KB – 1 MB',
      standard: isBn ? '২০ MB পর্যন্ত' : 'Up to 20 MB',
      agency: isBn ? '২০ MB পর্যন্ত' : 'Up to 20 MB',
    },
    {
      feature: isBn ? 'সাবমিশন পূর্ববর্তী প্রি-চেক' : 'Pre-submission review verification',
      starter: true,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'অফিশিয়াল প্রিন্টযোগ্য ৪-পৃষ্ঠা পিডিএফ' : 'Official printable PDF delivery',
      starter: true,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'পাসপোর্ট ডকুমেন্ট অটো-ফিল (OCR)' : 'Passport document auto-fill (OCR extraction)',
      starter: false,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'পিক্সেল-পারফেক্ট পিডিএফ প্রিভিউ ড্রাফট' : 'Pixel-perfect PDF preview draft',
      starter: false,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'ফাইল পরিবর্তনের সাথে স্টেপ রিজিউম' : 'Interactive step resume with file replacement',
      starter: false,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'উচ্চ গতির সার্ভার প্রায়োরিটি' : 'Priority queue processing',
      starter: false,
      standard: true,
      agency: true,
    },
    {
      feature: isBn ? 'স্মার্ট এআই পেস্ট ফর্ম ফিলার (WhatsApp/Excel অটোফিল)' : 'Smart AI Form Filler (WhatsApp/Excel text autofill)',
      starter: false,
      standard: false,
      agency: true,
    },
    {
      feature: isBn ? 'একাধিক আবেদনকারী ব্যাচ প্রসেসিং' : 'Multi-applicant batch processing',
      starter: false,
      standard: false,
      agency: true,
    },
    {
      feature: isBn ? 'ক্লায়েন্ট প্রোফাইল হিস্টোরি ও দ্রুত অনুসন্ধান' : 'Client profile management & quick search',
      starter: isBn ? 'সর্বোচ্চ ৫টি প্রোফাইল' : 'Up to 5 profiles',
      standard: isBn ? 'সর্বোচ্চ ১০টি প্রোফাইল' : 'Up to 10 profiles',
      agency: isBn ? '৫০টি ক্লায়েন্ট প্রোফাইল' : 'Up to 50 profiles',
    },
    {
      feature: isBn ? 'সাপোর্ট চ্যানেল' : 'Support channel',
      starter: isBn ? 'ইমেইল সাপোর্ট' : 'Email',
      standard: isBn ? 'হোয়াটসঅ্যাপ প্রায়োরিটি' : 'WhatsApp',
      agency: isBn ? 'ফোন হটলাইন ও অনবোর্ডিং' : 'Phone Hotline',
    },
  ];

  return (
    <div className="py-12 md:py-20 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 vercel-radial">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('pricing.super_title')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">
          {t('pricing.title')}
        </h1>
        <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
          {t('pricing.desc')}
        </p>
      </div>

      {/* Pricing Cards */}
      <PricingCards />

      {/* Interactive Savings Calculator */}
      <div className="pt-6">
        <SavingsCalculator />
      </div>

      {/* Zero Document Rejection Guarantee Callout Banner */}
      <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>ZERO DOCUMENT REJECTION GUARANTEE</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-950 font-bangla tracking-tight">
              {isBn 
                ? 'ছবি বা পিডিএফ ভুলের কারণে আইভ্যাক (IVAC) এ ফর্ম বাতিলের কোনো ঝুঁকি নেই' 
                : 'Never get rejected at IVAC for photo or PDF specifications'}
            </h3>
            <p className="text-sm text-zinc-600 font-bangla leading-relaxed">
              {isBn
                ? 'সাধারণ দোকানে ছবি রিসাইজ বা ছবির ফরম্যাট মেলাতে আলাদা খরচ হয়। পথিক ভিসার বিল্ট-ইন ২×২ ফটো এডিটর যে কোনো সেলফিকে দূতাবাস-অনুমোদিত সাদা ব্যাকগ্রাউন্ডের ছবিতে রূপান্তর করে। স্ট্যান্ডার্ড ও এজেন্সি প্ল্যানে ১০ MB পর্যন্ত বড় সাইজের পাসপোর্ট পিডিএফ আপলোড করলেই তা স্বয়ংক্রিয়ভাবে সরকারি ৫০০ KB সীমায় অপটিমাইজ হয়ে যায়!'
                : 'Applicants typically spend extra at cyber cafes just resizing photos. PothikVisa\'s built-in 2×2 consular photo tool normalizes selfies to embassy-compliant white-background square photos. On Standard & Agency plans, large passport PDFs up to 10 MB are automatically compressed to the portal\'s strict 500 KB limit!'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
            <div className="bg-white border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block font-bangla">
                  {isBn ? 'স্বয়ংক্রিয় ২×২ ফটো বিউটিফায়ার' : 'Auto 2×2 Photo Beautifier'}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">Consular 2×2 (10 KB – 1 MB)</span>
              </div>
            </div>
            <div className="bg-white border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block font-bangla">
                  {isBn ? 'পাসপোর্ট পিডিএফ অপটিমাইজার' : 'Passport PDF 500 KB Optimizer'}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">Strict 10 KB – 500 KB A4 PDF</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Feature Comparison Table */}
      <div className="pt-8 space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-bold text-black tracking-tight">
            {isBn ? 'প্যাকেজগুলোর বিস্তারিত তুলনা' : 'Compare plan features'}
          </h2>
          <p className="text-sm text-[#555555]">
            {isBn
              ? 'তিনটি সাবস্ক্রিপশন টিয়ারের সকল ফিচারের বিস্তারিত তালিকা।'
              : 'Detailed breakdown of capabilities across all three subscription tiers.'}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#EAEAEA] bg-white shadow-2xs">
          <table className="w-full text-left text-sm text-black">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-xs uppercase tracking-wider text-[#666666]">
                <th className="py-4 px-6 font-semibold">{isBn ? 'ফিচার বা সক্ষমতা' : 'Feature capability'}</th>
                <th className="py-4 px-6 font-semibold text-center">{isBn ? 'Starter (150 ৳)' : 'Starter (150 ৳)'}</th>
                <th className="py-4 px-6 font-semibold text-center text-black font-bold">{isBn ? 'Standard (300 ৳)' : 'Standard (300 ৳)'}</th>
                <th className="py-4 px-6 font-semibold text-center">{isBn ? 'Agency Pro (500 ৳)' : 'Agency Pro (500 ৳)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {comparisonMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3.5 px-6 font-medium text-xs sm:text-sm text-black">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-6 text-center text-xs text-[#555555]">
                    {typeof row.starter === 'boolean' ? (
                      row.starter ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#CCCCCC] mx-auto" />
                      )
                    ) : (
                      row.starter
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-center text-xs text-black font-semibold bg-[#FAFAFA]">
                    {typeof row.standard === 'boolean' ? (
                      row.standard ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#CCCCCC] mx-auto" />
                      )
                    ) : (
                      row.standard
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-center text-xs text-[#555555]">
                    {typeof row.agency === 'boolean' ? (
                      row.agency ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-[#CCCCCC] mx-auto" />
                      )
                    ) : (
                      row.agency
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default PricingPage;
