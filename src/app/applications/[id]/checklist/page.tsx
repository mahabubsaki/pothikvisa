'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  FileCheck,
  Building,
  Clock,
  MapPin,
  Download,
  Languages,
  CheckSquare,
  Square,
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Globe,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IvacChecklistData, ChecklistItem } from '@/lib/ivacChecklist';
import { PothikVisaLogo } from '@/components/PothikVisaLogo';
import type { VisaStatusResult } from '@/services/visaStatus';

export default function IvacChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<IvacChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBn, setIsBn] = useState(true);
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [activeQr, setActiveQr] = useState<'verification' | 'govt'>('verification');
  const [statusChecking, setStatusChecking] = useState(false);
  const [statusResult, setStatusResult] = useState<VisaStatusResult | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const handleCheckGovtStatus = async () => {
    setStatusChecking(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/applications/${id}/status`);
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || resData.error || 'Failed to check status');
      }
      setStatusResult(resData.data);
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : 'Status check failed');
    } finally {
      setStatusChecking(false);
    }
  };

  useEffect(() => {
    fetch(`/api/applications/${id}/checklist`)
      .then((res) => {
        if (!res.ok) throw new Error('Checklist could not be loaded');
        return res.json();
      })
      .then((res) => {
        if (res.success && res.checklist) {
          setData(res.checklist);
          const initialChecked: Record<string, boolean> = {};
          res.checklist.items.forEach((item: ChecklistItem) => {
            initialChecked[item.id] = false;
          });
          setCheckedMap(initialChecked);
        } else {
          setError(res.error || 'Failed to fetch checklist');
        }
      })
      .catch((err) => {
        setError(err.message || 'Network error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const toggleCheck = (itemId: string) => {
    setCheckedMap((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const totalItems = data?.items.length || 0;
  const checkedCount = Object.values(checkedMap).filter(Boolean).length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 py-6 sm:py-10 px-3 sm:px-6">
      {/* Print stylesheet override */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-slip {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Navigation / Action Top Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
          <Button asChild variant="ghost" size="sm" className="text-xs font-semibold">
            <Link href="/dashboard">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>{isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}</span>
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBn(!isBn)}
              className="text-xs font-semibold rounded-full border-zinc-300"
            >
              <Languages className="w-3.5 h-3.5 mr-1 text-zinc-500" />
              <span>{isBn ? 'English' : 'বাংলা'}</span>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs rounded-full border-zinc-300"
            >
              <a href={`/api/applications/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>{isBn ? 'ভিসা ফর্ম PDF' : 'Visa Form PDF'}</span>
              </a>
            </Button>

            <Button
              onClick={handlePrint}
              size="sm"
              className="text-xs font-bold rounded-full bg-black text-white hover:bg-zinc-800 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>{isBn ? 'প্রিন্ট / সেভ PDF' : 'Print / Save PDF'}</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white p-20 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-zinc-500 font-bangla">
              {isBn ? 'আইভ্যাক স্লিপ ও প্রয়োজনীয় নথিপত্রের তালিকা লোড হচ্ছে...' : 'Loading IVAC Checklist...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white p-10 rounded-3xl border border-red-200 shadow-sm text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

        {/* Mobile 1-Click PDF Download Hero Card */}
        {data && (
          <div className="no-print bg-linear-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-sm sm:text-base flex items-center gap-2 font-bangla">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>{isBn ? '১-ক্লিকে অফিসিয়াল আবেদন PDF ডাউনলোড' : '1-Click Official Visa Application PDF Download'}</span>
              </div>
              <p className="text-xs text-emerald-100/90 font-bangla leading-relaxed">
                {isBn
                  ? 'আপনার মোবাইল থেকেই সরাসরি অফিসিয়াল ভিসা ফর্ম PDF ডাউনলোড বা ভিউ করতে পাশের বাটনে চাপ দিন।'
                  : 'Download or view your official Indian Visa PDF application instantly on your device.'}
              </p>
            </div>
            <Button
              asChild
              className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs sm:text-sm h-10 px-5 rounded-xl shrink-0 shadow-md gap-2"
            >
              <a href={`/api/applications/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 text-emerald-700" />
                <span>{isBn ? '১-ক্লিকে PDF ডাউনলোড' : '1-Click Download PDF'}</span>
              </a>
            </Button>
          </div>
        )}

        {/* Main Document Slip */}
        {data && (
          <div
            id="printable-slip"
            className="bg-white rounded-3xl border border-zinc-200 shadow-md p-6 sm:p-10 space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-5">
              <div className="flex items-center gap-3">
                <PothikVisaLogo className="w-10 h-10" />
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-black tracking-tight uppercase font-bangla">
                    {isBn ? 'আইভ্যাক ভিসা সাবমিশন স্লিপ ও চেকলিস্ট' : 'IVAC Visa Submission Slip & Checklist'}
                  </h1>
                  <p className="text-xs text-zinc-600 font-medium">
                    {data.centerInfo.missionEn} • {data.centerInfo.nameEn}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 self-end sm:self-center">
                <div className="text-center p-1.5 bg-white border border-zinc-300 rounded-2xl shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeQr === 'verification' ? data.qrCodeDataUrl : (data.govtQrCodeDataUrl || data.qrCodeDataUrl)}
                    alt="Submission QR Code"
                    className="w-22 h-22 sm:w-26 sm:h-26 object-contain mx-auto"
                  />
                  <span className="block text-[9px] font-mono text-zinc-600 font-bold uppercase mt-1">
                    {activeQr === 'verification'
                      ? (isBn ? '📱 মোবাইল ডিজিটাল স্লিপ' : '📱 Mobile Digital Slip')
                      : (isBn ? '🏛️ সরকারি স্ট্যাটাস লিংক' : '🏛️ Govt Status Link')}
                  </span>
                </div>

                {/* QR Toggle Pills (Hidden on print) */}
                <div className="no-print flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setActiveQr('verification')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      activeQr === 'verification'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    {isBn ? 'ডিজিটাল স্লিপ' : 'Digital Slip'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQr('govt')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      activeQr === 'govt'
                        ? 'bg-black text-white shadow-xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    {isBn ? 'সরকারি ট্র্যাকিং' : 'Govt Status'}
                  </button>
                </div>
              </div>
            </div>

            {/* Applicant Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block font-bangla">
                  {isBn ? 'ওয়েব ফাইল নম্বর (Web File No)' : 'Web File Number'}
                </span>
                <span className="font-mono font-extrabold text-sm text-black tracking-wider bg-white px-2 py-0.5 rounded border border-zinc-200 inline-block mt-0.5">
                  {data.webFileNumber}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block font-bangla">
                  {isBn ? 'আবেদনকারীর নাম' : 'Applicant Name'}
                </span>
                <span className="font-bold text-black uppercase block truncate mt-0.5">
                  {data.applicantName}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block font-bangla">
                  {isBn ? 'পাসপোর্ট নম্বর' : 'Passport Number'}
                </span>
                <span className="font-mono font-bold text-zinc-800 uppercase block mt-0.5">
                  {data.passportNumber}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block font-bangla">
                  {isBn ? 'ভিসার ধরন ও পেশা' : 'Visa Category & Profession'}
                </span>
                <span className="font-semibold text-emerald-700 block mt-0.5">
                  {isBn ? data.visaTypeLabelBn : data.visaTypeLabelEn} • {isBn ? data.occupationLabelBn : data.occupationLabelEn}
                </span>
              </div>
            </div>

            {/* IVAC Center Submission Details */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm font-bangla">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>{isBn ? data.centerInfo.nameBn : data.centerInfo.nameEn}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-zinc-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                  <span>{isBn ? data.centerInfo.addressBn : data.centerInfo.addressEn}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>
                    <strong className="font-semibold text-zinc-800">{isBn ? 'জমা দেওয়ার সময়:' : 'Submission:'}</strong> {data.centerInfo.submissionHours}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Indian Visa Live Status Enquiry Box */}
            <div className="bg-zinc-900 text-white rounded-2xl p-4 shadow-sm border border-zinc-800 space-y-3 no-print">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 font-bangla">
                      {isBn ? 'অফিসিয়াল ভারতীয় দূতাবাস লাইভ ভিসা ট্র্যাকিং' : 'Official Indian Embassy Visa Status Tracking'}
                      <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-950/40 font-mono">
                        LIVE NIC
                      </Badge>
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-bangla">
                      {isBn
                        ? 'দূতাবাসের StatusEnquiry সার্ভার থেকে সরাসরি বর্তমান অগ্রগতি অনুসন্ধান করুন।'
                        : 'Direct real-time query to official indianvisa-bangladesh.nic.in portal.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <Button
                    onClick={handleCheckGovtStatus}
                    disabled={statusChecking}
                    size="sm"
                    className="flex-1 sm:flex-none h-8 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-xs gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${statusChecking ? 'animate-spin' : ''}`} />
                    <span>
                      {statusChecking
                        ? (isBn ? 'অনুসন্ধান চলছে...' : 'Checking...')
                        : (isBn ? 'লাইভ স্ট্যাটাস যাচাই' : 'Check Status Now')}
                    </span>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-xl border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                  >
                    <a
                      href="https://indianvisa-bangladesh.nic.in/visa/StatusEnquiry"
                      target="_blank"
                      rel="noopener noreferrer"
                      title={isBn ? 'সরকারি সাইটে সরাসরি যান' : 'Open Official Govt Site'}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Status Result Card */}
              {statusResult && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-emerald-500/40 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-bangla">{isBn ? 'সরকারি স্ট্যাটাস:' : 'Official Status:'}</span>
                    <span className="font-extrabold text-emerald-400 font-mono text-sm bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      {statusResult.status}
                    </span>
                  </div>
                  {statusResult.statusBn && (
                    <p className="text-[11px] text-zinc-300 font-bangla font-semibold">
                      {statusResult.statusBn}
                    </p>
                  )}
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between pt-1 border-t border-zinc-900">
                    <span>File: {statusResult.webFileNumber}</span>
                    <span>Checked: {new Date(statusResult.checkedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              {statusError && (
                <div className="p-2.5 bg-red-950/50 rounded-xl border border-red-500/30 text-rose-300 text-xs">
                  ⚠️ {statusError}
                </div>
              )}
            </div>

            {/* Completion Progress (Hidden on print) */}
            <div className="no-print bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-zinc-700 font-bangla">
                  {isBn
                    ? `চেকলিস্ট প্রস্তুতি: ${checkedCount} / ${totalItems} সম্পন্ন (${progressPct}%)`
                    : `Checklist Completion: ${checkedCount} / ${totalItems} ready (${progressPct}%)`}
                </span>
              </div>
              <div className="w-full sm:w-48 h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-1.5 font-bangla">
                {isBn ? 'প্রয়োজনীয় মূল ও ফটোকপি নথিপত্রের তালিকা' : 'Required Physical Documents Checklist'}
              </h2>

              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                {data.items.map((item, idx) => {
                  const isChecked = Boolean(checkedMap[item.id]);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer select-none ${
                        isChecked ? 'bg-emerald-50/30' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-zinc-400 hover:text-black shrink-0 no-print"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-zinc-300" />
                        )}
                      </button>

                      {/* Print-only square box */}
                      <div className="hidden print:block w-4 h-4 border-2 border-black rounded-xs mt-0.5 shrink-0" />

                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-zinc-900 font-bangla text-xs sm:text-sm">
                            {idx + 1}. {isBn ? item.titleBn : item.titleEn}
                          </span>
                          {item.required ? (
                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 rounded">
                              {isBn ? 'বাধ্যতামূলক' : 'Required'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded text-zinc-500">
                              {isBn ? 'প্রযোজ্য ক্ষেত্রে' : 'Conditional'}
                            </Badge>
                          )}
                        </div>

                        <p className="text-[11px] sm:text-xs text-zinc-600 font-bangla leading-relaxed">
                          {isBn ? item.descBn : item.descEn}
                        </p>

                        {(item.notesBn || item.notesEn) && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bangla inline-block">
                            ℹ️ {isBn ? item.notesBn : item.notesEn}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Crucial Instructions */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 font-bangla">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{isBn ? 'আইভ্যাক সেন্টারে উপস্থিতির পূর্বশর্ত ও সতর্কতা' : 'Submission Security & Preparation Tips'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px] leading-relaxed">
                <li>
                  {isBn
                    ? 'আইভ্যাক সেন্টারে কোনো প্রকার মোবাইল ফোন, ইলেকট্রনিক ডিভাইস, ল্যাপটপ বা ব্যাগ নিয়ে প্রবেশ সম্পূর্ণ নিষেধ।'
                    : 'Electronic devices, laptops, mobile phones, and bags are strictly forbidden inside the IVAC center.'}
                </li>
                <li>
                  {isBn
                    ? 'ইউটিলিটি বিলের ঠিকানার সাথে আবেদন ফর্মের বর্তমান ঠিকানার মিল আবশ্যক।'
                    : 'Utility bill address must match present address given in the visa application.'}
                </li>
                <li>
                  {isBn
                    ? 'ছবি ২x২ ইঞ্চি সাদা ব্যাকগ্রাউন্ড হতে হবে, কান সুস্পষ্ট থাকতে হবে এবং চশমা পরা যাবে না।'
                    : '2x2 photo must have visible ears and white background without glasses.'}
                </li>
              </ul>
            </div>

            {/* Slip Footer */}
            <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-400 font-mono">
              <div>Generated via PothikVisa Automation Platform • Date: {data.generatedDate}</div>
              <div className="font-bold text-zinc-500 uppercase">Verification ID: {data.applicationId}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
