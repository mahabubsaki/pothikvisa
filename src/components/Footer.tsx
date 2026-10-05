'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PothikVisaLogo } from '@/components/PothikVisaLogo';
import { toBnDigits } from '@/lib/utils';

export function Footer() {
  const { isBn } = useLanguage();

  return (
    <footer role="contentinfo" className="bg-[#FAFAFA] border-t border-[#EAEAEA] text-[#555555] pt-10 sm:pt-14 pb-10 sm:pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-10 sm:pb-12 border-b border-[#EAEAEA]">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-3.5 sm:space-y-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <PothikVisaLogo size={32} />
              <span className="font-bold text-lg text-black tracking-tight">PothikVisa</span>
            </Link>
            <p className="text-xs sm:text-sm text-[#555555] leading-relaxed max-w-sm">
              {isBn
                ? 'বাংলাদেশি আবেদনকারী, পরিবার ও ট্রাভেল এজেন্সিদের জন্য তৈরি নির্ভরযোগ্য ভারতীয় ভিসা ফর্ম অটোমেশন সফটওয়্যার।'
                : 'Automated Indian visa application workflow designed for Bangladeshi travelers, families, and travel agencies.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg w-fit font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isBn ? '২০২৬ পোর্টাল স্পেক্স শতভাগ সমর্থিত' : '100% compliant with 2026 portal specs'}</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-black">
              {isBn ? 'প্রোডাক্ট' : 'Product'}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-black transition-colors">
                  {isBn ? 'ফর্ম ফিল ইঞ্জিন' : 'Form fill engine'}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-black transition-colors">
                  {isBn ? 'মূল্যতালিকা ও প্যাকেজ' : 'Pricing & plans'}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-black transition-colors">
                  {isBn ? 'কীভাবে কাজ করে' : 'How it works'}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-black transition-colors">
                  {isBn ? 'সাধারণ জিজ্ঞাসা' : 'Frequently asked questions'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Indian Missions Supported */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-black">
              {isBn ? 'সমর্থিত মিশনসমূহ' : 'Supported missions'}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                <span>{isBn ? 'ঢাকা (BGDD)' : 'Dhaka (BGDD)'}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                <span>{isBn ? 'চট্টগ্রাম (BGDC)' : 'Chittagong (BGDC)'}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                <span>{isBn ? 'রাজশাহী (BGDR)' : 'Rajshahi (BGDR)'}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                <span>{isBn ? 'সিলেট ও খুলনা' : 'Sylhet & Khulna'}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Language */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-black">
              {isBn ? 'যোগাযোগ ও ভাষা' : 'Contact & language'}
            </h3>
            <p className="text-xs sm:text-sm">{isBn ? 'ঢাকা, বাংলাদেশ' : 'Dhaka, Bangladesh'}</p>
            <p className="text-xs sm:text-sm flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#888888] shrink-0" />
              <span className="break-all sm:break-normal">support@pothikvisa.com</span>
            </p>
            <div className="pt-1.5">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 sm:pt-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs text-[#888888]">
          <p className="max-w-3xl leading-relaxed">
            <span className="font-semibold text-black">{isBn ? 'বিজ্ঞপ্তি:' : 'Notice:'}</span>{' '}
            {isBn
              ? 'পথিক ভিসা একটি স্বাধীন ও স্বতন্ত্র অটোমেশন ও ডকুমেন্ট প্রস্তুতি সফটওয়্যার। আমরা ভারতীয় হাই কমিশন, আইভ্যাক বাংলাদেশ বা ভারতের পররাষ্ট্র মন্ত্রণালয়ের সাথে সরাসরি সংযুক্ত নই।'
              : 'PothikVisa is an independent workflow automation software and document preparation tool. We are not affiliated with, endorsed by, or operated by the High Commission of India, Indian Visa Application Centers (IVAC Bangladesh), or the Ministry of External Affairs.'}
          </p>
          <p className="shrink-0 font-medium text-black">
            © {isBn ? toBnDigits(new Date().getFullYear()) : new Date().getFullYear()} PothikVisa. {isBn ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
