'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  X,
  RotateCcw,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisaApplicantProfile } from '@/types/profile';
import { useLanguage } from '@/context/LanguageContext';

interface OfficialPdfDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  getProfileData: () => VisaApplicantProfile;
  photoBase64?: string | null;
  applicationId?: string;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

function loadPdfJs(): Promise<any> {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('pdfjs-cdn-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.pdfjsLib));
      existing.addEventListener('error', () => reject(new Error('Failed to load PDF viewer')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('pdfjsLib not defined after script load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF viewer engine from CDN'));
    document.head.appendChild(script);
  });
}

export function OfficialPdfDraftModal({
  isOpen,
  onClose,
  getProfileData,
  photoBase64,
  applicationId,
}: OfficialPdfDraftModalProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [fitScale, setFitScale] = useState<number>(0.5);
  const [activeTab, setActiveTab] = useState<'both' | 'p1' | 'p2'>('both');

  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-calculate optimal fit scale on mobile vs desktop
  const calculateOptimalScale = useCallback(() => {
    if (typeof window === 'undefined') return 1.0;
    const isMobile = window.innerWidth < 640;
    const padding = isMobile ? 24 : 64;
    const availableWidth = Math.max(300, window.innerWidth - padding);
    const fit = Number((availableWidth / 750).toFixed(2));
    setFitScale(fit);

    // If mobile, start with full fit so nothing is cut off
    if (isMobile) {
      return Math.min(1.0, Math.max(0.4, fit));
    }
    return 1.0;
  }, []);

  const renderPdfToCanvas = useCallback(async (rawBytes: Uint8Array) => {
    try {
      const pdfjs = await loadPdfJs();
      const pdf = await pdfjs.getDocument({ data: rawBytes }).promise;

      // Render Page 1 (at 2.5x base resolution for crisp text)
      if (pdf.numPages >= 1 && canvas1Ref.current) {
        const page1 = await pdf.getPage(1);
        const viewport1 = page1.getViewport({ scale: 2.5 });
        const canvas1 = canvas1Ref.current;
        canvas1.width = viewport1.width;
        canvas1.height = viewport1.height;
        const ctx1 = canvas1.getContext('2d');
        if (ctx1) {
          await page1.render({ canvasContext: ctx1, viewport: viewport1 }).promise;
        }
      }

      // Render Page 2
      if (pdf.numPages >= 2 && canvas2Ref.current) {
        const page2 = await pdf.getPage(2);
        const viewport2 = page2.getViewport({ scale: 2.5 });
        const canvas2 = canvas2Ref.current;
        canvas2.width = viewport2.width;
        canvas2.height = viewport2.height;
        const ctx2 = canvas2.getContext('2d');
        if (ctx2) {
          await page2.render({ canvasContext: ctx2, viewport: viewport2 }).promise;
        }
      }
    } catch (err: unknown) {
      console.error('Canvas render error:', err);
      setError(err instanceof Error ? err.message : 'Error rendering PDF pages');
    }
  }, []);

  const generateDraft = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const profile = getProfileData();

      const res = await fetch('/api/profiles/draft-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          photoBase64: photoBase64 || undefined,
          applicationId: applicationId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.pdfBase64) {
        throw new Error(json.message || json.error || `HTTP ${res.status}: Failed to generate draft`);
      }

      const binaryString = atob(json.pdfBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      await renderPdfToCanvas(bytes);
    } catch (err: unknown) {
      console.error('Error generating PDF draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF draft');
    } finally {
      setLoading(false);
    }
  }, [getProfileData, photoBase64, applicationId, renderPdfToCanvas]);

  useEffect(() => {
    if (isOpen) {
      const initialScale = calculateOptimalScale();
      setScale(initialScale);
      generateDraft();
    } else {
      setError(null);
    }
  }, [isOpen, generateDraft, calculateOptimalScale]);

  if (!isOpen) return null;

  const targetWidth = Math.round(750 * scale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full sm:max-w-6xl h-full sm:h-[96vh] flex flex-col bg-slate-900 border-0 sm:border sm:border-slate-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-modal-title"
      >
        {/* RESPONSIVE HEADER */}
        {/* DESKTOP HEADER (sm and up) */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0 gap-3">
          {/* Left Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h2 id="pdf-modal-title" className="text-sm font-bold text-white whitespace-nowrap">
              {isBn ? 'ড্রাফট প্রিভিউ' : 'Official Draft'}
            </h2>
          </div>

          {/* Middle: Page Switcher Tabs */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg p-0.5 text-xs text-slate-300">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'both' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              {isBn ? 'উভয় পৃষ্ঠা' : 'All'}
            </button>
            <button
              onClick={() => setActiveTab('p1')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'p1' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              {isBn ? 'পৃষ্ঠা ১' : 'Page 1'}
            </button>
            <button
              onClick={() => setActiveTab('p2')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'p2' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              {isBn ? 'পৃষ্ঠা ২' : 'Page 2'}
            </button>
          </div>

          {/* Right: Zoom Controls & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs text-slate-300">
              <button
                onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.15).toFixed(2))))}
                disabled={scale <= 0.4}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setScale(1.0)}
                className="px-2 py-0.5 font-mono text-xs hover:text-white hover:bg-slate-700 rounded transition-colors"
                title="Reset Zoom to 100%"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))))}
                disabled={scale >= 2.5}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setScale(fitScale)}
                className="px-1.5 py-0.5 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 rounded transition-colors ml-0.5"
                title="Fit to Screen"
              >
                Fit
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={generateDraft}
              disabled={loading}
              title={isBn ? 'রিফ্রেশ করুন' : 'Refresh'}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white h-7.5 px-2 text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE HEADER (sm:hidden - 2 Rows) */}
        <div className="flex sm:hidden flex-col bg-slate-900 border-b border-slate-800 shrink-0">
          {/* Row 1: Title, Refresh, Close Button */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white">
                {isBn ? 'ড্রাফট প্রিভিউ' : 'Draft Preview'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={generateDraft}
                disabled={loading}
                className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-md text-xs border border-slate-700"
                title="Refresh"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-md border border-slate-700"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Page Tabs & Mobile Zoom */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 gap-2">
            {/* Page Tabs */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-[11px] text-slate-300">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeTab === 'both' ? 'bg-emerald-600 text-white' : 'hover:text-white'
                }`}
              >
                {isBn ? 'উভয়' : 'All'}
              </button>
              <button
                onClick={() => setActiveTab('p1')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeTab === 'p1' ? 'bg-emerald-600 text-white' : 'hover:text-white'
                }`}
              >
                {isBn ? 'পৃ ১' : 'P1'}
              </button>
              <button
                onClick={() => setActiveTab('p2')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeTab === 'p2' ? 'bg-emerald-600 text-white' : 'hover:text-white'
                }`}
              >
                {isBn ? 'পৃ ২' : 'P2'}
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-[11px] text-slate-300">
              <button
                onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.15).toFixed(2))))}
                disabled={scale <= 0.4}
                className="p-1 hover:text-white rounded disabled:opacity-30"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <button
                onClick={() => setScale(fitScale)}
                className="px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                title="Fit Screen"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))))}
                disabled={scale >= 2.5}
                className="p-1 hover:text-white rounded disabled:opacity-30"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => setScale(fitScale)}
                className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-white rounded font-medium ml-0.5"
              >
                {isBn ? 'ফিট' : 'Fit'}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div
          ref={scrollContainerRef}
          className="flex-1 relative bg-slate-950 overflow-auto p-2 sm:p-6"
        >
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center animate-pulse">
                <FileText className="w-6 h-6 text-emerald-400 animate-bounce" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {isBn ? 'ড্রাফট প্রস্তুত হচ্ছে...' : 'Rendering official PDF draft...'}
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-8 max-w-md mx-auto">
              <div className="w-10 h-10 rounded-lg bg-red-900/30 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {isBn ? 'ড্রাফট লোড হতে সমস্যা হয়েছে' : 'Failed to render draft'}
              </h3>
              <p className="text-xs text-slate-400 bg-red-950/40 p-2.5 rounded-lg border border-red-900/50">
                {error}
              </p>
              <Button size="sm" onClick={generateDraft} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                {isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
              </Button>
            </div>
          )}

          {/* Canvases Centered with Target Width */}
          <div
            className={`min-h-full flex flex-col items-center gap-4 sm:gap-6 mx-auto ${
              loading || error ? 'hidden' : 'flex'
            }`}
            style={{
              width: `${targetWidth}px`,
              minWidth: `${targetWidth}px`,
            }}
          >
            {/* Page 1 */}
            <div
              className={`w-full bg-white rounded sm:rounded-lg shadow-2xl border border-slate-700/60 overflow-hidden relative ${
                activeTab === 'p2' ? 'hidden' : 'block'
              }`}
            >
              <div className="bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-mono font-medium px-2.5 sm:px-3 py-1 border-b border-slate-200 flex items-center justify-between">
                <span>Page 1 of 2 (Personal Particulars & Family Details)</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">Government Replica</span>
              </div>
              <canvas
                ref={canvas1Ref}
                className="w-full h-auto block select-none bg-white"
              />
            </div>

            {/* Page 2 */}
            <div
              className={`w-full bg-white rounded sm:rounded-lg shadow-2xl border border-slate-700/60 overflow-hidden relative ${
                activeTab === 'p1' ? 'hidden' : 'block'
              }`}
            >
              <div className="bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-mono font-medium px-2.5 sm:px-3 py-1 border-b border-slate-200 flex items-center justify-between">
                <span>Page 2 of 2 (Visa Details, References & Declaration)</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">Government Replica</span>
              </div>
              <canvas
                ref={canvas2Ref}
                className="w-full h-auto block select-none bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
