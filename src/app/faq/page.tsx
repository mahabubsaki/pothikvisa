import React from 'react';
import Link from 'next/link';
import { FaqAccordion } from '@/components/FaqAccordion';
import { HelpCircle, MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Frequently Asked Questions — PothikVisa',
  description:
    'Answers to common questions about Indian visa form filling, photo requirements, captcha solving, and MFS payment verification.',
};

export function FaqPage() {
  return (
    <div className="py-16 md:py-24 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 vercel-radial">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-black">
          Support & Guidance
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">
          Frequently asked questions
        </h1>
        <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
          Clear answers regarding portal compliance, document formatting, session recovery, and subscription activation.
        </p>
      </div>

      {/* Accordion List */}
      <FaqAccordion />

      {/* Still Have Questions Box */}
      <div className="max-w-3xl mx-auto bg-[#FAFAFA] p-8 sm:p-10 rounded-2xl border border-[#EAEAEA] text-center space-y-4 shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center mx-auto shadow-2xs">
          <HelpCircle className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-black tracking-tight">
          Have a question not listed here?
        </h2>
        <p className="text-xs sm:text-sm text-[#555555] max-w-lg mx-auto leading-relaxed">
          Our support team is available on WhatsApp and email to assist individual applicants and travel agencies through complex applications.
        </p>
        <div className="pt-2 flex justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact support</span>
          </Link>
        </div>
      </div>

    </div>
  );
}

export default FaqPage;
