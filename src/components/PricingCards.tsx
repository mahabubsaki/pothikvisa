'use client';

import Link from 'next/link';
import { Check, ArrowRight, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { ACCESS_POLICY } from '@/lib/access-policy';

export function PricingCards() {
  const { isBn } = useLanguage();
  const plans = [
    {
      id: 'free',
      name: isBn ? 'ফ্রি' : 'Free',
      price: 0,
      description: isBn ? 'অনুমোদিত নতুন ব্যবহারকারীদের জন্য।' : 'For approved new users getting started.',
      features: isBn
        ? ['৩টি ওয়েব ফাইল', '১টি সংরক্ষিত প্রোফাইল', 'ফর্ম অটোমেশন', 'ভিসা স্ট্যাটাস চেক']
        : ['3 web files per day after approval', '1 saved applicant profile', 'Form automation'],
      href: '/sign-up',
      cta: isBn ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create an account',
      icon: Gift,
      highlighted: false,
    },
    {
      id: 'paid',
      name: isBn ? 'পেইড' : 'Paid',
      price: ACCESS_POLICY.paid.priceBdt,
      description: isBn ? 'পেশাদার ও বেশি কাজের জন্য সম্পূর্ণ সুবিধা।' : 'Every capability for professional and higher-volume work.',
      features: isBn
        ? ['সীমাহীন ওয়েব ফাইল', '৫০টি সংরক্ষিত প্রোফাইল', 'পাসপোর্ট OCR ও AI ফিলার', 'ব্যাচ প্রসেসিং ও PDF প্রিভিউ', 'প্রায়োরিটি কিউ']
        : ['Unlimited web files', '50 saved applicant profiles', 'Passport OCR and AI form filler', 'Batch processing and PDF preview', 'Priority queue'],
      href: '/checkout?plan=paid',
      cta: isBn ? 'পেইড নিন' : 'Choose Paid',
      icon: Sparkles,
      highlighted: true,
    },
  ];

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
      {plans.map((plan) => {
        const Icon = plan.icon;
        return (
          <article key={plan.id} className={`flex flex-col rounded-3xl border bg-white p-8 shadow-sm ${plan.highlighted ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`rounded-xl p-2.5 ${plan.highlighted ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}><Icon className="h-5 w-5" /></span>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
              </div>
              {plan.highlighted && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">30 days</span>}
            </div>
            <div className="mt-7 flex items-end gap-2">
              <span className="text-5xl font-black">৳{plan.price}</span>
              <span className="pb-1 text-sm text-slate-500">{plan.price ? '/ 30 days' : 'forever'}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>
            <ul className="my-7 flex-1 space-y-3">
              {plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}
            </ul>
            <Button asChild className={plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-700' : ''} variant={plan.highlighted ? 'default' : 'outline'}>
              <Link href={plan.href}>{plan.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </article>
        );
      })}
    </div>
  );
}

export default PricingCards;
