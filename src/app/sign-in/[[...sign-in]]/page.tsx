"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { PothikVisaLogo } from "@/components/PothikVisaLogo";
import { Mail, AlertTriangle, UserX } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();

  const error = searchParams.get("error");
  const isBouncedOAuth = searchParams.has("sign_in_fallback_redirect_url") && searchParams.has("sign_up_fallback_redirect_url");

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center py-12 px-4 sm:px-6">
      {/* Brand Header */}
      <div className="max-w-md w-full text-center space-y-3 mb-6">
        <div className="flex justify-center">
          <PothikVisaLogo size={46} />
        </div>

        <h1 className="text-2xl font-extrabold text-black tracking-tight font-bangla">
          পথিক ভিসায় সাইন ইন করুন
        </h1>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 shadow-2xs font-bangla">
          <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>নতুন অ্যাকাউন্টে অ্যাডমিন অনুমোদন প্রয়োজন</span>
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
            পথিক ভিসায় জিমেইল প্লাস অ্যাড্রেসিং (যেমন: <code>name+1@gmail.com</code>) গ্রহণযোগ্য নয়। অনুগ্রহ করে আপনার মূল <strong>@gmail.com</strong> অ্যাড্রেস ব্যবহার করে সাইন ইন করুন।
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
            পথিক ভিসায় শুধুমাত্র ব্যক্তিগত <strong>@gmail.com</strong> অ্যাকাউন্ট গ্রহণযোগ্য। আপনি কাস্টম ডোমেইন ইমেইল দিয়ে চেষ্টা করেছিলেন যা স্থায়ীভাবে ব্লক করা হয়েছে। অনুগ্রহ করে ব্যক্তিগত Gmail অ্যাকাউন্ট ব্যবহার করুন।
          </p>
        </div>
      )}

      {isBouncedOAuth && !error && (
        <div className="max-w-md w-full mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bangla space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <UserX className="w-4.5 h-4.5 shrink-0 text-amber-600" />
            <span>কোনো নিবন্ধিত অ্যাকাউন্ট পাওয়া যায়নি</span>
          </div>
          <p className="leading-relaxed">
            এই ইমেইল দিয়ে পথিক ভিসায় কোনো অ্যাকাউন্ট নেই। আপনি যদি নতুন ব্যবহারকারী হন, অনুগ্রহ করে ব্যক্তিগত <strong>@gmail.com</strong> অ্যাকাউন্ট দিয়ে{' '}
            <Link href="/sign-up" className="underline font-bold text-emerald-700 hover:text-emerald-800">
              সাইন আপ (Sign Up)
            </Link>{' '}
            করুন। (কাস্টম ডোমেইন বা নন-Gmail ইমেইল গ্রহণযোগ্য নয়)
          </p>
        </div>
      )}

      {/* Clerk Sign In Component */}
      <div className="w-full max-w-md flex justify-center">
        <SignIn
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/pending-approval"
          signUpFallbackRedirectUrl="/pending-approval"
        />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
