'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function SupportedCenters() {
  const { t, isBn } = useLanguage();

  const centers = [
    {
      code: 'BGDD',
      city: isBn ? 'ঢাকা' : 'Dhaka',
      location: isBn ? 'যমুনা ফিউচার পার্ক, বারিধারা' : 'Jamuna Future Park, Baridhara',
      primaryPorts: isBn ? 'হরিদাসপুর রেল/সড়ক, গেদে, বেনাপোল, আগরতলা' : 'Haridaspur Rail/Road, Gede, Benapole, Agartala',
      status: 'Live & Connected',
    },
    {
      code: 'BGDC',
      city: isBn ? 'চট্টগ্রাম' : 'Chittagong',
      location: isBn ? 'ওয়ার্ল্ড ট্রেড সেন্টার, আগ্রাবাদ' : 'World Trade Center, Agrabad',
      primaryPorts: isBn ? 'বেনাপোল, হরিদাসপুর, কলকাতা বিমানবন্দর' : 'Benapole, Haridaspur, Kolkata Airport',
      status: 'Live & Connected',
    },
    {
      code: 'BGDR',
      city: isBn ? 'রাজশাহী' : 'Rajshahi',
      location: isBn ? 'সেক্টর ২, উপশহর' : 'Sector 2, Uposhohor',
      primaryPorts: isBn ? 'গেদে রোড, হরিদাসপুর, চ্যাংড়াবান্ধা' : 'Gede Road, Haridaspur, Changrabandha',
      status: 'Live & Connected',
    },
    {
      code: 'BGDS',
      city: isBn ? 'সিলেট' : 'Sylhet',
      location: isBn ? 'রোড ১, কাস্টঘর' : 'Road 1, Kastoghor',
      primaryPorts: isBn ? 'ডাউকি, সুতারকান্দি, হরিদাসপুর' : 'Dawki, Sutarkandi, Haridaspur',
      status: 'Live & Connected',
    },
    {
      code: 'BGDK',
      city: isBn ? 'খুলনা' : 'Khulna',
      location: isBn ? 'কেডিএ কমার্শিয়াল এরিয়া' : 'KDA Commercial Area',
      primaryPorts: isBn ? 'বেনাপোল রেল/সড়ক, হরিদাসপুর' : 'Benapole Rail/Road, Haridaspur',
      status: 'Live & Connected',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-3xl space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('mission.badge')}</span>
        </div>
        <h3 className={`text-2xl sm:text-3xl font-extrabold text-black ${isBn ? 'tracking-normal font-bangla' : 'tracking-tight'}`}>
          {t('mission.title')}
        </h3>
        <p className="text-xs sm:text-sm text-[#555555]">
          {isBn
            ? 'ঢাকা, চট্টগ্রাম, রাজশাহী, সিলেট এবং খুলনা—সকল সেন্টারের ড্রপ-ডাউন এবং অনুমোদিত বন্দর স্বয়ংক্রিয়ভাবে ম্যাপ করা।'
            : 'Pre-calibrated with authorized land, rail, and air entry/exit ports for all 5 High Commission & Assistant High Commission consular jurisdictions.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {centers.map((c) => (
          <div
            key={c.code}
            className="bg-white p-5 rounded-2xl border border-[#EAEAEA] hover:border-black transition-all space-y-3 shadow-2xs group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-black bg-[#FAFAFA] border border-[#EAEAEA] px-2 py-0.5 rounded">
                {c.code}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>{isBn ? 'প্রস্তুত' : 'Ready'}</span>
              </span>
            </div>

            <div>
              <div className="text-base font-bold text-black tracking-tight">{c.city}</div>
              <div className="text-[11px] text-[#666666] line-clamp-1">{c.location}</div>
            </div>

            <div className="pt-2 border-t border-[#F5F5F5] text-[10px] text-[#888888] space-y-0.5">
              <div className="font-medium text-[#444444]">{isBn ? 'প্রধান বন্দরসমূহ:' : 'Entry Ports:'}</div>
              <div className="line-clamp-2">{c.primaryPorts}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default SupportedCenters;
