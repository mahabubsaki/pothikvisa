'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  Shield,
  Zap,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { SavedProfileRecord } from '@/lib/db';

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: SavedProfileRecord[];
  userPlan?: string;
  isAdmin?: boolean;
  onBatchComplete?: () => void;
}

export function BatchProcessingModal({
  isOpen,
  onClose,
  profiles,
  userPlan,
  isAdmin = false,
  onBatchComplete,
}: BatchProcessingModalProps) {
  const { isBn } = useLanguage();
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<{
    count: number;
    applications: Array<{
      id: string;
      applicantName: string;
      passportNumber: string;
      queuePosition: number;
      estimatedWaitMinutes: number;
    }>;
  } | null>(null);

  if (!isOpen) return null;

  const isAgencyOrAdmin = isAdmin || userPlan === 'paid';

  // Filter profiles based on search
  const filteredProfiles = profiles.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.profile_name.toLowerCase().includes(q) ||
      p.passport_number.toLowerCase().includes(q)
    );
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProfiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProfiles.map((p) => p.id));
    }
  };

  const handleLaunchBatch = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg(isBn ? 'কমপক্ষে একটি প্রোফাইল নির্বাচন করুন।' : 'Please select at least 1 profile.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/applications/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileIds: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Batch submission failed');
      }

      setBatchResults({
        count: data.count,
        applications: data.applications || [],
      });
      if (onBatchComplete) onBatchComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting batch';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden text-zinc-900 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                Paid Feature
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-bold">
                Priority Rank 1
              </Badge>
            </div>
            <h3 className="text-base sm:text-lg font-bold font-bangla text-white">
              {isBn ? 'মাল্টি-অ্যাপ্লিক্যান্ট ব্যাচ প্রসেসিং' : 'Multi-Applicant Batch Processing'}
            </h3>
            <p className="text-xs text-zinc-300 font-bangla">
              {isBn
                ? 'এক ক্লিকে একাধিক ক্লায়েন্ট প্রোফাইল নির্বাচন করে সরাসরি প্রায়োরিটি কিউতে যোগ করুন।'
                : 'Select multiple client profiles and queue them simultaneously with top priority rank.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-700/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!isAgencyOrAdmin ? (
          /* Paid upgrade gate */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Zap className="w-7 h-7" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h4 className="text-lg font-bold text-zinc-900 font-bangla">
                {isBn ? 'ব্যাচ প্রসেসিং আনলক করতে পেইড প্ল্যানে আপগ্রেড করুন' : 'Upgrade to Paid to unlock batch processing'}
              </h4>
              <p className="text-xs text-zinc-600 font-bangla leading-relaxed">
                {isBn
                  ? 'পেইড ব্যবহারকারীরা এক ক্লিকে একাধিক প্রোফাইল প্রায়োরিটি কিউতে দিতে পারবেন।'
                  : 'Paid users can launch multiple client profiles together in the priority queue.'}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 max-w-md mx-auto text-left space-y-2.5 text-xs font-bangla">
              <div className="flex items-center gap-2 text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isBn ? 'এক ক্লিকে একাধিক প্রোফাইল অটো-সাবমিশন' : 'One-click multi-profile queueing'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isBn ? 'Rank 1 প্রায়োরিটি কিউ (সবার আগে প্রসেস হবে)' : 'Priority Rank 1 (Jumps queue ahead of others)'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isBn ? 'আনলিমিটেড ফর্ম কোটা ও কাস্টমার সাপোর্ট' : 'Unlimited web file quota & dedicated support'}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-6 h-11 w-full sm:w-auto">
                <Link href="/checkout?plan=paid">
                  <span>{isBn ? 'পেইড প্ল্যানে আপগ্রেড করুন (৫০০ ৳)' : 'Upgrade to Paid (500 ৳)'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
              <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs font-semibold text-zinc-600">
                {isBn ? 'পরে করব' : 'Maybe Later'}
              </Button>
            </div>
          </div>
        ) : batchResults ? (
          /* Batch Results Screen */
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold font-bangla">
                  {isBn
                    ? `সাফল্যের সাথে ${batchResults.count}টি আবেদন পেইড প্রায়োরিটি কিউতে যোগ করা হয়েছে!`
                    : `Successfully enqueued ${batchResults.count} applications in the paid priority queue!`}
                </h4>
                <p className="text-xs text-emerald-800 font-bangla">
                  {isBn
                    ? 'আবেদনগুলো ক্রমানুসারে স্বয়ংক্রিয়ভাবে সম্পন্ন হচ্ছে। ড্যাশবোর্ডে আপনি লাইভ অবস্থান দেখতে পাবেন।'
                    : 'Applications are processing sequentially. Track live progress on your dashboard.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-zinc-700 uppercase tracking-wider font-bangla">
                {isBn ? 'কিউতে যুক্ত আবেদনসমূহ:' : 'Queued Applications:'}
              </h5>
              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                {batchResults.applications.map((app, idx) => (
                  <div key={app.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 truncate uppercase">{app.applicantName}</div>
                        <div className="font-mono text-[11px] text-zinc-500">{app.passportNumber}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">
                        Rank 1
                      </Badge>
                      <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">
                        {isBn ? `কিউ #${app.queuePosition}` : `Queue #${app.queuePosition}`}
                      </Badge>
                      <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                        ~{app.estimatedWaitMinutes}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-zinc-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBatchResults(null);
                  setSelectedIds([]);
                }}
                className="rounded-xl text-xs font-semibold w-full sm:w-auto"
              >
                {isBn ? 'আরও আবেদন প্রসেস করুন' : 'Queue More Profiles'}
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold w-full sm:w-auto"
              >
                <Link href="/dashboard">
                  <span>{isBn ? 'ড্যাশবোর্ডে লাইভ কিউ দেখুন' : 'Go to Dashboard'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          /* Profile Selection Screen */
          <div className="p-4 sm:p-5 space-y-3.5 overflow-hidden flex flex-col flex-1">
            {/* Filter and Selection Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isBn ? 'নাম বা পাসপোর্ট দিয়ে ক্লায়েন্ট খুঁজুন...' : 'Search by client name or passport...'}
                  className="pl-9 h-9 text-xs rounded-xl border-zinc-200"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-9 text-xs font-semibold rounded-xl border-zinc-200 hover:bg-zinc-50 gap-1.5"
                >
                  {selectedIds.length === filteredProfiles.length && filteredProfiles.length > 0 ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'সব আনচেক' : 'Deselect All'}</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{isBn ? 'সব সিলেক্ট' : 'Select All'}</span>
                    </>
                  )}
                </Button>

                <Badge className="bg-zinc-100 text-zinc-800 border-zinc-200 text-xs font-mono h-9 px-3 flex items-center">
                  {selectedIds.length} / {filteredProfiles.length}
                </Badge>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2 font-bangla shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Profile List */}
            <div className="flex-1 overflow-y-auto border border-zinc-200 rounded-2xl divide-y divide-zinc-100 bg-white">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-zinc-500 font-bangla">
                  {isBn
                    ? 'কোনো সংরক্ষিত প্রোফাইল পাওয়া যায়নি। প্রথমে প্রোফাইল তৈরি বা সংরক্ষণ করুন।'
                    : 'No saved profiles found. Save profiles in the vault first.'}
                </div>
              ) : (
                filteredProfiles.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  let formData: any = {};
                  try {
                    formData = JSON.parse(p.data_json);
                  } catch {}

                  const purpose = formData.step1_registration?.visaPurpose || 'Tourist';

                  return (
                    <label
                      key={p.id}
                      onClick={() => handleToggleSelect(p.id)}
                      className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50/50 hover:bg-emerald-50/80' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-900 uppercase truncate">
                            {p.profile_name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                            <span>{p.passport_number}</span>
                            <span>•</span>
                            <span className="capitalize">{purpose === '544' ? 'Tourist' : purpose}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          {new Date(p.updated_at).toLocaleDateString()}
                        </span>
                        {isChecked && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] font-bold mt-0.5">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 shrink-0">
              <div className="text-[11px] text-zinc-500 font-bangla flex items-center gap-1.5 self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>
                  {isBn
                    ? 'পেইড প্রায়োরিটি অনুযায়ী ক্রমানুসারে সম্পন্ন হবে'
                    : 'Processed with paid priority.'}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Button>

                <Button
                  type="button"
                  disabled={selectedIds.length === 0 || isSubmitting}
                  onClick={handleLaunchBatch}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-5 h-10 shadow-xs gap-1.5 flex-1 sm:flex-initial"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isBn ? 'কিউতে পাঠানো হচ্ছে...' : 'Queuing...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>
                        {isBn
                          ? `ব্যাচ শুরু করুন (${selectedIds.length}টি প্রোফাইল)`
                          : `Batch Launch (${selectedIds.length} Profiles)`}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
