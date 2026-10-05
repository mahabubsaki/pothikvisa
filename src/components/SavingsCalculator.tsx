'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Clock, Banknote, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { toBnDigits } from '@/lib/utils';

export function SavingsCalculator() {
  const { t, isBn } = useLanguage();
  const [appsPerMonth, setAppsPerMonth] = useState<number>(30);

  // Traditional manual cyber cafe rate: ~500 BDT per application
  const manualCost = appsPerMonth * 500;

  const ourCost = 500;
  const recommendedPlan = isBn ? 'পেইড (৫০০ ৳)' : 'Paid (500 ৳)';
  const costPerForm = (ourCost / appsPerMonth).toFixed(1);

  const savings = manualCost - ourCost;
  // Approx 45 mins manual vs 45 sec automated = ~44 mins saved per app
  const hoursSaved = ((appsPerMonth * 44) / 60).toFixed(0);

  return (
    <div className="bg-[#FAFAFA] rounded-2xl border border-[#EAEAEA] p-6 sm:p-10 max-w-4xl mx-auto shadow-2xs space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#EAEAEA] pb-6">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('calc.badge')}</span>
          </div>
          <h3 className={`text-xl sm:text-2xl font-extrabold text-black ${isBn ? 'tracking-normal font-bangla' : 'tracking-tight'}`}>
            {t('calc.title')}
          </h3>
          <p className="text-xs sm:text-sm text-[#555555]">
            {t('calc.subtitle')}
          </p>
        </div>

        {/* Legitimate Speed Automation Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] text-[11px] font-semibold text-[#555555]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{isBn ? 'স্মার্ট অটোমেশন' : 'Speed Automation'}</span>
        </div>
      </div>

      {/* Slider Control */}
      <div className="space-y-4 bg-white p-6 rounded-xl border border-[#EAEAEA]">
        <div className="flex items-center justify-between">
          <label htmlFor="quota-slider" className="text-xs sm:text-sm font-semibold text-black">
            {t('calc.slider_label')}
          </label>
          <div className="flex items-baseline gap-1 bg-[#FAFAFA] border border-[#EAEAEA] px-3 py-1 rounded-lg">
            <span className="text-2xl font-black text-black font-mono">
              {isBn ? toBnDigits(appsPerMonth) : appsPerMonth}
            </span>
            <span className="text-xs text-[#555555]">{isBn ? 'টি ওয়েব ফাইল' : 'web files'}</span>
          </div>
        </div>

        <input
          id="quota-slider"
          type="range"
          min="10"
          max="250"
          step="5"
          value={appsPerMonth}
          onChange={(e) => setAppsPerMonth(Number(e.target.value))}
          className="w-full h-2 bg-[#EAEAEA] rounded-lg appearance-none cursor-pointer accent-black"
        />

        <div className="flex justify-between text-[11px] text-[#888888] font-mono">
          <span>{isBn ? '১০টি ফাইল' : '10 files'}</span>
          <span>{isBn ? '৭৫টি' : '75 files'}</span>
          <span>{isBn ? '২০০টি' : '200 files'}</span>
          <span>{isBn ? '২৫০+' : '250+ files'}</span>
        </div>
      </div>

      {/* Comparison Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1: Monthly Money Saved */}
        <div className="bg-white p-5 rounded-xl border border-[#EAEAEA] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#555555]">
            <span>{t('calc.total_savings')}</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
            +{isBn ? toBnDigits(savings.toLocaleString('en-US')) : savings.toLocaleString()} ৳
          </div>
          <div className="text-[11px] text-[#888888]">
            {isBn ? `ক্যাফে খরচ: ${toBnDigits(manualCost.toLocaleString('en-US'))} ৳` : `vs. ${manualCost.toLocaleString()} ৳ manual`}
          </div>
        </div>

        {/* Metric 2: Hours of Typing Saved */}
        <div className="bg-white p-5 rounded-xl border border-[#EAEAEA] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#555555]">
            <span>{t('calc.time_saved')}</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-black font-mono tracking-tight">
            {isBn ? toBnDigits(hoursSaved) : hoursSaved} {isBn ? 'ঘণ্টা' : 'Hours'}
          </div>
          <div className="text-[11px] text-[#888888]">
            {isBn ? 'টাইমআউট শূন্য' : 'Zero portal timeout risk'}
          </div>
        </div>

        {/* Metric 3: Automated Cost Per Form */}
        <div className="bg-white p-5 rounded-xl border border-[#EAEAEA] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#555555]">
            <span>{t('calc.rec_plan')}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-black tracking-tight">
            {recommendedPlan}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold font-mono">
            ~{isBn ? toBnDigits(costPerForm) : costPerForm} ৳ / {isBn ? 'প্রতি ফাইল' : 'web file'}
          </div>
        </div>

      </div>

      {/* Calculator Bottom CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs text-[#555555] text-center sm:text-left">
          {isBn
            ? `বিকাশ বা নগদে ${toBnDigits(ourCost)} ৳ পরিশোধ করে আজই আপনার ${toBnDigits(appsPerMonth)}টি ওয়েব ফাইল প্রস্তুত করুন।`
            : `Pay ${ourCost} ৳ via bKash/Nagad and process your ${appsPerMonth} web files with 100% compliance.`}
        </p>
        <Button asChild size="default" className="rounded-full">
          <Link href="/pricing">
            <span>{isBn ? 'এই প্যাকেজটি অ্যাক্টিভ করুন' : 'Activate this package'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

    </div>
  );
}

export default SavingsCalculator;
