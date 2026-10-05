"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { PothikVisaLogo } from "@/components/PothikVisaLogo";
import { Gift, CheckCircle2, ShieldCheck, Zap, AlertTriangle } from "lucide-react";

function SignUpContent() {
  const searchParams = useSearchParams();

  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center py-12 px-4 sm:px-6">
      {/* Free Trial Value Header */}
      <div className="max-w-md w-full text-center space-y-3 mb-6">
        <div className="flex justify-center">
          <PothikVisaLogo size={48} />
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-2xs">
            <Gift className="w-3.5 h-3.5 text-emerald-600" />
            <span>নতুন অ্যাকাউন্ট অফার: ৩টি ফাইল সম্পূর্ণ ফ্রি</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 shadow-2xs font-bangla">
            <span>⚠️ শুধুমাত্র @gmail.com প্রযোজ্য</span>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-black tracking-tight font-bangla">
          পথিক ভিসায় স্বাগতম
        </h1>

        <p className="text-xs sm:text-sm text-[#555555] font-bangla leading-relaxed">
          সাইন আপ করার সাথে সাথেই ড্যাশবোর্ডে ৩টি ফ্রি ইন্ডিয়ান ভিসা ওয়েব ফাইল ক্রেডিট পাবেন। কোনো ক্রেডিট কার্ড বা বিকাশ পেমেন্ট ছাড়াই স্পিড যাচাই করুন।
        </p>

        {/* Feature Checkpoints */}
        <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-semibold text-emerald-800">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ০ ৳ নো কার্ড
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            ইনস্ট্যান্ট ৩ ক্রেডিট
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            অফিশিয়াল পিডিএফ
          </span>
        </div>
      </div>

      {/* Error Banners */}
      {error === "subaddress_blocked" && (
        <div className="max-w-md w-full mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-bangla space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-red-700">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-600" />
            <span>প্লাস অ্যাড্রেসিং (+) অনুমোদিত নয়</span>
          </div>
          <p className="leading-relaxed">
            পথিক ভিসায় জিমেইল প্লাস অ্যাড্রেসিং (যেমন: <code>name+1@gmail.com</code>) দিয়ে একাধিক ফ্রি অ্যাকাউন্ট তৈরি নিষিদ্ধ। অনুগ্রহ করে আপনার মূল <strong>@gmail.com</strong> অ্যাড্রেস ব্যবহার করে সাইন আপ করুন।
          </p>
        </div>
      )}

      {error === "gmail_only" && (
        <div className="max-w-md w-full mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-bangla space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-red-700">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-600" />
            <span>কাস্টম বা প্রাতিষ্ঠানিক ইমেইল অনুমোদিত নয়</span>
          </div>
          <p className="leading-relaxed">
            পথিক ভিসায় শুধুমাত্র ব্যক্তিগত <strong>@gmail.com</strong> অ্যাকাউন্ট গ্রহণযোগ্য। আপনি কাস্টম ডোমেইন ইমেইল (যেমন: Google Workspace / কাস্টম ইমেইল) দিয়ে চেষ্টা করেছিলেন। অনুগ্রহ করে ব্যক্তিগত Gmail অ্যাকাউন্ট দিয়ে সাইন আপ করুন।
          </p>
        </div>
      )}

      {/* Clerk Sign Up Component */}
      <div className="w-full max-w-md flex justify-center">
        <SignUp
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
          signInFallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpContent />
    </Suspense>
  );
}
