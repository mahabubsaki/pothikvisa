'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Copy, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  UserCheck, 
  HelpCircle,
  LogIn,
  Gift
} from 'lucide-react';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { PothikVisaLogo } from '@/components/PothikVisaLogo';

type PlanId = 'starter' | 'standard' | 'agency';
type MfsMethod = 'bkash' | 'nagad' | 'rocket';

interface PlanDetail {
  id: PlanId;
  name: string;
  nameBn: string;
  price: number;
  quota: string;
  quotaBn: string;
  desc: string;
  descBn: string;
}

const PLANS: Record<PlanId, PlanDetail> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    nameBn: 'স্টার্টার',
    price: 150,
    quota: '75 Web Files',
    quotaBn: '৭৫টি ওয়েব ফাইল তৈরি',
    desc: 'Self or family Indian visa web file creation',
    descBn: 'নিজে বা পরিবারের ইন্ডিয়ান ভিসা ওয়েব ফাইলের জন্য সাশ্রয়ী প্যাকেজ',
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    nameBn: 'স্ট্যান্ডার্ড (জনপ্রিয়)',
    price: 300,
    quota: '200 Web Files',
    quotaBn: '২০০টি ওয়েব ফাইল তৈরি (জনপ্রিয়)',
    desc: 'Fast-paced processing for frequent travelers and consultants',
    descBn: 'নিয়মিত ভ্রমণকারী ও কনসালট্যান্টদের জন্য হাই-স্পিড ২০০টি ওয়েব ফাইল',
  },
  agency: {
    id: 'agency',
    name: 'Agency Pro',
    nameBn: 'এজেন্সি প্রো (আনলিমিটেড)',
    price: 500,
    quota: 'Unlimited Web Files',
    quotaBn: 'আনলিমিটেড ওয়েব ফাইল তৈরি',
    desc: 'Unlimited volume with Smart AI Form Filler (WhatsApp/Excel) for agencies and cyber cafes',
    descBn: 'সাইবার ক্যাফে ও এজেন্সির জন্য স্মার্ট এআই ফর্ম ফিলার (WhatsApp/Excel) ও আনলিমিটেড ওয়েব ফাইল',
  },
};

const MFS_ACCOUNTS: Record<MfsMethod, { name: string; nameBn: string; number: string; type: string; typeBn: string; bg: string; border: string; text: string }> = {
  bkash: {
    name: 'bKash',
    nameBn: 'বিকাশ',
    number: '01714269744',
    type: 'Personal (Send Money)',
    typeBn: 'ব্যক্তিগত নম্বর (Send Money)',
    bg: 'bg-[#D12053]/10',
    border: 'border-[#D12053]/30',
    text: 'text-[#D12053]',
  },
  nagad: {
    name: 'Nagad',
    nameBn: 'নগদ',
    number: '01714269744',
    type: 'Personal (Send Money)',
    typeBn: 'ব্যক্তিগত নম্বর (Send Money)',
    bg: 'bg-[#F7941D]/10',
    border: 'border-[#F7941D]/30',
    text: 'text-[#EA580C]',
  },
  rocket: {
    name: 'Rocket',
    nameBn: 'রকেট',
    number: '017142697440',
    type: 'Personal (Send Money)',
    typeBn: 'ব্যক্তিগত নম্বর (Send Money)',
    bg: 'bg-[#8C3494]/10',
    border: 'border-[#8C3494]/30',
    text: 'text-[#8C3494]',
  },
};

interface CheckoutSuccessData {
  plan: string;
  amount: number;
  mfs_method: string;
  sender_phone: string;
  trx_id: string;
  id?: number | string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isBn } = useLanguage();

  const initialPlan = (searchParams.get('plan') as PlanId) || 'standard';
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    ['starter', 'standard', 'agency'].includes(initialPlan) ? initialPlan : 'standard'
  );
  const [selectedMfs, setSelectedMfs] = useState<MfsMethod>('bkash');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [note, setNote] = useState('');

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<CheckoutSuccessData | null>(null);

  const { user, isLoaded, isSignedIn } = useUser();

  const handleCopyNumber = () => {
    const rawNumber = MFS_ACCOUNTS[selectedMfs].number.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(rawNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isSignedIn) {
      setErrorMessage(
        isBn
          ? 'লেনদেন জমা দেওয়ার আগে দয়া করে সাইন ইন করুন।'
          : 'Please sign in before submitting payment verification.'
      );
      return;
    }

    if (!senderPhone.trim() || !trxId.trim()) {
      setErrorMessage(
        isBn
          ? 'প্রেরক ফোন নম্বর এবং ট্রানজেকশন আইডি (TrxID) আবশ্যক।'
          : 'Sender phone number and Transaction ID (TrxID) are required.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: PLANS[selectedPlan].price,
          mfsMethod: selectedMfs,
          senderPhone: senderPhone.trim(),
          trxId: trxId.trim().toUpperCase(),
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit transaction');
      }

      setSuccessData(data.transaction);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePlan = PLANS[selectedPlan];
  const activeMfs = MFS_ACCOUNTS[selectedMfs];

  return (
    <div className="min-h-screen bg-[#FBFBFB] py-12 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Breadcrumb & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EAEAEA] text-xs font-semibold text-[#666666] shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'নিরাপদ ম্যানুয়াল এমএফএস চেকআউট' : 'Secure Manual MFS Checkout'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
            {isBn ? 'প্যাকেজ সাবস্ক্রিপশন ও পেমেন্ট' : 'Complete Your Subscription'}
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] max-w-xl mx-auto">
            {isBn
              ? 'বিকাশ, নগদ বা রকেটের মাধ্যমে সেন্ড মানি করে নিচের ফর্মে আপনার TrxID জমা দিন।'
              : 'Send money via bKash, Nagad, or Rocket and submit your TrxID below for instant activation.'}
          </p>
        </div>

        {/* Free Trial Banner for New Users */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-emerald-950 font-bangla">
            <Gift className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">
                {isBn ? '🎁 নতুন ইউজার? সাইন আপ করলেই পাচ্ছেন ৩টি সম্পূর্ণ ফ্রি ওয়েব ফাইল!' : '🎁 New user? You get 3 Free Web Files on signup!'}
              </span>
              <p className="text-[11px] text-emerald-800">
                {isBn ? 'পেমেন্ট ছাড়াই আগে ৩টি ফাইল তৈরি করে সিস্টেমের স্পিড পরীক্ষা করে দেখুন।' : 'Test the platform speed with 3 full files before paying.'}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0">
            <Link href="/apply">
              <span>{isBn ? 'ফ্রি ফাইল ব্যবহার করুন' : 'Test Free Files'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Success Confirmation Modal / Card */}
        {successData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border-2 border-emerald-500 p-6 sm:p-8 shadow-sm space-y-5 text-center"
          >
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-black">
                {isBn ? 'ট্রানজেকশন সফলভাবে জমা হয়েছে!' : 'Transaction Submitted Successfully!'}
              </h2>
              <p className="text-xs sm:text-sm text-[#666666]">
                {isBn
                  ? 'আপনার অনুরোধটি আমাদের অ্যাডমিন রিভিউতে আছে। খুব দ্রুত যাচাই শেষে আপনার অ্যাকাউন্ট সক্রিয় হয়ে যাবে।'
                  : 'Your payment submission is pending verification. Your quota will activate as soon as approved.'}
              </p>
            </div>

            <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-[#EAEAEA]">
                <span className="text-[#666666]">{isBn ? 'নির্বাচিত প্ল্যান:' : 'Plan:'}</span>
                <span className="font-bold text-black uppercase">{successData.plan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EAEAEA]">
                <span className="text-[#666666]">{isBn ? 'প্রদেয় টাকা:' : 'Amount:'}</span>
                <span className="font-bold text-black">৳{successData.amount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EAEAEA]">
                <span className="text-[#666666]">{isBn ? 'পেমেন্ট মেথড:' : 'Method:'}</span>
                <span className="font-bold text-black uppercase">{successData.mfs_method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EAEAEA]">
                <span className="text-[#666666]">{isBn ? 'প্রেরক নম্বর:' : 'Sender Phone:'}</span>
                <span className="font-mono font-medium text-black">{successData.sender_phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#666666]">TrxID:</span>
                <span className="font-mono font-bold text-emerald-700">{successData.trx_id}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/dashboard">
                  <span>{isBn ? 'ড্যাশবোর্ডে ফিরে যান' : 'Go to User Dashboard'}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link href="/admin/transactions">
                  <span>{isBn ? 'অ্যাডমিন ভেরিফিকেশন প্যানেল' : 'Admin Approval Panel'}</span>
                </Link>
              </Button>
            </div>
          </motion.div>
        )}

        {!successData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Plan & Payment Instructions (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Step 1: Select Plan */}
              <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">
                    {isBn ? 'ধাপ ১: প্ল্যান নিশ্চিত করুন' : 'Step 1: Select Plan'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {isBn ? '৩০ দিনের মেয়াদ' : '30-Day Quota'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(PLANS) as PlanId[]).map((pid) => {
                    const p = PLANS[pid];
                    const isSelected = selectedPlan === pid;
                    return (
                      <button
                        type="button"
                        key={pid}
                        onClick={() => setSelectedPlan(pid)}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-black bg-black text-white shadow-sm ring-1 ring-black'
                            : 'border-[#EAEAEA] bg-white text-black hover:border-[#CCCCCC]'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">
                          {isBn ? p.nameBn.split(' ')[0] : p.name}
                        </div>
                        <div className="text-base font-extrabold mt-1">
                          ৳{p.price}
                        </div>
                        <div className={`text-[10px] mt-1 leading-tight ${isSelected ? 'text-zinc-300' : 'text-[#666666]'}`}>
                          {isBn ? p.quotaBn.split(' ')[0] : p.quota.split(' ')[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl p-3 text-xs text-[#555555] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-black">
                      {isBn ? activePlan.nameBn : activePlan.name}:
                    </span>{' '}
                    {isBn ? activePlan.descBn : activePlan.desc} (
                    <span className="font-bold text-black">
                      {isBn ? activePlan.quotaBn : activePlan.quota}
                    </span>
                    )
                  </div>
                </div>
              </div>

              {/* Step 2: Choose MFS & Transfer Number */}
              <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 sm:p-6 shadow-2xs space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">
                  {isBn ? 'ধাপ ২: এমএফএস নির্বাচন ও সেন্ড মানি' : 'Step 2: Choose MFS & Send Money'}
                </span>

                {/* MFS Selector Buttons */}
                <div className="grid grid-cols-3 gap-2.5">
                  {(Object.keys(MFS_ACCOUNTS) as MfsMethod[]).map((mfsKey) => {
                    const mfs = MFS_ACCOUNTS[mfsKey];
                    const isSelected = selectedMfs === mfsKey;
                    return (
                      <button
                        type="button"
                        key={mfsKey}
                        onClick={() => setSelectedMfs(mfsKey)}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                          isSelected
                            ? `${mfs.bg} ${mfs.border} ${mfs.text} ring-1 ring-current`
                            : 'border-[#EAEAEA] bg-white text-[#555555] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        {isBn ? mfs.nameBn : mfs.name}
                      </button>
                    );
                  })}
                </div>

                {/* Recipient Account Box */}
                <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-[#888888]">
                        {isBn ? 'অফিসিয়াল প্রাপক অ্যাকাউন্ট' : 'Official Recipient Number'}
                      </div>
                      <div className="text-xs font-semibold text-black">
                        {isBn ? activeMfs.typeBn : activeMfs.type}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white font-mono">
                      Personal
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#EAEAEA]">
                    <div className="font-mono text-lg sm:text-xl font-extrabold tracking-wide text-black">
                      {activeMfs.number}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCopyNumber}
                      className="gap-1.5 text-xs font-semibold shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">
                            {isBn ? 'কপি হয়েছে' : 'Copied!'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isBn ? 'নম্বর কপি' : 'Copy'}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Payment instruction checklist */}
                  <div className="text-xs space-y-1.5 text-[#555555] pt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center justify-center">1</span>
                      <span>
                        {isBn ? `${activeMfs.nameBn} অ্যাপে গিয়ে Send Money চাপুন` : `Open ${activeMfs.name} app and choose 'Send Money'`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center justify-center">2</span>
                      <span>
                        {isBn ? `সঠিক পরিমাণ ৳${activePlan.price} পাঠান` : `Send exact amount of ৳${activePlan.price}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center justify-center">3</span>
                      <span>
                        {isBn ? 'কনফার্মেশন SMS বা স্টেটমেন্ট থেকে TrxID কপি করে ডানের ফর্মে জমা দিন' : 'Copy the TrxID from SMS and submit in the form'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column: Submission Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-2xl border border-[#EAEAEA] p-5 sm:p-6 shadow-2xs space-y-5">
                
                {/* Auth status box */}
                <div className="pb-3 border-b border-[#EAEAEA]">
                  {!isLoaded ? (
                    <div className="flex items-center gap-2 text-xs text-[#888888]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isBn ? 'অ্যাকাউন্ট স্ট্যাটাস চেক হচ্ছে...' : 'Checking Clerk account...'}</span>
                    </div>
                  ) : isSignedIn && user ? (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {user.imageUrl ? (
                          <img src={user.imageUrl} alt="Avatar" className="w-7 h-7 rounded-full border border-[#EAEAEA]" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            {user.firstName?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-black leading-tight">
                            {user.fullName || user.primaryEmailAddress?.emailAddress}
                          </div>
                          <div className="text-[10px] text-[#666666]">{user.primaryEmailAddress?.emailAddress}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                        {isBn ? 'সাইন ইন আছেন' : 'Signed In'}
                      </Badge>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{isBn ? 'সাইন ইন প্রয়োজন' : 'Sign In Required'}</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        {isBn
                          ? 'পেমেন্ট জমা দেওয়ার আগে আপনার অ্যাকাউন্টে সাইন ইন করুন যাতে কোটা সরাসরি আপনার অ্যাকাউন্টে যোগ হতে পারে।'
                          : 'Sign in to link this transaction to your account quota automatically.'}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <SignInButton mode="modal">
                          <Button
                            type="button"
                            size="sm"
                            className="text-[11px] h-8 bg-black hover:bg-neutral-800 text-white rounded-lg font-semibold"
                          >
                            <LogIn className="w-3.5 h-3.5 mr-1" />
                            {isBn ? 'সাইন ইন করুন' : 'Sign In'}
                          </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-[11px] h-8 rounded-lg font-semibold bg-white"
                          >
                            {isBn ? 'নতুন অ্যাকাউন্ট' : 'Register'}
                          </Button>
                        </SignUpButton>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-black mb-1.5">
                      {isBn ? 'আপনার প্রেরক ফোন নম্বর' : 'Sender Phone Number'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="01XXXXXXXXX"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EAEAEA] bg-white focus:outline-none focus:ring-2 focus:ring-black font-mono"
                    />
                    <p className="text-[10px] text-[#888888] mt-1">
                      {isBn ? 'যে বিকাশ/নগদ নম্বর থেকে টাকা পাঠিয়েছেন' : 'Phone number used to make the payment'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1.5">
                      {isBn ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: BL839K109A"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EAEAEA] bg-white focus:outline-none focus:ring-2 focus:ring-black font-mono font-bold tracking-wider uppercase text-black"
                    />
                    <p className="text-[10px] text-[#888888] mt-1">
                      {isBn ? 'SMS বা অ্যাপের ৮-১০ অক্ষরের ইউনিক কোড' : 'Alphanumeric ID from your SMS receipt'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1.5">
                      {isBn ? 'অতিরিক্ত নোট (ঐচ্ছিক)' : 'Additional Note (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={isBn ? 'যেমন: রফিকুলের আবেদন' : 'e.g., Application for Rafiqul'}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAEAEA] bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 text-xs sm:text-sm font-bold rounded-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>{isBn ? 'যাচাইয়ের জন্য পাঠানো হচ্ছে...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <span>
                          {isBn
                            ? `৳${activePlan.price} পেমেন্ট জমা দিন`
                            : `Submit ৳${activePlan.price} Payment`}
                        </span>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="pt-2 border-t border-[#EAEAEA] text-center">
                  <span className="text-[10px] text-[#888888] flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>{isBn ? '১০০% বিশ্বস্ত ও অফিশিয়াল ভেরিফিকেশন' : 'Verified by PothikVisa Operations Team'}</span>
                  </span>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
