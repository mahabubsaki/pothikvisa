import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, Clock, Download, Edit3, FileText, Globe,
  Play, PlusCircle, QrCode, RefreshCw, Sparkles, Terminal, Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ApplicationItem {
  id: string;
  applicant_name: string;
  passport_number: string;
  visa_type: string;
  temp_id?: string | null;
  web_file_number?: string | null;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  priority_rank?: number;
  queue_position?: number;
  estimated_wait?: string;
  current_step: number;
  failed_step?: number | null;
  failure_reason?: string | null;
  pdf_path?: string | null;
  photo_url?: string | null;
  passport_pdf_url?: string | null;
  final_pdf_url?: string | null;
  status_message?: string | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationHistoryProps {
  applications: ApplicationItem[];
  isBn: boolean;
  actionInProgress: string | null;
  onTrack: (applicationId: string) => void;
  onRun: (applicationId: string) => void;
  onEditResume: (applicationId: string) => void;
  onResume: (applicationId: string) => void;
  onQrCode: (application: ApplicationItem) => void;
  onDelete: (applicationId: string) => void;
}

export function ApplicationHistory(props: ApplicationHistoryProps) {
  const { applications, isBn, actionInProgress } = props;
  return (
    <div className="bg-white rounded-2xl border border-[#EAEAEA] p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-black" />
          <h2 className="text-base font-bold text-black font-bangla">
            {isBn ? 'সাম্প্রতিক ভিসা আবেদনসমূহ' : 'Recent Visa Applications'}
          </h2>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
          <Link href="/apply"><PlusCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />{isBn ? '+ নতুন আবেদন' : '+ New Application'}</Link>
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-10 px-4 text-xs text-[#888888] bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] font-bangla">
          {isBn
            ? 'এখনো কোনো ভিসা আবেদন যোগ করা হয়নি। উপরের "ফর্ম পূরণ শুরু করুন" বাটনে ক্লিক করে আপনার প্রথম আবেদন শুরু করুন।'
            : 'No visa applications created yet. Click "+ New Application" to launch the automated filing engine.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#888888] font-semibold font-bangla">
                <th className="pb-3 px-3">{isBn ? 'আবেদনকারী ও পাসপোর্ট' : 'Applicant & Passport'}</th>
                <th className="pb-3 px-3">{isBn ? 'ভিসার ধরন' : 'Visa Type'}</th>
                <th className="pb-3 px-3">{isBn ? 'ধাপ' : 'Step'}</th>
                <th className="pb-3 px-3">{isBn ? 'অ্যাপ্লিকেশন আইডি / ফাইল নম্বর' : 'App ID / File No'}</th>
                <th className="pb-3 px-3">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="pb-3 px-3 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {applications.map((application) => (
                <ApplicationRow key={application.id} application={application} {...props} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ApplicationRow({
  application: app,
  isBn,
  actionInProgress,
  onTrack,
  onRun,
  onEditResume,
  onResume,
  onQrCode,
  onDelete,
}: ApplicationHistoryProps & { application: ApplicationItem }) {
  return (
    <tr className="hover:bg-[#FAFAFA] transition-colors">
      <td className="py-3 px-3">
        <div className="font-bold text-black uppercase">{app.applicant_name}</div>
        <div className="font-mono text-[11px] text-[#666666] tracking-wider">{app.passport_number}</div>
      </td>
      <td className="py-3 px-3 font-semibold text-[#555555]">
        {app.visa_type === '544' && (isBn ? 'ট্যুরিস্ট' : 'Tourist (544)')}
        {app.visa_type === '543' && (isBn ? 'মেডিকেল' : 'Medical (543)')}
        {app.visa_type === '542' && (isBn ? 'বিজনেস' : 'Business (542)')}
        {!['544', '543', '542'].includes(app.visa_type) && app.visa_type}
      </td>
      <td className="py-3 px-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono">
          {isBn ? `ধাপ ${app.current_step}/৯` : `Step ${app.current_step}/9`}
        </span>
      </td>
      <td className="py-3 px-3 font-mono text-[11px]">
        {app.web_file_number ? (
          <div className="space-y-1">
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block w-fit">{app.web_file_number}</span>
            {app.status_message && (
              <div className="text-[10px] text-zinc-600 bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 inline-flex items-center gap-1 font-medium font-bangla max-w-[200px]" title={app.status_message}>
                <Globe className="w-2.5 h-2.5 text-blue-600 shrink-0" /><span className="truncate">{app.status_message}</span>
              </div>
            )}
          </div>
        ) : app.temp_id ? (
          <span className="font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">{app.temp_id}</span>
        ) : <span className="text-[#999999]">-</span>}
      </td>
      <td className="py-3 px-3"><ApplicationStatus application={app} isBn={isBn} /></td>
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {(app.status === 'queued' || app.status === 'processing') && (
            <Button size="sm" variant="outline" onClick={() => onTrack(app.id)} className={`h-7 px-2.5 text-[11px] font-bold rounded-lg shadow-2xs ${app.status === 'queued' ? 'border-sky-300 text-sky-700 bg-sky-50/60 hover:bg-sky-100' : 'border-emerald-300 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100'}`}>
              {app.status === 'queued' ? <Clock className="w-3 h-3 mr-1" /> : <Terminal className="w-3 h-3 mr-1" />}
              {app.status === 'queued' ? (isBn ? 'কিউ ট্র্যাকার' : 'Queue Tracker') : (isBn ? 'লাইভ ফিড' : 'Live Feed')}
            </Button>
          )}
          {(app.status === 'draft' || app.status === 'failed') && !app.temp_id && (
            <Button size="sm" variant="outline" disabled={actionInProgress === app.id} onClick={() => onRun(app.id)} className="h-7 px-2.5 text-[11px] font-bold rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Play className="w-3 h-3 mr-1 fill-emerald-600" />{isBn ? 'রান করুন' : 'Run'}
            </Button>
          )}
          {app.temp_id && app.status !== 'processing' && app.status !== 'completed' && (
            <>
              <Button size="sm" variant="outline" onClick={() => onEditResume(app.id)} className="h-7 px-2.5 text-[11px] font-bold rounded-lg border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 shadow-2xs">
                <Edit3 className="w-3 h-3 mr-1" />{isBn ? 'এডিট ও রিজিউম' : 'Edit & Resume'}
              </Button>
              <Button size="sm" variant="outline" disabled={actionInProgress === app.id} onClick={() => onResume(app.id)} className="h-7 px-2.5 text-[11px] font-bold rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50">
                <RefreshCw className="w-3 h-3 mr-1" />{isBn ? 'রিজিউম' : 'Resume'}
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => onQrCode(app)} className="h-7 px-2.5 text-[11px] font-bold rounded-lg border-zinc-300 text-zinc-800 bg-white hover:bg-zinc-50 shadow-2xs">
            <QrCode className="w-3 h-3 mr-1" />{isBn ? 'কিউআর' : 'QR Code'}
          </Button>
          {(app.status === 'completed' || app.final_pdf_url || app.pdf_path || app.web_file_number) && (
            <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-[11px] font-bold rounded-lg border-emerald-300 text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 shadow-2xs">
              <a href={`/api/applications/${app.id}/pdf`} target="_blank" rel="noopener noreferrer"><Download className="w-3 h-3 mr-1" />{isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</a>
            </Button>
          )}
          {app.status !== 'processing' && (
            <Button size="sm" variant="ghost" disabled={actionInProgress === app.id} onClick={() => onDelete(app.id)} className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 rounded-lg" title={isBn ? 'মুছে ফেলুন' : 'Delete'}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ApplicationStatus({ application: app, isBn }: { application: ApplicationItem; isBn: boolean }) {
  if (app.status === 'completed') return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />{isBn ? 'সম্পন্ন' : 'Completed'}</Badge>;
  if (app.status === 'processing') return <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] animate-pulse"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />{isBn ? 'চলমান...' : 'Processing...'}</Badge>;
  if (app.status === 'queued') return (
    <div className="space-y-1">
      <Badge className="bg-sky-100 text-sky-800 border border-sky-300 font-bold text-[10px] animate-pulse flex items-center w-fit"><Clock className="w-3 h-3 mr-1" />{isBn ? `কিউতে #${app.queue_position ?? 1}` : `Queued #${app.queue_position ?? 1}`}</Badge>
      {app.estimated_wait && <div className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 rounded px-1.5 py-0.5 inline-flex items-center gap-1 font-medium font-bangla"><Sparkles className="w-2.5 h-2.5" />{app.estimated_wait}</div>}
    </div>
  );
  if (app.status === 'failed') return <Badge className="bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] cursor-help" title={app.failure_reason || ''}><AlertCircle className="w-3 h-3 mr-1" />{app.failed_step ? (isBn ? `ব্যর্থ (ধাপ ${app.failed_step})` : `Failed (Step ${app.failed_step})`) : (isBn ? 'ব্যর্থ' : 'Failed')}</Badge>;
  return <Badge variant="outline" className="text-zinc-600 border-zinc-300 font-bold text-[10px]"><Clock className="w-3 h-3 mr-1" />{isBn ? 'ড্রাফট' : 'Draft'}</Badge>;
}
