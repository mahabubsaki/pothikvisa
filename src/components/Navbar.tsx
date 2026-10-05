'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight, User as UserIcon, ShieldCheck } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { PothikVisaLogo } from '@/components/PothikVisaLogo';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t, isBn } = useLanguage();
  const { user, isSignedIn, isLoaded } = useUser();
  const isUserAdmin = user?.publicMetadata?.role === 'admin';
  const showSignedIn = isLoaded && Boolean(isSignedIn);

  const navItems = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.about'), href: '/about' },
    { label: t('nav.pricing'), href: '/pricing' },
    { label: t('nav.faq'), href: '/faq' },
    { label: t('nav.contact'), href: '/contact' },
  ];

  return (
    <motion.header
      role="banner"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#EAEAEA]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none shrink-0">
            <PothikVisaLogo size={32} />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base text-black tracking-tight">
                PothikVisa
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAFAFA] text-[#666666] border border-[#EAEAEA]">
                {isBn ? 'পথিক ভিসা' : 'পথিক ভিসা'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav role="navigation" aria-label="Main menu" className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    isActive
                      ? 'text-black bg-[#F5F5F5]'
                      : 'text-[#666666] hover:text-black hover:bg-[#FAFAFA]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Buttons & Language Switcher */}
          <div className="hidden lg:flex items-center gap-2.5">
            <LanguageSwitcher />

            {showSignedIn ? (
              <div className="flex items-center gap-2">
                {isUserAdmin && (
                  <Link
                    href="/admin/users"
                    className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isBn ? 'অ্যাডমিন' : 'Admin'}</span>
                  </Link>
                )}

                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5 shrink-0">
                  <Link href="/dashboard">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                  </Link>
                </Button>

                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8 rounded-full border border-[#EAEAEA]',
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="text-xs font-semibold text-[#666666] hover:text-black transition-colors px-2 py-1.5 shrink-0"
                >
                  {t('nav.signin')}
                </Link>

                <Button asChild size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-xs shrink-0">
                  <Link href="/sign-up">
                    <span>{isBn ? 'অনুমোদনের পর প্রতিদিন ৩টি ফ্রি ফাইল' : '3 Free Files Per Day After Approval'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle & Language Switcher */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageSwitcher />
            {showSignedIn && (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-7 h-7 rounded-full border border-[#EAEAEA]',
                  },
                }}
              />
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#FAFAFA] text-black border border-[#EAEAEA] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-b border-[#EAEAEA] px-4 pt-3 pb-6 space-y-3 shadow-lg"
          >
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                      isActive
                        ? 'text-black bg-[#F5F5F5] font-bold'
                        : 'text-[#666666] hover:text-black hover:bg-[#FAFAFA]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#EAEAEA] space-y-2">
              {showSignedIn ? (
                <div className="space-y-2">
                  {isUserAdmin && (
                    <Link
                      href="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 px-3 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                        <span>{isBn ? 'অ্যাডমিন অনুমোদন প্যানেল' : 'Admin Approval Panel'}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <Button asChild className="w-full text-xs font-bold rounded-xl h-10">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <UserIcon className="w-4 h-4 mr-1.5" />
                      <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full block text-center py-2.5 text-xs font-semibold text-black bg-[#FAFAFA] hover:bg-[#F0F0F0] rounded-xl border border-[#EAEAEA] transition-colors"
                  >
                    {t('nav.signin')}
                  </Link>
                  <Button asChild className="w-full text-xs font-bold rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                      <span>{isBn ? 'অনুমোদনের পর প্রতিদিন ৩টি ফ্রি ফাইল' : '3 Free Files Per Day After Approval'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Navbar;
