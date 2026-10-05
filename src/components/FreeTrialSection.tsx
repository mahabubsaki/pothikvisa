'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Gift, Zap, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';

export function FreeTrialSection() {
  const { isBn } = useLanguage();

  const trialSteps = [
    {
      icon: Gift,
      step: '01',
      title: isBn ? 'ইনস্ট্যান্ট ৩টি ফ্রি ক্রেডিট' : '3 Free Credits Instantly',
      badge: isBn ? 'কোনো কার্ড ছাড়া' : 'Zero Card Required',
      description: isBn
        ? 'সাইন আপ করার সাথে সাথেই আপনার অ্যাকাউন্টে ৩টি ভিসা ওয়েব ফাইল সম্পূর্ণ বিনামূল্যে যোগ হবে। কোনো বিকাশ বা অগ্রিম পেমেন্টের শর্ত নেই।'
        : 'Get 3 Indian visa web files credited directly to your dashboard right upon signing up. No payment or phone verification friction.',
    },
    {
      icon: Zap,
      step: '02',
      title: isBn ? 'সকল ফিচারের ফুল এক্সেস' : 'Full Access to All Features',
      badge: isBn ? '১০০% ফিচার লাইভ' : '100% Live Features',
      description: isBn
        ? 'কনস্যুলার ২×২ ছবি ক্রপ, স্টেজহ্যান্ড পোর্টাল সেশন রিকভারি, পাসপোর্ট রিডার এবং অফিশিয়াল ৪-পৃষ্ঠার সরকারি পিডিএফ নিজে তৈরি করে দেখুন।'
        : 'Experience consular 2×2 photo crop, Stagehand portal resilience, smart error validation, and instant official 4-page PDF downloads.',
    },
    {
      icon: ShieldCheck,
      step: '03',
      title: isBn ? 'শূন্য ঝুঁকি — সন্তুষ্ট হলে আপগ্রেড' : 'Zero Risk — Upgrade When Convinced',
      badge: isBn ? 'মাত্র ১৫০ ৳ থেকে' : 'From 150 ৳ / mo',
      description: isBn
        ? 'স্পিড ও ১০০% নির্ভুলতা দেখে সন্তুষ্ট হলে আপনার প্রয়োজন অনুযায়ী মাত্র ১৫০ ৳ (৭৫টি ফাইল) বা ৩০০ ৳ (২০০টি ফাইল) দিয়ে নিয়মিত ব্যবহার করুন।'
        : 'Once you verify the speed and error-free execution with your own eyes, easily upgrade to Starter (150 ৳) or Standard (300 ৳).',
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-[#FBFBFB] border-y border-[#EAEAEA] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-2xs">
            <Gift className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'নতুন ইউজারদের জন্য বিশেষ সুযোগ' : 'Special Offer For New Users'}</span>
          </div>

          <h2 className={`text-2xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-black leading-tight ${isBn ? 'font-bangla' : 'tracking-tight'}`}>
            {isBn ? (
              <>
                টাকা দেওয়ার আগেই নিজের চোখে যাচাই করুন —{' '}
                <span className="text-emerald-700 underline decoration-emerald-500/30 underline-offset-8">
                  ৩টি ওয়েব ফাইল সম্পূর্ণ ফ্রি
                </span>
              </>
            ) : (
              <>
                Test Speed & Accuracy Before You Pay —{' '}
                <span className="text-emerald-700 underline decoration-emerald-500/30 underline-offset-8">
                  3 Free Web Files on Signup
                </span>
              </>
            )}
          </h2>

          <p className="text-base text-[#555555] max-w-2xl mx-auto leading-relaxed">
            {isBn
              ? 'আমরা জানি ভিসা ফাইলিংয়ে প্রতি সেকেন্ড ও প্রতিটি অক্ষরের নির্ভুলতা কতটা জরুরি। কোনো বিকাশ পেমেন্ট বা ক্রেডিট কার্ড ছাড়াই সরাসরি সাইন আপ করে স্টেজহ্যান্ড ক্লাউড অটোমেশনের গতি পরীক্ষা করুন।'
              : 'A single typo or portal timeout can derail a travel plan. Test our resilient Stagehand form automation with 3 complete web files risk-free before committing a single Taka.'}
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trialSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.35 }}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-[#EAEAEA] hover:border-emerald-300 p-6 sm:p-7 shadow-2xs transition-all relative flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-mono font-bold text-base shadow-2xs">
                      <Icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <Badge variant="secondary" className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border-emerald-200">
                      {step.badge}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#888888]">{step.step}.</span>
                      <h3 className="text-lg font-bold text-black font-bangla">{step.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[#666666] leading-relaxed font-bangla">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? 'ইনস্ট্যান্ট ড্যাশবোর্ড সুবিধা' : 'Instant dashboard access'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom High-Converting Action Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="bg-gradient-to-r from-zinc-900 via-black to-zinc-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? '১ মিনিটে সাইন আপ — কোনো পেমেন্ট ছাড়া' : 'Sign up in 60s — Zero Payment'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-bangla">
              {isBn ? 'এখনই ৩টি ওয়েব ফাইল তৈরি করে দেখুন' : 'Claim your 3 free Indian visa web files now'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-bangla max-w-xl">
              {isBn
                ? 'ইমেইল বা গুগল দিয়ে সাইন আপ করুন আর সাথে সাথেই তৈরি করুন প্রথম ৩টি ওয়েব ফাইল। কোনো চুক্তি বা ক্রেডিট কার্ড নেই।'
                : 'Sign up with Google or Email in seconds. Start generating official Indian visa web files without any card or contract.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button asChild size="lg" className="rounded-full h-12 px-7 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold shadow-lg w-full sm:w-auto">
              <Link href="/sign-up">
                <span>{isBn ? '৩টি ফ্রি ফাইলসহ সাইন আপ করুন' : 'Claim 3 Free Files'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-6 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 w-full sm:w-auto">
              <Link href="/pricing">
                <span>{isBn ? 'প্যাকেজের মূল্য দেখুন' : 'Compare Plans'}</span>
              </Link>
            </Button>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
