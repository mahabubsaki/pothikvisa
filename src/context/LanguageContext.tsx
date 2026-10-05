'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NextIntlClientProvider, createTranslator } from 'next-intl';
import enMessages from '../../messages/en.json';
import bnMessages from '../../messages/bn.json';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isBn: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isBn: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [activeLang, setActiveLang] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('NEXT_LOCALE') as Language;
      if (saved === 'en' || saved === 'bn') {
        setActiveLang(saved);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved;
        }
      }
    } catch {
      // localStorage fallback
    }
  }, []);

  const translator = createTranslator({
    locale: activeLang,
    messages: activeLang === 'bn' ? bnMessages : enMessages,
  });

  const setLanguage = (lang: Language) => {
    setActiveLang(lang);
    try {
      localStorage.setItem('NEXT_LOCALE', lang);
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    } catch {
      // ignore
    }
  };

  const t = (key: string): string => {
    try {
      return translator(key as Parameters<typeof translator>[0]);
    } catch {
      return key;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language: activeLang,
        setLanguage,
        t,
        isBn: activeLang === 'bn',
      }}
    >
      <NextIntlClientProvider
        locale={activeLang}
        messages={activeLang === 'bn' ? bnMessages : enMessages}
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
