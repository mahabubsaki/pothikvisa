'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, ArrowRight, Compass } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  const { isBn } = useLanguage();

  return (
    <div className="py-16 md:py-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 vercel-radial">
      
      {/* Editorial Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl space-y-4"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isBn ? 'সহজ কথা ও প্রযুক্তি' : 'Our Mission & Software Tool'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight leading-tight">
          {isBn ? (
            <>
              বাংলাদেশিদের জন্য ইন্ডিয়ান ভিসা ওয়েব ফাইল তৈরি এখন{' '}
              <span className="font-serif italic font-normal text-emerald-950 underline decoration-emerald-500/40 underline-offset-8">
                ঝামেলামুক্ত, দ্রুত ও নির্ভুল।
              </span>
            </>
          ) : (
            <>
              Eliminating friction and delays from Indian visa web file creation{' '}
              <span className="font-serif italic font-normal text-emerald-950 underline decoration-emerald-500/40 underline-offset-8">
                in Bangladesh.
              </span>
            </>
          )}
        </h1>
        <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
          {isBn
            ? 'প্রতি বছর লাখ লাখ বাংলাদেশি চিকিৎসার জন্য, ঘুরতে বা পড়াশোনার কাজে ভারতে যান। কিন্তু ভিসা পোর্টালে ওয়েব ফাইল তৈরি করতে গিয়ে প্রায় সবাই টাইমআউট, ছবির সাইজের ভুল বা সার্ভার ড্রপের কারণে ভোগান্তিতে পড়েন। সেই ঘণ্টার পর ঘণ্টা টাইপিং আর জটিলতা দূর করতেই তৈরি হয়েছে পথিক ভিসা (PothikVisa) — একটি আধুনিক ও স্বাধীন ইন্ডিয়ান ভিসা ওয়েব ফাইল ক্রিয়েটর সফটওয়্যার।'
            : 'Each year, over a million Bangladeshi citizens apply for Indian visas for business, tourism, education, and medical treatment. Manual web file generation on multi-page portals often leads to unexpected session dropouts, rejection over minor photo framing mismatches, and hours of repeated typing. PothikVisa is an independent Web File Creator software designed to eliminate these headaches.'}
        </p>
      </motion.div>

      {/* The 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05, duration: 0.35 }}
          whileHover={{ y: -3 }}
          className="bg-white p-8 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all space-y-4 shadow-2xs"
        >
          <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] text-black border border-[#EAEAEA] flex items-center justify-center font-bold text-lg">
            01
          </div>
          <h2 className="text-xl font-bold text-black tracking-tight">
            {isBn ? 'চোখের পলকে স্বয়ংক্রিয় ফর্ম পূরণ' : 'Fast-track automated processing'}
          </h2>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
            {isBn
              ? 'ম্যানুয়ালি প্রতিটি ধাপ টাইপ করতে গিয়ে পোর্টাল প্রায়ই লগআউট হয়ে যায়। পথিক ভিসা মাত্র কয়েক সেকেন্ডেই প্রতিটি ধাপ পূরণ করে, তাই টাইমআউটের কোনো ভয় থাকে না।'
              : 'Filling a multi-page consular form manually takes substantial time, creating vulnerability to sudden session timeouts. PothikVisa executes all required stages in seconds, guaranteeing your application is filed without timeout dropouts.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.35 }}
          whileHover={{ y: -3 }}
          className="bg-white p-8 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all space-y-4 shadow-2xs"
        >
          <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] text-black border border-[#EAEAEA] flex items-center justify-center font-bold text-lg">
            02
          </div>
          <h2 className="text-xl font-bold text-black tracking-tight">
            {isBn ? 'কনস্যুলার মাপের নিখুঁত ছবি' : 'Consular-grade format assurance'}
          </h2>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
            {isBn
              ? 'ছবির মাপ ২×২ ইঞ্চি না হওয়া বা ব্যাকগ্রাউন্ডের কারণে অনেকের ফাইল রিজেক্ট হয়। আমাদের সফটওয়্যার স্বয়ংক্রিয়ভাবে ছবি সাইজ করে দূতাবাসের সকল নিয়মের সাথে শতভাগ ম্যাচ করায়।'
              : 'Consular centers reject applications for non-standard square ratios, improper background lighting, or invalid document sizes. Our platform automatically inspects and formats every file to exact technical portal standards before submission.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.35 }}
          whileHover={{ y: -3 }}
          className="bg-white p-8 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all space-y-4 shadow-2xs"
        >
          <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] text-black border border-[#EAEAEA] flex items-center justify-center font-bold text-lg">
            03
          </div>
          <h2 className="text-xl font-bold text-black tracking-tight">
            {isBn ? 'সার্ভার ড্রপ হলেও ডাটা সেভ থাকে' : 'Intelligent checkpoint recovery'}
          </h2>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
            {isBn
              ? 'সরকারি পোর্টালে হঠাত্‍ কানেকশন ড্রপ হলেও আপনার তথ্য মুছে যাবে না। পথিক ভিসা প্রতিটি ধাপের ডাটা নিরাপদে রাখে, ফলে এক ক্লিকেই আগের জায়গা থেকে কাজ শুরু করা যায়।'
              : 'Should an external government server drop connection during processing, your effort is never lost. PothikVisa securely bookmarks your application progress, enabling one-click continuation with all verified data retained.'}
          </p>
        </motion.div>

      </div>

      {/* Security & Data Privacy Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#FAFAFA] p-8 sm:p-10 rounded-2xl border border-[#EAEAEA] space-y-5 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-black">
            {isBn ? 'আপনার তথ্যের সর্বোচ্চ নিরাপত্তা ও গোপনীয়তা' : 'Security, privacy and transparency commitments'}
          </h2>
        </div>
        <p className="text-sm text-[#555555] leading-relaxed max-w-3xl">
          {isBn
            ? 'আপনার পাসপোর্ট, জাতীয় পরিচয়পত্র ও ভ্রমণ সংক্রান্ত সকল তথ্য সর্বোচ্চ নিরাপত্তার সাথে প্রসেস করা হয়। আপনার অনুমতি ছাড়া কোনো তথ্য তৃতীয় পক্ষের সাথে শেয়ার করা হয় না এবং যেকোনো সময় অ্যাকাউন্ট থেকে সব ডাটা ডিলিট করার সম্পূর্ণ অধিকার আপনার রয়েছে।'
            : 'Your travel details, passport numbers, and personal identifiers are treated with the highest degree of confidentiality. Information submitted is processed strictly for official form completion and can be purged from your account dashboard whenever you choose.'}
        </p>
        <div className="pt-2 flex flex-wrap gap-5 text-xs text-[#555555]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {isBn ? '২৫৬-বিট এনক্রিপশন' : '256-bit encrypted data transit'}
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {isBn ? 'কোনো থার্ড-পার্টির সাথে ডাটা শেয়ার নয়' : 'Zero third-party marketing broker sharing'}
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {isBn ? 'যেকোনো সময় ডাটা মুছে ফেলার সুবিধা' : 'Full user control over saved draft profiles'}
          </span>
        </div>
      </motion.div>

      {/* Transparent Disclaimer Box */}
      <div className="bg-white p-6 rounded-2xl border border-[#EAEAEA] text-xs text-[#666666] leading-relaxed space-y-2">
        <div className="font-bold text-black uppercase tracking-wider text-[11px]">
          {isBn ? 'স্বতন্ত্র সফটওয়্যার বিবৃতি' : 'Independent Software Declaration'}
        </div>
        <p>
          {isBn
            ? 'সহজ কথা: পথিক ভিসা (pothikvisa.com) একটি স্বাধীন সফটওয়্যার টুল, যা আবেদনকারীদের ইন্ডিয়ান ভিসা ওয়েব ফাইল তৈরির সময় বাঁচাতে সাহায্য করে। আমরা ভারতীয় হাই কমিশন, আইভ্যাক বাংলাদেশ (IVAC) বা ভারত সরকারের কোনো অফিশিয়াল অঙ্গসংস্থা নই এবং কোনো ভিসা অনুমোদন বা অ্যাপয়েন্টমেন্ট দেওয়ার দাবি করি না।'
            : 'PothikVisa (pothikvisa.com) is an independent workflow automation software designed to help applicants generate Indian visa web files without timeouts or formatting errors. We are not affiliated with, endorsed by, or operated by the High Commission of India, Indian Visa Application Centers (IVAC Bangladesh), or the Ministry of External Affairs.'}
        </p>
      </div>

      {/* CTA Box */}
      <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <Button asChild size="lg" className="rounded-full">
          <Link href="/pricing">
            <span>{isBn ? 'প্যাকেজসমূহ দেখুন' : 'View subscription plans'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
        <Link
          href="/faq"
          className="text-sm font-semibold text-[#555555] hover:text-black transition-colors"
        >
          {isBn ? 'সাধারণ প্রশ্নোত্তর দেখুন →' : 'Explore frequently asked questions →'}
        </Link>
      </div>

    </div>
  );
}
