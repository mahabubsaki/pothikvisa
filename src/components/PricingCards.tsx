'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Check, ShieldCheck, ArrowRight, Sparkles, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { toBnDigits } from '@/lib/utils';

export function PricingCards() {
  const { t, isBn } = useLanguage();

  const pricingPlans = [
    {
      id: 'starter',
      name: isBn ? 'স্টার্টার' : 'Starter',
      bengaliTag: 'ব্যক্তিগত',
      price: '150',
      period: isBn ? '/ মাস' : '/ month',
      description: isBn
        ? 'নিজে বা পরিবারের ইন্ডিয়ান ভিসা ওয়েব ফাইলের জন্য সবচেয়ে সহজ ও সাশ্রয়ী প্যাকেজ।'
        : 'Designed for individual travelers submitting personal or family visa web files.',
      quota: isBn ? '৭৫টি ওয়েব ফাইল / মাস (২ ৳ / ফাইল)' : '75 Web Files / month (2 ৳ / file)',
      badge: isBn ? 'সাশ্রয়ী প্ল্যান' : 'Fair Value',
      features: isBn
        ? [
            '৭৫টি ভিসা ওয়েব ফাইল তৈরি (মাত্র ২ ৳ / ফাইল)',
            '৫টি আবেদনকারী প্রোফাইল ভল্টে সংরক্ষণ',
            '৯টি ধাপেই শতভাগ নির্ভুল অটো-ফিল',
            'তাত্ক্ষণিক সিকিউরিটি ভেরিফিকেশন',
            'কনস্যুলার মাপ অনুযায়ী ২×২ ইঞ্চি ছবি সাইজিং',
            'জমার আগে সব তথ্য প্রিভিউ ও চেক',
            'সার্ভার ড্রপ হলে স্মার্ট সেশন রিকভারি',
            'প্রিন্টযোগ্য অফিশিয়াল ৪-পৃষ্ঠার আবেদন পিডিএফ',
          ]
        : [
            '75 automated Web File generations (2 ৳ / file)',
            '5 applicant profiles in Vault (Load from saved profiles)',
            'Automates all 9 form steps',
            'Instant security clearance verification',
            'Automated consular photo adaptation',
            'Pre-submission verification review',
            'Smart session resume on connection drops',
            'Official printable PDF generation',
          ],
      ctaText: isBn ? 'স্টার্টার প্ল্যান নিন (১৫০ ৳)' : 'Choose Starter (150 ৳)',
      highlighted: false,
    },
    {
      id: 'standard',
      name: isBn ? 'স্ট্যান্ডার্ড' : 'Standard',
      bengaliTag: 'সবচেয়ে জনপ্রিয়',
      price: '300',
      period: isBn ? '/ মাস' : '/ month',
      description: isBn
        ? 'নিয়মিত ভ্রমণকারী, চিকিৎসা প্রার্থী ও ভিসা কনসালট্যান্টদের জন্য দ্রুতগতির ২০০টি ওয়েব ফাইল।'
        : 'For frequent visitors, medical travelers, and power users creating up to 200 web files.',
      quota: isBn ? '২০০টি ওয়েব ফাইল / মাস (১.৫ ৳ / ফাইল)' : '200 Web Files / month (1.5 ৳ / file)',
      badge: isBn ? 'সবচেয়ে জনপ্রিয়' : 'Most Popular',
      features: isBn
        ? [
            '২০০টি ভিসা ওয়েব ফাইল তৈরি (মাত্র ১.৫ ৳ / ফাইল)',
            '১০টি আবেদনকারী প্রোফাইল ভল্টে সংরক্ষণ',
            'স্টার্টার প্ল্যানের সকল সুবিধা অন্তর্ভুক্ত',
            'পাসপোর্ট থেকে তথ্য অটো-রিডিং ও ইনপুট',
            'পিক্সেল-পারফেক্ট সরকারি পিডিএফ প্রিভিউ',
            'যে কোনো ধাপে ফাইল পরিবর্তন ও রিজিউম',
            'উচ্চগতির সার্ভার ও প্রায়োরিটি রিট্রাই',
            'হোয়াটসঅ্যাপে সরাসরি প্রায়োরিটি সাপোর্ট',
          ]
        : [
            '200 automated Web File generations (1.5 ৳ / file)',
            '10 applicant profiles in Vault (Load from saved profiles)',
            'Everything included in Starter',
            'Automated passport document reading',
            'Pixel-perfect official PDF preview draft',
            'Interactive step resume with file replacement',
            'High-priority execution speed & retry handling',
            'Direct WhatsApp priority support',
          ],
      ctaText: isBn ? 'স্ট্যান্ডার্ড প্ল্যান নিন (৩০০ ৳)' : 'Choose Standard (300 ৳)',
      highlighted: true,
    },
    {
      id: 'agency',
      name: isBn ? 'এজেন্সি প্রো' : 'Agency Pro',
      bengaliTag: 'সীমাহীন প্যাক',
      price: '500',
      period: isBn ? '/ মাস' : '/ month',
      description: isBn
        ? 'সাইবার ক্যাফে ও এজেন্সির জন্য এআই ফর্ম ফিলার (WhatsApp/Excel অটোফিল) ও সীমাহীন ওয়েব ফাইল।'
        : 'Built for cyber cafes and agencies: includes Smart AI Form Filler (WhatsApp/Excel autofill) and unlimited volume.',
      quota: isBn ? 'আনলিমিটেড ওয়েব ফাইল / মাস' : 'Unlimited Web Files / month',
      badge: isBn ? 'এজেন্সি স্পেশাল' : 'Agency Choice',
      features: isBn
        ? [
            '✨ স্মার্ট এআই ফর্ম ফিলার (WhatsApp / Excel রো অটোফিল)',
            'আনলিমিটেড ওয়েব ফাইল তৈরি (কোনো লিমিট নেই)',
            '৫০টি ক্লায়েন্ট প্রোফাইল ভল্টে সংরক্ষণ',
            'স্ট্যান্ডার্ড প্ল্যানের সকল সুবিধা অন্তর্ভুক্ত',
            'একসাথে একাধিক আবেদন দ্রুত প্রসেসিং',
            'ডেডিকেটেড প্রায়োরিটি সার্ভার কিউ',
            'ক্লায়েন্ট প্রোফাইল ও ফাইল আর্কাইভ',
            'ওয়েব ফাইল নম্বর ও রিসিট ট্র্যাকিং',
            'হটলাইন ও ডেডিকেটেড ম্যানেজার সাপোর্ট',
          ]
        : [
            '✨ Smart AI Form Filler (WhatsApp / Excel text autofill)',
            'Unlimited Web File generations (Uncapped volume)',
            '50 client profiles in Vault (Load from saved profiles)',
            'Everything included in Standard',
            'Multi-applicant batching & fast processing',
            'Instant dedicated priority queue',
            'Client profile management & quick search',
            'Official confirmation receipt archive',
            'Phone hotline & dedicated agent onboarding',
          ],
      ctaText: isBn ? 'এজেন্সি প্রো নিন (৫০০ ৳)' : 'Choose Agency Pro (500 ৳)',
      highlighted: false,
    },
  ];

  return (
    <div className="space-y-10">
      
      {/* Free Trial Highlight Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border-2 border-emerald-300/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Gift className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-emerald-950 font-bangla">
                {isBn ? '🎁 নতুন ইউজারদের জন্য ৩টি ওয়েব ফাইল + ১টি প্রোফাইল ভল্ট সেভ সম্পূর্ণ ফ্রি ট্রায়াল (১ দিন)!' : '🎁 Free Trial: 3 Web Files + 1 Saved Profile Vault (1 Day) on Signup!'}
              </h3>
              <Badge className="bg-emerald-600 text-white border-0 text-[10px] font-bold uppercase tracking-wider">
                {isBn ? '০ ৳ / নো ক্রেডিট কার্ড' : '0 ৳ / No Card Required'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-bangla">
              {isBn
                ? 'পেমেন্ট করার আগেই স্বয়ংক্রিয় ফর্ম ফিলআপ, ১টি প্রোফাইল ভল্টে সংরক্ষণ, ২×২ ছবি ক্রপ ও সরকারি ৪-পাতার পিডিএফ স্পিড নিজে তৈরি করে যাচাই করুন।'
                : 'Test automated form fill-up, 1 applicant profile vault save, 2×2 photo formatting, and official 4-page PDF speed with zero upfront payment commitment.'}
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 shadow-xs">
          <Link href="/sign-up">
            <span>{isBn ? '৩টি ফ্রি ফাইলসহ সাইন আপ' : 'Claim 3 Free Files'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </Button>
      </motion.div>

      {/* 3-card pricing grid with high-intent editorial styling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {pricingPlans.map((plan, index) => {
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              whileHover={{ y: -4 }}
              className={`flex flex-col bg-white p-8 rounded-2xl border transition-all relative ${
                plan.highlighted
                  ? 'border-black shadow-lg ring-1 ring-black'
                  : 'border-[#EAEAEA] hover:border-[#CCCCCC] shadow-2xs'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant={plan.highlighted ? 'default' : 'secondary'} className="gap-1 py-1 px-3">
                    {plan.highlighted && <Sparkles className="w-3 h-3 text-amber-400" />}
                    <span>{plan.badge}</span>
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className="h-16 flex flex-col justify-start">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-black">{plan.name}</h3>
                  <span className="text-xs font-semibold text-[#555555] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#EAEAEA]">
                    {plan.bengaliTag}
                  </span>
                </div>
                <div className="text-xs font-semibold text-emerald-700 pt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>{plan.quota}</span>
                </div>
              </div>

              {/* Price */}
              <div className="py-5 border-b border-[#EAEAEA] flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-black tracking-tight font-mono">
                  {isBn ? toBnDigits(plan.price) : plan.price} ৳
                </span>
                <span className="text-xs text-[#888888] font-medium">{plan.period}</span>
              </div>

              {/* Description */}
              <p className="min-h-[56px] text-xs text-[#555555] py-4 leading-relaxed border-b border-[#EAEAEA]">
                {plan.description}
              </p>

              {/* Feature List */}
              <ul className="py-6 space-y-3 text-xs text-black flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug text-[#333333]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="mt-auto pt-4 border-t border-[#EAEAEA]">
                <Button
                  asChild
                  variant={plan.highlighted ? 'default' : 'secondary'}
                  className="w-full text-xs sm:text-sm font-semibold h-11"
                >
                  <Link href={`/checkout?plan=${plan.id}`}>
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* MFS Payment Details Card */}
      <div className="bg-[#FAFAFA] p-6 sm:p-8 rounded-2xl border border-[#EAEAEA] max-w-4xl mx-auto space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <h4 className="text-base font-bold text-black">
              {isBn ? 'বিকাশ, নগদ ও রকেটের মাধ্যমে নির্ভরযোগ্য পেমেন্ট' : 'Transparent payment via bKash, Nagad, or Rocket'}
            </h4>
          </div>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold shrink-0">
            <Link href="/checkout">
              <span>{isBn ? 'পেমেন্ট পেজে যান' : 'Go to Checkout'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        <p className="text-xs text-[#555555] leading-relaxed">
          {isBn
            ? 'আমরা সরাসরি বাংলাদেশি টাকায় মোবাইল ফিনান্সিয়াল সার্ভিস গ্রহণ করি। আপনার পছন্দের প্যাকেজের টাকা আমাদের নির্ধারিত নম্বরে সেন্ড মানি করুন এবং চেকআউটে আপনার নম্বর ও ট্রানজেকশন আইডি (TrxID) দিন। আমাদের টিম ভেরিফাই করার সাথে সাথেই অ্যাকাউন্ট সক্রিয় হয়ে যাবে।'
            : 'We accept direct Mobile Financial Service (MFS) payments in Bangladeshi Taka. Send money to our designated wallet, enter your sender phone number and Transaction ID (TrxID) upon checkout, and your subscription activates immediately upon verification.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="bg-white p-3.5 rounded-xl border border-[#EAEAEA] text-xs space-y-1 shadow-2xs">
            <div className="font-bold text-black flex items-center justify-between">
              <span>{isBn ? 'বিকাশ (bKash)' : 'bKash (বিকাশ)'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">{isBn ? 'ব্যক্তিগত' : 'Personal'}</span>
            </div>
            <div className="font-mono text-black text-sm font-bold">
              {isBn ? toBnDigits('01714269744') : '01714269744'}
            </div>
            <div className="text-[10px] text-[#888888]">{isBn ? 'সেন্ড মানি' : 'Send Money'}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#EAEAEA] text-xs space-y-1 shadow-2xs">
            <div className="font-bold text-black flex items-center justify-between">
              <span>{isBn ? 'নগদ (Nagad)' : 'Nagad (নগদ)'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">{isBn ? 'ব্যক্তিগত' : 'Personal'}</span>
            </div>
            <div className="font-mono text-black text-sm font-bold">
              {isBn ? toBnDigits('01714269744') : '01714269744'}
            </div>
            <div className="text-[10px] text-[#888888]">{isBn ? 'সেন্ড মানি' : 'Send Money'}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#EAEAEA] text-xs space-y-1 shadow-2xs">
            <div className="font-bold text-black flex items-center justify-between">
              <span>{isBn ? 'রকেট (Rocket)' : 'Rocket (রকেট)'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">{isBn ? 'ডাচ-বাংলা' : 'DBBL'}</span>
            </div>
            <div className="font-mono text-black text-sm font-bold">
              {isBn ? toBnDigits('017142697440') : '017142697440'}
            </div>
            <div className="text-[10px] text-[#888888]">{isBn ? 'সেন্ড মানি' : 'Send Money'}</div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default PricingCards;
