'use client';

import React, { useState } from 'react';
import { ALL_VISA_PURPOSES, VISA_CATEGORIES, VISA_CATEGORY_NAMES_BN, VisaPurposeOption } from '@/constants/visaPurposes';
import { useLanguage } from '@/context/LanguageContext';
import { Plane, Stethoscope, Briefcase, GraduationCap, ArrowLeftRight, FileText, Check, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toBnDigits } from '@/lib/utils';

export function VisaTypeSelector({
  selectedCode = '544',
  onSelect,
}: {
  selectedCode?: string;
  onSelect?: (option: VisaPurposeOption) => void;
}) {
  const { isBn } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [currentCode, setCurrentCode] = useState<string>(selectedCode);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Tourist':
        return <Plane className="w-4 h-4 text-emerald-600" />;
      case 'Medical':
        return <Stethoscope className="w-4 h-4 text-rose-600" />;
      case 'Business':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'Student':
        return <GraduationCap className="w-4 h-4 text-amber-600" />;
      case 'Transit':
        return <ArrowLeftRight className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-neutral-600" />;
    }
  };

  const filtered = activeCategory === 'All'
    ? ALL_VISA_PURPOSES
    : ALL_VISA_PURPOSES.filter((p) => p.category === activeCategory);

  const handleSelect = (option: VisaPurposeOption) => {
    setCurrentCode(option.code);
    if (onSelect) onSelect(option);
  };

  return (
    <div className="space-y-6 bg-white rounded-2xl border border-[#EAEAEA] p-6 sm:p-8 shadow-2xs">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isBn ? 'সব ধরনের ভিসা সমর্থিত' : 'Supported Visa Types'}</span>
        </div>
        <h3 className={`text-xl sm:text-2xl font-extrabold text-black ${isBn ? 'tracking-normal font-bangla' : 'tracking-tight'}`}>
          {isBn
            ? 'ট্যুরিস্ট, মেডিকেল, বিজনেস কিংবা স্টুডেন্ট — সব ক্যাটাগরি প্রস্তুত'
            : 'Full support for Tourist, Medical, Business, Student & Entry Visas'}
        </h3>
        <p className="text-xs sm:text-sm text-[#555555]">
          {isBn
            ? 'আপনার প্রয়োজনীয় ভিসার ধরন নির্বাচন করুন। প্রথম ধাপে সরকারি পোর্টালের সঠিক পারপাস কোড আমরাই নিখুঁতভাবে বসিয়ে দেব।'
            : 'Select your intended visa purpose. PothikVisa automatically passes the verified consular purpose code to Step 1.'}
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        {VISA_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-black text-white shadow-xs'
                : 'bg-[#FAFAFA] text-[#666666] hover:bg-[#F5F5F5] hover:text-black border border-[#EAEAEA]'
            }`}
          >
            {isBn ? (VISA_CATEGORY_NAMES_BN[cat] || cat) : cat}
          </button>
        ))}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((item) => {
          const isSelected = currentCode === item.code;
          return (
            <div
              key={item.code}
              onClick={() => handleSelect(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-left ${
                isSelected
                  ? 'border-black bg-[#FAFAFA] shadow-xs ring-1 ring-black'
                  : 'border-[#EAEAEA] hover:border-black bg-white'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] border border-[#EAEAEA] flex items-center justify-center shrink-0 mt-0.5">
                {getCategoryIcon(item.category)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-black">
                    {isBn ? item.labelBn : item.labelEn}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  {isBn ? item.descriptionBn : item.description}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#888888] bg-[#F5F5F5] px-1.5 py-0.5 rounded">
                    {isBn ? 'কোড:' : 'Code:'} {isBn ? toBnDigits(item.code) : item.code}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {isBn ? (VISA_CATEGORY_NAMES_BN[item.category] || item.category) : item.category}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default VisaTypeSelector;
