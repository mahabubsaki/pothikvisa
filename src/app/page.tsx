'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { HomeHero } from '@/components/HomeHero';
import { BentoFeatures } from '@/components/BentoFeatures';
import { PricingCards } from '@/components/PricingCards';
import { FaqAccordion } from '@/components/FaqAccordion';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { SupportedCenters } from '@/components/SupportedCenters';
import { VisaTypeSelector } from '@/components/VisaTypeSelector';
import { FreeTrialSection } from '@/components/FreeTrialSection';
import { PothikVisaLogo } from '@/components/PothikVisaLogo';
import { ArrowRight, CheckCircle2, FileCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { toBnDigits } from '@/lib/utils';

export default function HomePage() {
  const { t, isBn } = useLanguage();

  const steps = [
    {
      step: '01',
      title: isBn ? 'পোর্টাল সেশন ও মিশন নির্বাচন' : 'Initial Application Setup',
      desc: isBn
        ? 'নির্বাচিত ভারতীয় মিশনের অধীনে সেশন তৈরি ও সিকিউরিটি ভেরিফিকেশন মুহূর্তেই সম্পন্ন।'
        : 'Initializes your session with your designated Indian mission and clears initial verification.',
    },
    {
      step: '02',
      title: isBn ? 'ব্যক্তিগত তথ্য ও এনআইডি' : 'Applicant & Identity Data',
      desc: isBn
        ? 'নাম, জন্মতারিখ, এনআইডি ও ব্যক্তিগত তথ্য শতভাগ নির্ভুল বানানে অটো-ফিল।'
        : 'Populates personal details, date of birth, and identity numbers with zero spelling errors.',
    },
    {
      step: '03',
      title: isBn ? 'মা-বাবার তথ্য ও স্থায়ী ঠিকানা' : 'Family & Residence History',
      desc: isBn
        ? 'পিতা-মাতার নাম, বর্তমান ও স্থায়ী ঠিকানা এবং কর্মসংস্থানের সঠিক তথ্য ইনপুট।'
        : 'Enters verified parent particulars, present and permanent addresses, and current occupation.',
    },
    {
      step: '04',
      title: isBn ? 'ভ্রমণের ধরন ও রেফারেন্স' : 'Visa Details & References',
      desc: isBn
        ? 'ভ্রমণের মেয়াদ, আসা-যাওয়ার পোর্ট এবং ভারত ও বাংলাদেশের বৈধ রেফারেন্স।'
        : 'Configures travel duration, designated entry/exit ports, and authentic references.',
    },
    {
      step: '05',
      title: isBn ? 'সিকিউরিটি চেকলিস্ট পূরণ' : 'Statutory Declarations',
      desc: isBn
        ? 'দূতাবাসের নিয়ম অনুযায়ী বাধ্যতামূলক সকল প্রশ্নের সঠিক উত্তর স্বয়ংক্রিয়ভাবে নিশ্চিত করা।'
        : 'Accurately completes required security questions with automatic consular rule validation.',
    },
    {
      step: '06',
      title: isBn ? 'এআই ২×২ কনস্যুলার ফটো বিউটিফায়ার' : 'AI Consular Photo Enhancer',
      desc: isBn
        ? 'যেকোনো সাধারণ ছবি বা সেলফিকে স্বয়ংক্রিয়ভাবে সাদা ব্যাকগ্রাউন্ড ও ২×২ মাপের অফিসিয়াল স্ট্যান্ডার্ডে রূপান্তর।'
        : 'Automatically transforms any selfie into an embassy-compliant 2×2 inch photo with a crisp white background.',
    },
    {
      step: '07',
      title: isBn ? 'স্মার্ট পাসপোর্ট পিডিএফ অপটিমাইজার' : 'Smart Passport PDF Optimizer',
      desc: isBn
        ? 'সরকারি নির্দেশিকা অনুযায়ী পাসপোর্ট পিডিএফকে কঠোরভাবে ১০–৫০০ KB সাইজে নিখুঁত অপটিমাইজেশন।'
        : 'Strictly verifies and optimizes passport bio-data PDF to 10–500 KB for zero IVAC rejection.',
    },
    {
      step: '08',
      title: isBn ? 'ভারতে হোটেল ও থাকার ঠিকানা' : 'Stay & Hotel Particulars',
      desc: isBn
        ? 'ভ্রমণসূচি অনুযায়ী ভারতের হোটেল, সঠিক জেলা ও পিনকোড স্বয়ংক্রিয়ভাবে পূরণ।'
        : 'Populates verified hotel and accommodation details for your planned itinerary.',
    },
    {
      step: '09',
      title: isBn ? 'অফিশিয়াল ৪-পৃষ্ঠার পিডিএফ রেডি' : 'Final Submission & PDF Delivery',
      desc: isBn
        ? 'স্থায়ী ওয়েব ফাইল নম্বর প্রাপ্তি এবং সাথে সাথে প্রিন্টযোগ্য সরকারি পিডিএফ ডাউনলোড।'
        : 'Issues your permanent Web File Number and immediately generates your official PDF.',
    },
  ];

  return (
    <div className="space-y-16 md:space-y-28">
      {/* 1. Hero Section */}
      <HomeHero />

      {/* 1.1 Free Trial Verification Offer */}
      <FreeTrialSection />

      {/* 2. Interactive Savings Calculator (Unique anti-AI interactive widget) */}
      <section className="py-8">
        <SavingsCalculator />
      </section>

      {/* 3. Supported Consular Missions & Ports */}
      <section className="py-6">
        <SupportedCenters />
      </section>

      {/* 3.1 Supported Visa Categories & Purposes (All Visa Types) */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VisaTypeSelector />
      </section>

      {/* 4. Bento Grid Features */}
      <BentoFeatures />

      {/* 5. 9-Step Walkthrough Section */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="max-w-3xl space-y-3.5"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'সম্পূর্ণ ফর্ম পূরণ প্রক্রিয়া' : 'Full Lifecycle Workflow'}</span>
            </div>
            <h2 className={`text-2xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-black ${isBn ? 'tracking-normal font-bangla leading-normal' : 'tracking-tight leading-tight'}`}>
              {isBn
                ? 'একটি নিরবচ্ছিন্ন প্রক্রিয়ায় সম্পূর্ণ ৯টি ধাপ নির্ভুলভাবে সম্পন্ন করুন।'
                : 'All 9 steps processed seamlessly in a single continuous run.'}
            </h2>
            <p className="text-base text-[#555555] leading-relaxed">
              {isBn
                ? 'কনস্যুলার সেন্টারে রিজেকশন বা সেশন টাইমআউট এড়াতে প্রতিটি ধাপ নিখুঁতভাবে যাচাই করা হয়।'
                : 'Every stage is strictly validated to ensure compliance with official consular guidelines before submission.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s, index) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                whileHover={{ y: -3 }}
                className="bg-white p-6 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all space-y-3 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-black bg-[#F5F5F5] px-2.5 py-1 rounded-md border border-[#EAEAEA]">
                    {isBn ? `ধাপ ${toBnDigits(s.step)}` : `Step ${s.step}`}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#888888] group-hover:text-black transition-colors" />
                </div>
                <h3 className={`text-base font-bold text-black ${isBn ? 'tracking-normal font-bangla' : 'tracking-tight'}`}>{s.title}</h3>
                <p className="text-xs text-[#555555] leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. Pricing Section */}
      <section className="py-20 md:py-28 bg-[#FAFAFA] border-t border-[#EAEAEA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-black">
              {t('pricing.super_title')}
            </div>
            <h2 className={`text-2xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-black ${isBn ? 'tracking-normal font-bangla leading-normal pt-1' : 'tracking-tight'}`}>
              {t('pricing.title')}
            </h2>
            <p className="text-base text-[#555555]">
              {t('pricing.desc')}
            </p>
          </div>

          <PricingCards />
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-black">
              {t('faq.badge')}
            </div>
            <h2 className={`text-2xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-black ${isBn ? 'tracking-normal font-bangla leading-normal pt-1' : 'tracking-tight'}`}>
              {t('faq.title')}
            </h2>
            <p className="text-base text-[#555555]">
              {t('faq.subtitle')}
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* 8. Bottom CTA Banner */}
      <section className="py-20 bg-white border-t border-[#EAEAEA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <PothikVisaLogo size={56} className="mx-auto" />
          <h2 className={`text-2xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-black ${isBn ? 'tracking-normal font-bangla leading-normal' : 'tracking-tight'}`}>
            {isBn
              ? 'আর কোনো ঝামেলা নয় — এখনই তৈরি করুন ইন্ডিয়ান ভিসা ওয়েব ফাইল'
              : 'Ready to create your Indian Visa Web File without errors?'}
          </h2>
          <p className="text-base text-[#555555] max-w-xl mx-auto leading-relaxed">
            {isBn
              ? '১৫০ ৳ (৭৫টি ওয়েব ফাইল) বা ৩০০ ৳ (২০০টি ওয়েব ফাইল) প্ল্যান বেছে নিয়ে নিজের অথবা ক্লায়েন্টের ভিসা ওয়েব ফাইল তৈরি করুন কোনো টাইমআউট বা ভুল ছাড়াই।'
              : 'Get started with our 150 ৳ Starter plan (75 Web Files) or 300 ৳ Standard plan (200 Web Files). Fast, compliant Indian visa web file creation with zero timeout frustration.'}
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="rounded-full h-12 px-7">
              <Link href="/pricing">
                <span>{isBn ? 'সাবস্ক্রিপশন প্ল্যান বেছে নিন' : 'Choose your subscription plan'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
