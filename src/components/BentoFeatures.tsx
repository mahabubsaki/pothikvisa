'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Zap, ShieldCheck, FileCheck, RefreshCw, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function BentoFeatures() {
  const { t, isBn } = useLanguage();

  return (
    <section className="py-20 md:py-28 bg-[#FAFAFA] border-t border-[#EAEAEA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3.5">
          <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('bento.badge')}</span>
          </div>
          <h2 className={`text-2xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-black ${isBn ? 'tracking-normal font-bangla leading-normal' : 'tracking-tight leading-tight'}`}>
            {t('bento.title')}
          </h2>
          <p className="text-base text-[#555555] leading-relaxed">
            {t('bento.desc')}
          </p>
        </div>

        {/* Asymmetric Bento Grid with Vercel Styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Item 1: Large Span (2 columns) */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:col-span-2 bg-white p-7 sm:p-9 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all flex flex-col justify-between shadow-xs group"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] border border-[#EAEAEA] flex items-center justify-center text-black group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-black tracking-normal leading-snug">
                  {t('bento.speed_title')}
                </h3>
                <p className="text-sm text-[#555555] leading-relaxed">
                  {t('bento.speed_desc')}
                </p>
              </div>
            </div>

            {/* Visual metric representation */}
            <div className="mt-8 pt-6 border-t border-[#EAEAEA] grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-black font-mono">
                  {t('bento.speed_time')}
                </div>
                <div className="text-xs text-[#888888] pt-0.5">
                  {t('bento.speed_time_lbl')}
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
                  {t('bento.speed_rel')}
                </div>
                <div className="text-xs text-[#888888] pt-0.5">
                  {t('bento.speed_rel_lbl')}
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-black font-mono">
                  {t('bento.speed_loss')}
                </div>
                <div className="text-xs text-[#888888] pt-0.5">
                  {t('bento.speed_loss_lbl')}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bento Item 2: Compact Span (1 column) */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white p-7 sm:p-9 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all flex flex-col justify-between shadow-xs group"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] border border-[#EAEAEA] flex items-center justify-center text-black group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-black tracking-normal leading-snug">
                  {t('bento.photo_title')}
                </h3>
                <p className="text-sm text-[#555555] leading-relaxed">
                  {t('bento.photo_desc')}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#EAEAEA] flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Check className="w-4 h-4" />
              <span>{t('bento.photo_badge')}</span>
            </div>
          </motion.div>

          {/* Bento Item 3: Compact Span (1 column) */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white p-7 sm:p-9 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all flex flex-col justify-between shadow-xs group"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] border border-[#EAEAEA] flex items-center justify-center text-black group-hover:scale-105 transition-transform">
                <FileCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-black tracking-normal leading-snug">
                  {t('bento.passport_title')}
                </h3>
                <p className="text-sm text-[#555555] leading-relaxed">
                  {t('bento.passport_desc')}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#EAEAEA] flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Sparkles className="w-4 h-4" />
              <span>{t('bento.passport_badge')}</span>
            </div>
          </motion.div>

          {/* Bento Item 4: Large Span (2 columns) */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:col-span-2 bg-white p-7 sm:p-9 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all flex flex-col justify-between shadow-xs group"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] border border-[#EAEAEA] flex items-center justify-center text-black group-hover:scale-105 transition-transform">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-black tracking-normal leading-snug">
                  {t('bento.resume_title')}
                </h3>
                <p className="text-sm text-[#555555] leading-relaxed">
                  {t('bento.resume_desc')}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#EAEAEA] flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[#555555]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t('bento.resume_f1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t('bento.resume_f2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t('bento.resume_f3')}</span>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}

export default BentoFeatures;
