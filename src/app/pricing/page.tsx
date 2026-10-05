'use client';

import { Check, X, ShieldCheck } from 'lucide-react';
import { PricingCards } from '@/components/PricingCards';
import { useLanguage } from '@/context/LanguageContext';

const FEATURES = [
  { label: 'Web files', free: '3 per day after approval', paid: 'Unlimited' },
  { label: 'Saved profiles', free: '1', paid: '50' },
  { label: 'Automated form processing', free: true, paid: true },
  { label: 'Passport OCR extraction', free: false, paid: true },
  { label: 'AI profile extraction', free: false, paid: true },
  { label: 'Official PDF preview', free: false, paid: true },
  { label: 'Multi-applicant batches', free: false, paid: true },
  { label: 'Priority processing', free: false, paid: true },
] as const;

function Value({ value }: { value: string | boolean }) {
  if (typeof value === 'string') return <>{value}</>;
  return value ? <Check className="mx-auto h-5 w-5 text-emerald-600" /> : <X className="mx-auto h-5 w-5 text-slate-300" />;
}

export default function PricingPage() {
  const { isBn } = useLanguage();
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-14">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Simple access</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {isBn ? 'একটি ফ্রি প্ল্যান। একটি পেইড প্ল্যান।' : 'One free tier. One paid tier.'}
          </h1>
          <p className="mt-4 text-slate-600">
            {isBn ? 'নতুন অ্যাকাউন্ট অ্যাডমিন অনুমোদনের পর প্রতিদিন ৩টি ফ্রি ওয়েব ফাইল পাবে।' : 'New accounts receive 3 free web files per day after an administrator approves them.'}
          </p>
        </header>

        <PricingCards />

        <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-6">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <div><h2 className="font-bold text-slate-950">Access comparison</h2><p className="text-sm text-slate-500">All limits come from one server-side policy.</p></div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-4 text-left">Capability</th><th className="px-6 py-4 text-center">Free</th><th className="px-6 py-4 text-center">Paid</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {FEATURES.map((feature) => <tr key={feature.label}><td className="px-6 py-4 font-medium text-slate-800">{feature.label}</td><td className="px-6 py-4 text-center text-slate-600"><Value value={feature.free} /></td><td className="bg-emerald-50/40 px-6 py-4 text-center font-semibold text-slate-800"><Value value={feature.paid} /></td></tr>)}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
