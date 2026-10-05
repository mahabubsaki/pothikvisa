'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 px-2.5 text-xs font-semibold bg-white border border-[#EAEAEA] hover:border-black rounded-full flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
        aria-expanded={open}
        aria-label="Select language"
      >
        <Globe className="w-3.5 h-3.5 text-[#555555]" />
        <span className="text-black">
          {language === 'bn' ? '🇧🇩 বাংলা' : '🇬🇧 English'}
        </span>
        <ChevronDown className="w-3 h-3 text-[#888888] opacity-60" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1.5 w-36 bg-white border border-[#EAEAEA] rounded-xl shadow-lg z-50 p-1 space-y-0.5"
          >
            <button
              type="button"
              onClick={() => handleSelect('en')}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-[#F5F5F5] text-black font-bold'
                  : 'text-[#555555] hover:bg-[#FAFAFA] hover:text-black font-medium'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🇬🇧</span>
                <span>English</span>
              </span>
              {language === 'en' && <Check className="w-3.5 h-3.5 text-black" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelect('bn')}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                language === 'bn'
                  ? 'bg-[#F5F5F5] text-black font-bold'
                  : 'text-[#555555] hover:bg-[#FAFAFA] hover:text-black font-medium'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🇧🇩</span>
                <span>বাংলা</span>
              </span>
              {language === 'bn' && <Check className="w-3.5 h-3.5 text-black" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageSwitcher;
