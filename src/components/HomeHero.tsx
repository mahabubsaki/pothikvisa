'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Lock, Sparkles, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

export function HomeHero() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'result'>('pipeline');
  const { t, isBn } = useLanguage();

  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-28 overflow-hidden vercel-radial">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Asymmetric 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading and Value Propositions (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6"
          >
            
            {/* Live Indicator Pill & Free Trial Callout */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isBn ? '🎁 সাইন আপ করলেই ৩টি ওয়েব ফাইল সম্পূর্ণ ফ্রি!' : '🎁 3 Free Web Files on Sign Up!'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] text-[11px] font-semibold text-[#555555]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{isBn ? 'কোনো কার্ড বা অগ্রিম পেমেন্ট ছাড়াই' : 'Zero Card or Upfront Payment'}</span>
              </div>
            </div>

            {/* Main Headline with Editorial Serif Emphasis */}
            <h1 className={`text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-black leading-[1.18] ${isBn ? 'tracking-normal font-bangla' : 'tracking-tight'}`}>
              {isBn ? (
                <>
                  ভারতীয় ভিসা ওয়েব ফাইল তৈরি করুন নিমিষেই — কোনো{' '}
                  <span className="font-extrabold text-emerald-800 underline decoration-emerald-500/40 underline-offset-8">
                    টাইমআউট বা ভুলের
                  </span>{' '}
                  ঝামেলা ছাড়া।
                </>
              ) : (
                <>
                  Generate official Indian Visa Web Files in{' '}
                  <span className="font-serif italic font-normal text-emerald-950 underline decoration-emerald-500/40 underline-offset-8">
                    under a minute
                  </span>{' '}
                  without session timeouts.
                </>
              )}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#555555] leading-relaxed max-w-2xl">
              {t('hero.desc')}
            </p>

            {/* Benefit Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-black bg-white p-3 rounded-xl border border-[#EAEAEA] shadow-2xs">
                <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('hero.feature1')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-black bg-white p-3 rounded-xl border border-[#EAEAEA] shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('hero.feature2')}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-black bg-white p-3 rounded-xl border border-[#EAEAEA] shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('hero.feature3')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-3">
              <Button asChild size="lg" className="rounded-full h-12 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                <Link href="/sign-up">
                  <span>{isBn ? '৩টি ফ্রি ফাইলসহ শুরু করুন' : 'Get 3 Free Web Files'}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-7 border-zinc-300 hover:bg-zinc-50">
                <Link href="/pricing">
                  <span>{isBn ? 'প্যাকেজ ও মূল্যতালিকা' : 'View Pricing Plans'}</span>
                </Link>
              </Button>
            </div>

            <p className="text-xs text-[#666666] pt-1">
              {isBn
                ? '🎁 সাইন আপেই ৩টি ফ্রি ফাইল • এরপর সাশ্রয়ী প্যাকেজ মাত্র ১৫০ ৳ (৭৫টি ফাইল) ও ৩০০ ৳ (২০০টি ফাইল) • বিকাশ/নগদে তাৎক্ষণিক অ্যাক্টিভেশন'
                : '🎁 3 Free Web Files on signup • Plans starting at 150 ৳ (75 files) & 300 ৳ (200 files) • Instant bKash & Nagad activation'}
            </p>
          </motion.div>

          {/* Right Column: Pipeline Execution Card (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="bg-white rounded-2xl border border-[#EAEAEA] p-6 shadow-xl relative overflow-hidden">
              
              {/* Card Header & Switcher */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold text-black uppercase tracking-wider">
                    {t('hero.monitor_title')}
                  </span>
                </div>
                
                {/* View Switcher Tabs */}
                <div className="flex items-center bg-[#F5F5F5] p-1 rounded-lg border border-[#EAEAEA]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pipeline')}
                    className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-all ${
                      activeTab === 'pipeline'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-[#666666] hover:text-black'
                    }`}
                  >
                    {t('hero.tab_processing')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('result')}
                    className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-all ${
                      activeTab === 'result'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-[#666666] hover:text-black'
                    }`}
                  >
                    {t('hero.tab_result')}
                  </button>
                </div>
              </div>

              {/* Tab 1: Live Processing Details */}
              {activeTab === 'pipeline' ? (
                <div className="mt-4 space-y-3 font-mono text-xs">
                  
                  {/* Progress Bar */}
                  <div className="bg-[#FAFAFA] p-3.5 rounded-xl border border-[#EAEAEA] space-y-2">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[#666666] font-medium">{t('hero.status_label')}</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('hero.status_time')}</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#EAEAEA] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full w-full"></div>
                    </div>
                  </div>

                  <div className="bg-[#FAFAFA] p-3.5 rounded-xl border border-[#EAEAEA] space-y-2">
                    <div className="flex items-center justify-between text-[#666666]">
                      <span>{t('hero.mission_dest')}</span>
                      <span className="text-black font-sans font-semibold">{t('hero.mission_val')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#666666]">
                      <span>{t('hero.sec_label')}</span>
                      <span className="text-emerald-700 font-sans font-semibold">
                        {t('hero.sec_val')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#666666]">
                      <span>{t('hero.photo_label')}</span>
                      <span className="text-black font-sans font-semibold">{t('hero.photo_val')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#666666]">
                      <span>{t('hero.passport_label')}</span>
                      <span className="text-black font-sans font-semibold">{t('hero.passport_val')}</span>
                    </div>
                  </div>

                  {/* Output Card */}
                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 font-sans">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('hero.web_file_label')}</span>
                    </div>
                    <div className="text-xl font-bold text-black tracking-widest">
                      BGDDW2BD7826
                    </div>
                    <div className="text-[11px] text-[#555555] font-sans">
                      {t('hero.web_file_desc')}
                    </div>
                  </div>

                </div>
              ) : (
                /* Tab 2: Document Outcome Sample */
                <div className="mt-4 p-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] space-y-3 font-sans text-xs">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#EAEAEA]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-black text-sm">
                        {isBn ? 'অফিশিয়াল কনস্যুলার ফর্ম ড্রাফট' : 'Official Consular Form Draft'}
                      </div>
                      <div className="text-[11px] text-[#666666]">
                        {isBn ? 'ভারত সরকারের সাবমিশন ফরম্যাট' : 'Govt. of India Submission Format'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-[#555555]">
                    <div className="flex justify-between py-1 border-b border-[#EAEAEA]">
                      <span>{isBn ? 'আবেদনকারীর নাম:' : 'Applicant Name:'}</span>
                      <span className="text-black font-medium">TAREK HASAN CHOWDHURY</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#EAEAEA]">
                      <span>{isBn ? 'পাসপোর্ট নম্বর:' : 'Passport No:'}</span>
                      <span className="text-black font-mono font-medium">B09871234</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#EAEAEA]">
                      <span>{isBn ? 'ভিসা ক্যাটাগরি:' : 'Visa Category:'}</span>
                      <span className="text-black font-medium">
                        {isBn ? 'ট্যুরিস্ট (ডাবল এন্ট্রি)' : 'Tourist (Double Entry)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>{isBn ? 'স্ট্যাটাস:' : 'Status:'}</span>
                      <span className="text-emerald-700 font-semibold">
                        {isBn ? 'আইভ্যাক সাবমিশনের জন্য প্রস্তুত' : 'Ready for IVAC Physical Submission'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom footer bar */}
              <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#888888]">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>{t('hero.secure_sub')}</span>
                </span>
                <span className="font-mono text-[#555555]">
                  {isBn ? 'সময়: ৪৪.৮ সে.' : 'Time: 44.8s'}
                </span>
              </div>

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}

export default HomeHero;
