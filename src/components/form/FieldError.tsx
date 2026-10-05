import { AlertCircle } from 'lucide-react';

export function FieldError({ error }: { error?: { message?: string } }) {
  if (!error?.message) return null;

  return (
    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 font-bangla animate-in fade-in duration-150">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <span>{error.message}</span>
    </p>
  );
}
