import Link from 'next/link';
import { CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface PaymentTransaction {
  id: string;
  plan: 'paid';
  amount: number;
  mfs_method: 'bkash' | 'nagad' | 'rocket';
  sender_phone: string;
  trx_id: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  created_at: string;
  reviewed_at?: string;
}

export function PaymentHistory({
  transactions,
  isBn,
}: {
  transactions: PaymentTransaction[];
  isBn: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#EAEAEA] p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-black" />
          <h2 className="text-base font-bold text-black">
            {isBn ? 'আমার এমএফএস পেমেন্ট হিস্ট্রি' : 'My MFS Payment History'}
          </h2>
        </div>
        <Button asChild size="sm" variant="ghost" className="text-xs text-[#666666] hover:text-black">
          <Link href="/checkout">{isBn ? '+ নতুন পেমেন্ট জমা দিন' : '+ Submit New Payment'}</Link>
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10 text-xs text-[#888888] bg-[#FAFAFA] rounded-xl border border-[#EAEAEA]">
          {isBn ? 'এখনো কোনো পেমেন্ট রেকর্ড নেই।' : 'No transaction records found.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#888888] font-semibold">
                <th className="pb-3 px-3">{isBn ? 'তারিখ' : 'Date'}</th>
                <th className="pb-3 px-3">{isBn ? 'প্ল্যান' : 'Plan'}</th>
                <th className="pb-3 px-3">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="pb-3 px-3">{isBn ? 'পেমেন্ট মেথড' : 'Method'}</th>
                <th className="pb-3 px-3">{isBn ? 'প্রেরক নম্বর' : 'Sender Phone'}</th>
                <th className="pb-3 px-3">TrxID</th>
                <th className="pb-3 px-3 text-right">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 px-3 text-[#555555]">
                    {new Date(transaction.created_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-3 font-bold uppercase text-black">{transaction.plan}</td>
                  <td className="py-3 px-3 font-semibold text-black">৳{transaction.amount}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
                      {transaction.mfs_method}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#555555]">{transaction.sender_phone}</td>
                  <td className="py-3 px-3 font-mono font-bold text-black">{transaction.trx_id}</td>
                  <td className="py-3 px-3 text-right">
                    {transaction.status === 'approved' && (
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" />{isBn ? 'অনুমোদিত' : 'Approved'}
                      </Badge>
                    )}
                    {transaction.status === 'pending' && (
                      <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px]">
                        <Clock className="w-3 h-3 mr-1" />{isBn ? 'পর্যালোচনাধীন' : 'In Review'}
                      </Badge>
                    )}
                    {transaction.status === 'rejected' && (
                      <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px]">
                        <XCircle className="w-3 h-3 mr-1" />{isBn ? 'বাতিল' : 'Rejected'}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
