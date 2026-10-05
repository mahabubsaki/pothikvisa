'use client';

import React from 'react';
import Image from 'next/image';

interface PothikVisaLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  bengaliSubtitle?: boolean;
  useImage?: boolean;
}

/**
 * PothikVisa (পথিক ভিসা) Official Brand Logo
 * 
 * Concept:
 * - Rounded squircle container with obsidian carbon finish (#0A0A0A)
 * - Precision-engineered monogram fusing:
 *   1. "P" for Pothik (পথিক — the wayfarer/traveler)
 *   2. The dynamic forward-upward compass trajectory (visa journey)
 *   3. Sharp consular document spine and crisp emerald waypoint accent (#10B981)
 */
export function PothikVisaLogo({
  size = 34,
  className = '',
  showText = false,
  bengaliSubtitle = true,
  useImage = true,
}: PothikVisaLogoProps) {
  const icon = useImage ? (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl group-hover:scale-105 transition-transform duration-200 border border-white/10 shadow-xs"
      style={{ width: size, height: size }}
    >
      <Image
        src="/pothikvisa-logo.png"
        alt="PothikVisa Logo"
        width={size}
        height={size}
        priority
        className="w-full h-full object-cover"
      />
    </div>
  ) : (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      aria-label="PothikVisa Logo"
    >
      <rect width="48" height="48" rx="12" fill="#0A0A0A" />
      <rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="11.25"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1.5"
      />
      <circle cx="28" cy="20" r="10" fill="#10B981" fillOpacity="0.12" />
      <path
        d="M14 12C14 10.8954 14.8954 10 16 10H18C19.1046 10 20 10.8954 20 12V36C20 37.1046 19.1046 38 18 38H16C14.8954 38 14 37.1046 14 36V12Z"
        fill="white"
      />
      <path
        d="M20 12H27C32.5228 12 37 16.0294 37 21C37 25.9706 32.5228 30 27 30H20"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 21L28 17L32 21"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="25" r="2" fill="#10B981" />
    </svg>
  );

  if (!showText) {
    return <div className={`inline-flex items-center ${className}`}>{icon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {icon}
      <div className="flex items-center gap-2">
        <span className="font-extrabold text-base text-black tracking-tight">
          PothikVisa
        </span>
        {bengaliSubtitle && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAFAFA] text-[#666666] border border-[#EAEAEA]">
            পথিক ভিসা
          </span>
        )}
      </div>
    </div>
  );
}

export default PothikVisaLogo;
