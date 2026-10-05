'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  User,
  Phone,
  AlertTriangle,
  Loader2,
  DollarSign,
  TrendingUp,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { SignInButton } from '@clerk/nextjs';

interface AdminTransaction {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  plan: 'paid';
  amount: number;
  mfs_method: 'bkash' | 'nagad' | 'rocket';
  sender_phone: string;
  trx_id: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface AdminUserSession {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

export default function AdminTransactionsPage() {
  const { isBn } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalTrx, setRejectModalTrx] = useState<AdminTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState('Transaction not found in MFS statement');

  const checkAdminAndLoad = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const authData = await authRes.json();

      if (authData.authenticated && authData.user?.role === 'admin') {
        setIsAdmin(true);
        setAdminUser(authData.user);
        await loadTransactions();
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const handleApprove = async (trx: AdminTransaction) => {
    setProcessingId(trx.id);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/transactions/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          trxId: trx.trx_id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          text: `Transaction ${trx.trx_id} approved! 30-day quota activated for ${trx.user_name || trx.user_email}.`,
          type: 'success',
        });
        // Optimistic update
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === trx.id
              ? { ...t, status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: adminUser?.email }
              : t
          )
        );
      } else {
        setStatusMessage({ text: data.error || 'Failed to approve', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Failed to communicate with server', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTrx) return;
    setProcessingId(rejectModalTrx.id);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/transactions/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          trxId: rejectModalTrx.trx_id,
          reason: rejectReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          text: `Transaction ${rejectModalTrx.trx_id} marked as rejected.`,
          type: 'success',
        });
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === rejectModalTrx.id
              ? { ...t, status: 'rejected', note: rejectReason, reviewed_at: new Date().toISOString() }
              : t
          )
        );
        setRejectModalTrx(null);
      } else {
        setStatusMessage({ text: data.error || 'Failed to reject', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Failed to communicate with server', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyTrx = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrx(text);
    setTimeout(() => setCopiedTrx(null), 2000);
  };

  // Stats calculation
  const totalCount = transactions.length;
  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const approvedCount = transactions.filter((t) => t.status === 'approved').length;
  const totalRevenue = transactions
    .filter((t) => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter & Search
  const filteredTransactions = transactions.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.trx_id.toLowerCase().includes(query) ||
      t.sender_phone.includes(query) ||
      (t.user_name && t.user_name.toLowerCase().includes(query)) ||
      (t.user_email && t.user_email.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
          <p className="text-xs font-semibold text-[#666666]">
            {isBn ? 'অ্যাডমিন প্যানেল লোড হচ্ছে...' : 'Loading Admin Portal...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-8 max-w-md w-full shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-black">
              {isBn ? 'অ্যাডমিন অ্যাক্সেস আবশ্যক' : 'Admin Privileges Required'}
            </h2>
            <p className="text-xs text-[#666666]">
              {isBn
                ? 'এই পেজটি শুধুমাত্র PothikVisa অ্যাডমিনিস্ট্রেটরদের জন্য সংরক্ষিত।'
                : 'This panel is restricted to authorized operations administrators.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <SignInButton mode="modal">
              <Button
                type="button"
                className="w-full text-xs font-bold rounded-xl"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                <span>{isBn ? 'অ্যাডমিন অ্যাকাউন্ট দিয়ে সাইন ইন করুন' : 'Sign In as Administrator'}</span>
              </Button>
            </SignInButton>
            <Button asChild variant="outline" className="w-full text-xs rounded-xl">
              <Link href="/">
                <span>{isBn ? 'হোমপেজে ফিরে যান' : 'Return Home'}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header navigation bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="text-xs text-[#666666] hover:text-black flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
              </Link>
              <span className="text-[#CCCCCC]">/</span>
              <span className="text-xs font-semibold text-black">Admin Panel</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-black">
                {isBn ? 'এমএফএস পেমেন্ট অনুমোদন প্যানেল' : 'MFS Payment Verification'}
              </h1>
              <Badge className="bg-black text-white text-[10px] font-mono">
                ADMIN CONSOLE
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTransactions}
              className="text-xs font-semibold gap-1.5 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isBn ? 'রিফ্রেশ' : 'Refresh List'}</span>
            </Button>
            <Button asChild size="sm" className="rounded-xl text-xs font-bold">
              <Link href="/checkout">
                <span>{isBn ? '+ টেস্ট পেমেন্ট জমা' : '+ Submit Test Trx'}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#EAEAEA] shadow-2xs space-y-1">
            <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
              {isBn ? 'মোট ট্রানজেকশন' : 'Total Transactions'}
            </div>
            <div className="text-2xl font-black text-black">{totalCount}</div>
            <div className="text-[10px] text-[#666666]">
              {isBn ? 'সিস্টেমে জমাকৃত সব ট্রানজেকশন' : 'All lifetime submitted records'}
            </div>
          </div>

          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>{isBn ? 'অপেক্ষমাণ অনুমোদন' : 'Pending Review'}</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-900">{pendingCount}</div>
            <div className="text-[10px] text-amber-700">
              {isBn ? 'যাচাই ও সক্রিয়করণের অপেক্ষায়' : 'Awaiting verification'}
            </div>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>{isBn ? 'অনুমোদিত ও সক্রিয়' : 'Approved & Active'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900">{approvedCount}</div>
            <div className="text-[10px] text-emerald-700">
              {isBn ? 'সফলভাবে কোটা সক্রিয় হয়েছে' : 'Quotas granted'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EAEAEA] shadow-2xs space-y-1">
            <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider flex items-center justify-between">
              <span>{isBn ? 'মোট সংগৃহীত রেভিনিউ' : 'Verified Revenue'}</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-black">৳{totalRevenue}</div>
            <div className="text-[10px] text-[#666666]">
              {isBn ? 'অনুমোদিত পেমেন্ট থেকে সংগৃহীত' : 'From approved submissions'}
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  filterStatus === st
                    ? 'bg-black text-white shadow-2xs'
                    : 'bg-[#FAFAFA] text-[#666666] hover:bg-[#F0F0F0]'
                }`}
              >
                {st === 'all' && (isBn ? 'সকল (All)' : 'All')}
                {st === 'pending' && (isBn ? `অপেক্ষমাণ (${pendingCount})` : `Pending (${pendingCount})`)}
                {st === 'approved' && (isBn ? `অনুমোদিত (${approvedCount})` : `Approved (${approvedCount})`)}
                {st === 'rejected' && (isBn ? 'বাতিল' : 'Rejected')}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'TrxID, ফোন বা ইমেইল খুঁজুন...' : 'Search TrxID, phone, or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-2xs overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16 text-xs text-[#888888]">
              {isBn ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No matching transactions found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-[#777777] font-bold">
                    <th className="py-3 px-4">{isBn ? 'আবেদনকারী' : 'User'}</th>
                    <th className="py-3 px-4">{isBn ? 'প্ল্যান ও মূল্য' : 'Plan & Amount'}</th>
                    <th className="py-3 px-4">{isBn ? 'পেমেন্ট মেথড' : 'Method'}</th>
                    <th className="py-3 px-4">{isBn ? 'প্রেরক ফোন' : 'Sender Phone'}</th>
                    <th className="py-3 px-4">TrxID</th>
                    <th className="py-3 px-4">{isBn ? 'তারিখ' : 'Date'}</th>
                    <th className="py-3 px-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-[#FAFAFA]/70 transition-colors">
                      
                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-black">{trx.user_name || 'Anonymous User'}</div>
                        <div className="text-[11px] text-[#666666] font-mono">{trx.user_email || trx.user_id}</div>
                      </td>

                      {/* Plan & Amount */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold uppercase text-black">{trx.plan}</div>
                        <div className="text-[11px] text-emerald-700 font-bold">৳{trx.amount}</div>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {trx.mfs_method}
                        </span>
                      </td>

                      {/* Sender Phone */}
                      <td className="py-3 px-4 font-mono font-medium text-[#444444]">
                        {trx.sender_phone}
                      </td>

                      {/* TrxID with copy button */}
                      <td className="py-3 px-4 font-mono">
                        <div className="inline-flex items-center gap-1.5 bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#EAEAEA]">
                          <span className="font-bold text-black">{trx.trx_id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyTrx(trx.trx_id)}
                            className="text-[#888888] hover:text-black"
                            title="Copy TrxID"
                          >
                            {copiedTrx === trx.trx_id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-[#666666]">
                        {new Date(trx.created_at).toLocaleString(isBn ? 'bn-BD' : 'en-US', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {trx.status === 'approved' && (
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {trx.status === 'pending' && (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px]">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {trx.status === 'rejected' && (
                          <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px]">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        {trx.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              disabled={processingId === trx.id}
                              onClick={() => handleApprove(trx)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-7 px-2.5 rounded-lg"
                            >
                              {processingId === trx.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={processingId === trx.id}
                              onClick={() => setRejectModalTrx(trx)}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold text-[11px] h-7 px-2 rounded-lg"
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#888888] italic">
                            {trx.status === 'approved' ? `By ${trx.reviewed_by?.split('@')[0] || 'admin'}` : 'Declined'}
                          </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Reject Modal Dialog */}
      <AnimatePresence>
        {rejectModalTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-[#EAEAEA] p-6 max-w-md w-full shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <XCircle className="w-5 h-5" />
                <span>{isBn ? 'ট্রানজেকশন বাতিল করুন' : 'Reject Transaction'}</span>
              </div>

              <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#EAEAEA] text-xs space-y-1">
                <div><span className="text-[#888888]">User:</span> <span className="font-bold text-black">{rejectModalTrx.user_name} ({rejectModalTrx.user_email})</span></div>
                <div><span className="text-[#888888]">TrxID:</span> <span className="font-mono font-bold text-black">{rejectModalTrx.trx_id}</span></div>
                <div><span className="text-[#888888]">Amount:</span> <span className="font-bold text-black">৳{rejectModalTrx.amount}</span> ({rejectModalTrx.mfs_method})</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  {isBn ? 'বাতিলের কারণ' : 'Rejection Reason'}
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectModalTrx(null)}
                  className="rounded-xl text-xs"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={processingId === rejectModalTrx.id}
                  onClick={handleConfirmReject}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  {processingId === rejectModalTrx.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>{isBn ? 'নিশ্চিত করুন' : 'Confirm Rejection'}</span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
