'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { isBn } = useLanguage();

  const faqs = isBn
    ? [
        {
          question: 'আমি কি টাকা দেওয়ার আগেই সফটওয়্যারটির কাজ পরীক্ষা করতে পারব?',
          answer:
            'হ্যাঁ, অবশ্যই! সাইন আপ করার সাথে সাথেই আপনার অ্যাকাউন্টে ৩টি ওয়েব ফাইল সম্পূর্ণ ফ্রি ট্রায়াল ব্যালেন্স হিসেবে যোগ হবে। কোনো ক্রেডিট কার্ড বা বিকাশ পেমেন্ট ছাড়াই আপনি অটো-ফিল, ২×২ ছবির মাপ ও অফিসিয়াল ৪-পাতার পিডিএফ স্পিড নিজে তৈরি করে যাচাই করতে পারবেন।',
        },
        {
          question: 'পোর্টাল থেকে হঠাৎ লগআউট বা সেশন ড্রপ কেন হয় না?',
          answer:
            'সাধারণত ম্যানুয়ালি ফর্ম পূরণ করতে ১৫–২০ মিনিট লেগে যায়, আর একটু দেরি হলেই সরকারি সার্ভার স্বয়ংক্রিয়ভাবে সেশন এক্সপায়ার করে দেয়। পথিক ভিসা পুরো ৯টি ধাপ কয়েক সেকেন্ডের মধ্যে নির্ভুলভাবে সাবমিট করে ফেলে — ফলে টাইমআউটের কোনো ঝুঁকি থাকে না।',
        },
        {
          question: 'মাঝপথে সরকারি সার্ভার ডাউন হলে কি আবার প্রথম থেকে শুরু করতে হবে?',
          answer:
            'একদমই না! প্রতিটি ধাপ সম্পন্ন হওয়ার সাথে সাথে ডাটা নিরাপদে সেভ হয়ে থাকে। সরকারি সার্ভার কানেকশন ড্রপ করলেও আপনি ঠিক যেখান থেকে থেমেছিলেন, এক ক্লিকেই সেখান থেকে আগের তথ্যাবলি ঠিক রেখে আবেদন চালিয়ে যেতে পারবেন।',
        },
        {
          question: 'বিকাশ, নগদ বা রকেটে পেমেন্ট কীভাবে কনফার্ম হবে?',
          answer:
            'পদ্ধতি খুবই সহজ। আপনার পছন্দের প্ল্যানটি বেছে নিয়ে আমাদের বিকাশ, নগদ বা রকেট নম্বরে নির্ধারিত টাকা সেন্ড মানি করুন। এরপর আপনার মোবাইল নম্বর ও ট্রানজেকশন আইডি (TrxID) ইনপুট দিলেই খুব দ্রুত আপনার মাসিক আবেদন কোটা চালু হয়ে যাবে।',
        },
        {
          question: 'ছবির মাপ ও ব্যাকগ্রাউন্ড কেমন হতে হবে?',
          answer:
            'আইভ্যাক সেন্টারের নিয়ম অনুযায়ী ছবি হতে হয় নিখুঁত ২×২ ইঞ্চি ও সম্পূর্ণ সাদা ব্যাকগ্রাউন্ডের। মোবাইল থেকে যেকোনো সাধারণ পাসপোর্ট সাইজ ছবি আপলোড করলেই আমাদের সিস্টেম স্বয়ংক্রিয়ভাবে তা কনস্যুলার স্ট্যান্ডার্ড অনুযায়ী ক্রপ ও রিসাইজ করে নেয়।',
        },
        {
          question: '১৫০ ৳, ৩০০ ৳ এবং ৫০০ ৳ প্যাকেজের মধ্যে কোনটা আমার জন্য ভালো?',
          answer:
            'নিজে বা পরিবারের ভিসার জন্য স্টার্টার (১৫০ ৳ / ৭৫টি ওয়েব ফাইল — মাত্র ২ ৳ / ফাইল) একদম সাশ্রয়ী। নিয়মিত ভ্রমণকারী ও ভিসা কনসালট্যান্টদের জন্য স্ট্যান্ডার্ড প্যাক (৩০০ ৳ / ২০০টি ওয়েব ফাইল — মাত্র ১.৫ ৳ / ফাইল + পাসপোর্ট অটো-ফিল) সবচেয়ে জনপ্রিয়। আর সাইবার ক্যাফে ও এজেন্সিদের জন্য রয়েছে আনলিমিটেড এজেন্সি প্রো (৫০০ ৳ + স্মার্ট এআই ফর্ম ফিলার)।',
        },
        {
          question: 'পথিক ভিসা কি আইভ্যাকের ভিসা ফি জমা নেয়?',
          answer:
            'না। পথিক ভিসা হলো একটি দ্রুতগতির ফর্ম পূরণ ও ডকুমেন্ট অটোমেশন সফটওয়্যার। ফর্ম সাবমিট ও পিডিএফ পাওয়ার পর অফিশিয়াল আইভ্যাক ওয়েবসাইট (ivacbangladesh.com) থেকে সরকারি ভিসা প্রসেসিং ফি দিয়ে অ্যাপয়েন্টমেন্ট ডেট নিতে হবে।',
        },
        {
          question: 'বাংলাদেশের কোন কোন ভিসা সেন্টারে জমা দেওয়া যাবে?',
          answer:
            'ঢাকা (যমুনা ফিউচার পার্ক), চট্টগ্রাম, রাজশাহী, সিলেট ও খুলনা — দেশের সকল অনুমোদিত আইভ্যাক সেন্টারে জমার জন্য শতভাগ উপযুক্ত ফরম্যাটে পিডিএফ তৈরি হয়।',
        },
      ]
    : [
        {
          question: 'Can I test the platform before making any payment?',
          answer:
            'Yes, absolutely! Every new account instantly receives 3 Free Web Files on signup. No credit card or bKash payment is required. You can test automated form fill-up, 2×2 consular photo cropping, and official 4-page PDF generation completely risk-free.',
        },
        {
          question: 'How does PothikVisa prevent portal session dropouts?',
          answer:
            'The Indian visa portal automatically logs out applicants if filling each step takes too long. PothikVisa validates inputs and executes step submissions rapidly within seconds, completing the full 9-step submission in under a minute before timeouts can occur.',
        },
        {
          question: 'What happens if the government server interrupts the connection halfway through?',
          answer:
            'PothikVisa securely checkpoints your progress at each milestone. If any connection interruption happens on later steps, you never have to start over from scratch. You can pick up smoothly from your saved state with all previously verified data already intact.',
        },
        {
          question: 'How does the bKash, Nagad, or Rocket payment verification work?',
          answer:
            'We support direct manual MFS transactions in Bangladeshi Taka. Choose your subscription plan (150 ৳, 300 ৳, or 500 ৳), send the amount to our official bKash, Nagad, or Rocket number, and enter your sender number along with the Transaction ID (TrxID) in the checkout form. Our team verifies the transaction and activates your monthly quota.',
        },
        {
          question: 'What are the photo standards required for submission?',
          answer:
            'The portal requires a 2×2 inch square photo with a plain white background and specific file size limits. Our platform automatically crops, aligns, and adjusts your photo to meet 100% of embassy formatting rules before submission.',
        },
        {
          question: 'What is the difference between the 150 ৳, 300 ৳, and 500 ৳ plans?',
          answer:
            'The Starter plan (150 ৳) provides 75 Web Files per month (2 ৳ per file) with automated form filling. The Standard plan (300 ৳) provides 200 Web Files per month (1.5 ৳ per file), automated Passport document reading, pixel-perfect official PDF preview, and priority processing. The Agency Pro plan (500 ৳) offers unlimited Web Files, Smart AI Form Filler (WhatsApp/Excel autofill), multi-applicant batching, and dedicated support for travel agencies and cyber cafes.',
        },
        {
          question: 'Does PothikVisa pay the IVAC visa processing fee or schedule the appointment?',
          answer:
            'No. PothikVisa is a document automation and form-filling software. Once your form is submitted and your official PDF is generated, you pay the visa processing fee and schedule your physical appointment directly through the official IVAC Bangladesh portal (ivacbangladesh.com).',
        },
        {
          question: 'Which Indian visa missions in Bangladesh are supported?',
          answer:
            'All Indian visa missions in Bangladesh are fully supported: Dhaka (BGDD), Chittagong (BGDC), Rajshahi (BGDR), Sylhet (BGDS), and Khulna (BGDK). You can select your designated mission during application setup.',
        },
      ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-3.5 max-w-3xl mx-auto">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-[#EAEAEA] hover:border-[#D4D4D8] overflow-hidden transition-colors shadow-2xs"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full p-5 text-left flex items-center justify-between gap-4 text-black font-bold text-sm sm:text-base hover:text-neutral-800 focus:outline-none"
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 text-[#888888]"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
            
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#555555] leading-relaxed border-t border-[#F5F5F5] pt-3.5">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default FaqAccordion;
