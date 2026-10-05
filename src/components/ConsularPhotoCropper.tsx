'use client';

import React, { useState, useRef, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Camera,
  Check,
  RefreshCw,
  Upload,
  AlertCircle,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crop,
  X,
  Sparkles,
  Trash2,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { getCroppedImg, CroppedImageResult } from '@/lib/crop-image';
import { cn } from '@/lib/utils';

interface ConsularPhotoCropperProps {
  onPhotoProcessed: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  initialPreviewUrl?: string;
  hasError?: boolean;
  errorMessage?: string;
  isStandardSubscriber?: boolean;
  plan?: string;
}

export function ConsularPhotoCropper({
  onPhotoProcessed,
  onClear,
  initialPreviewUrl,
  hasError = false,
  errorMessage,
  isStandardSubscriber = false,
  plan = 'starter',
}: ConsularPhotoCropperProps) {
  const { isBn } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const [fileDetails, setFileDetails] = useState<{
    width: number;
    height: number;
    sizeKb: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialPreviewUrl) {
      setFinalPreviewUrl(initialPreviewUrl);
      setFileDetails({
        width: 600,
        height: 600,
        sizeKb: 18,
      });
    } else {
      setFinalPreviewUrl(null);
      setFileDetails(null);
    }
  }, [initialPreviewUrl]);

  // Process selected image file with plan-based size & format validation
  const processImageFile = (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isImage) {
      setErrorMsg(
        isBn
          ? 'অনুগ্রহ করে ছবি ফাইল (JPG বা JPEG) আপলোড করুন।'
          : 'Please select a valid image file (JPG or JPEG).'
      );
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    if (sizeKb < 10) {
      setErrorMsg(
        isBn
          ? `ছবির ফাইল সাইজ (${sizeKb} KB) খুব ছোট। ন্যূনতম ১০ KB আবশ্যক।`
          : `Photo file size (${sizeKb} KB) is too small. Minimum 10 KB required.`
      );
      return;
    }

    const maxLimitKb = isStandardSubscriber ? 20 * 1024 : 1024;
    if (sizeKb > maxLimitKb) {
      if (!isStandardSubscriber) {
        setErrorMsg(
          isBn
            ? `Starter প্ল্যানে ছবির সাইজ সর্বোচ্চ ১ MB (১০২৪ KB)। ২০ MB পর্যন্ত বড় ছবি আপলোড করতে Standard বা Agency Pro প্ল্যানে আপগ্রেড করুন। (${sizeKb} KB আপলোড করেছেন)`
            : `On Starter plan, photo size limit is 1 MB (1024 KB). Upgrade to Standard or Agency Pro to upload photos up to 20 MB. (Uploaded: ${sizeKb} KB)`
        );
      } else {
        setErrorMsg(
          isBn
            ? `ছবির ফাইল সাইজ (${(sizeKb / 1024).toFixed(1)} MB) খুব বেশি। সর্বোচ্চ ২০ MB পর্যন্ত ছবি গ্রহণযোগ্য।`
            : `Photo file size (${(sizeKb / 1024).toFixed(1)} MB) is too large. Maximum 20 MB allowed.`
        );
      }
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setIsModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  // When user selects a file
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Confirm crop
  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      const cropped: CroppedImageResult = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        600 // 600x600 px (standard 2x2 inch at 300 DPI)
      );

      setFinalPreviewUrl(cropped.url);
      setFileDetails({
        width: cropped.width,
        height: cropped.height,
        sizeKb: cropped.sizeKb,
      });

      setIsModalOpen(false);
      onPhotoProcessed(cropped.file, cropped.url);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error cropping image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFinalPreviewUrl(null);
    setFileDetails(null);
    setImageSrc(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <>
      {/* Main Form Tile */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
            <h3 className="text-xs font-bold text-zinc-900 font-bangla truncate">
              {isBn ? '২×২ ইঞ্চি কনস্যুলার ছবি (Consular Photo)' : 'Consular 2×2 Photo (1:1)'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold font-mono">
              {isStandardSubscriber ? '*JPG/JPEG (10 KB - 20 MB)' : '*JPG/JPEG (10 KB - 1 MB)'}
            </Badge>
            {hasError && !finalPreviewUrl && (
              <Badge className="bg-rose-600 text-white text-[10px] font-bold font-mono">
                REQUIRED
              </Badge>
            )}
            {finalPreviewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                title={isBn ? 'ছবি মুছে ফেলুন' : 'Remove Photo'}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'মুছুন' : 'Remove'}</span>
              </button>
            )}
          </div>
        </div>

        <input
          id="consular-photo-upload-input"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,.jpg,.jpeg,.png"
          className="sr-only"
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={onFileChange}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={handleTriggerFileInput}
          className={`border-2 border-dashed rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 cursor-pointer transition-all ${
            finalPreviewUrl
              ? 'border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/40'
              : hasError
              ? 'border-rose-400 bg-rose-50/20 hover:bg-rose-50/40'
              : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
          }`}
        >
          {/* Photo Box Preview */}
          <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg border overflow-hidden flex items-center justify-center shrink-0 shadow-inner ${
            hasError && !finalPreviewUrl ? 'bg-rose-50/50 border-rose-300' : 'bg-zinc-100 border-zinc-200'
          }`}>
            {finalPreviewUrl ? (
              <img
                src={finalPreviewUrl}
                alt="2x2 Consular"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`flex flex-col items-center p-2 text-center ${
                hasError ? 'text-rose-500' : 'text-zinc-400'
              }`}>
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold font-bangla">
                  {isBn ? 'ছবি নির্বাচন করুন' : 'Select Photo'}
                </span>
                <span className="text-[8px] font-mono">
                  {isStandardSubscriber ? '(JPG/JPEG 10 KB - 20 MB)' : '(JPG/JPEG 10 KB - 1 MB)'}
                </span>
              </div>
            )}

            {finalPreviewUrl && (
              <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-sm">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Details & Action */}
          <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <span className={`text-xs font-bold font-bangla truncate ${
                hasError && !finalPreviewUrl ? 'text-rose-700' : 'text-zinc-900'
              }`}>
                {finalPreviewUrl
                  ? isBn
                    ? 'ছবি পরিবর্তন করতে ক্লিক করুন'
                    : 'Click to re-crop / change photo'
                  : isBn
                  ? 'প্রফেশনাল ২×২ ক্রপ ও পজিশনিং (বাধ্যতামূলক)'
                  : 'Professional 2×2 Crop & Positioning (Mandatory)'}
              </span>
              <Crop className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            <p className="text-[11px] text-zinc-500 font-bangla leading-relaxed">
              {isStandardSubscriber
                ? (isBn
                    ? 'ছবি আপলোড করে জুম ও ড্র্যাগ করে নিখুঁতভাবে ২×২ বর্গাকার ফ্রেমে সেট করুন। (১০ KB - ২০ MB, JPG / JPEG)'
                    : 'Interactive touch & drag cropper guarantees compliant 2×2 inch format (10 KB - 20 MB, JPG / JPEG).')
                : (isBn
                    ? 'ছবি আপলোড করে জুম ও ড্র্যাগ করে নিখুঁতভাবে ২×২ বর্গাকার ফ্রেমে সেট করুন। (১০ KB - ১ MB, JPG / JPEG, ৩৫০×৩৫০ পিক্সেল)'
                    : 'Interactive touch & drag cropper guarantees compliant 2×2 inch format (10 KB - 1 MB, JPG / JPEG, 350×350 px).')}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <label
                htmlFor="consular-photo-upload-input"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-300 hover:border-zinc-500 rounded-lg shadow-2xs text-zinc-800 transition-all cursor-pointer font-bangla select-none"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {finalPreviewUrl
                    ? isBn
                      ? 'ছবি পরিবর্তন করুন'
                      : 'Change Photo'
                    : isBn
                    ? 'ছবি নির্বাচন করুন'
                    : 'Browse Photo'}
                </span>
              </label>

              {fileDetails && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] font-mono bg-white">
                    {fileDetails.width}×{fileDetails.height} px
                  </Badge>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] font-mono bg-white text-emerald-700 border-emerald-200">
                    {fileDetails.sizeKb} KB
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portal Photograph Status Bar (Mirrors Official Step 6 & Passport Card) */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-zinc-400 font-bold">#2</span>
            <span className="font-bold text-zinc-800 font-bangla truncate">
              {isBn ? 'কনস্যুলার সাইজ ছবি (বাধ্যতামূলক)' : 'Consular Photograph (2×2 Inch) (Mandatory)'}
            </span>
          </div>
          <Badge
            className={cn(
              'text-[10px] font-mono font-bold shrink-0',
              finalPreviewUrl
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-zinc-200 text-zinc-600 border-zinc-300'
            )}
          >
            {finalPreviewUrl ? (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                Uploaded
              </span>
            ) : (
              'Not Uploaded'
            )}
          </Badge>
        </div>

        {/* AI Photo Enhancer Callout */}
        {isStandardSubscriber ? (
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2 font-bangla">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isBn
                ? 'স্ট্যান্ডার্ড ও এজেন্সি প্রো সুবিধা: যেকোনো সাইজের ছবি (JPG / JPEG) আপলোড করুন (২০ MB পর্যন্ত), আমরা স্বয়ংক্রিয়ভাবে অপটিমাইজ করে নেব।'
                : 'Standard & Agency Pro Feature: Upload any size of photo (JPG / JPEG up to 20 MB) — we will enhance based on requirement.'}
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/60 p-3 sm:p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-950 font-bangla">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isBn ? 'এআই ফটো এনহ্যান্সার ও বিউটিফায়ার সচল' : 'AI Consular Photo Enhancer Active'}</span>
          </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[11px] font-medium">
              <div className="bg-white/95 border border-emerald-200/80 rounded-xl p-2 text-center shadow-2xs flex flex-col justify-center min-w-0">
                <span className="text-[10px] text-zinc-500 font-bangla block truncate leading-tight">
                  {isBn ? 'কনস্যুলার মাপ' : 'Ratio'}
                </span>
                <span className="font-bold text-zinc-900 font-mono text-[11px] block mt-0.5 truncate">
                  2×2″ (1:1)
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-xl p-2 text-center shadow-2xs flex flex-col justify-center min-w-0">
                <span className="text-[10px] text-zinc-500 font-bangla block truncate leading-tight">
                  {isBn ? 'ব্যাকগ্রাউন্ড' : 'Background'}
                </span>
                <span className="font-bold text-zinc-900 font-bangla text-[11px] block mt-0.5 truncate">
                  {isBn ? 'সাদা ব্যাকগ্রাউন্ড' : 'White'}
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-xl p-2 text-center shadow-2xs flex flex-col justify-center min-w-0">
                <span className="text-[10px] text-zinc-500 font-bangla block truncate leading-tight">
                  {isBn ? 'সরকারি স্ট্যান্ডার্ড' : 'Standard'}
                </span>
                <span className="font-bold text-zinc-900 font-mono text-[11px] block mt-0.5 truncate">
                  10–1000 KB
                </span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-950 font-bangla leading-relaxed pt-0.5">
              {isBn
                ? 'স্টুডিও বা ফটোশপের ঝামেলা ছাড়াই সাধারণ সেলফি আপলোড করুন। আমাদের এআই ইঞ্জিন স্বয়ংক্রিয়ভাবে ব্যাকগ্রাউন্ড ঠিক করে ১০০% দূতাবাস নিয়মসিদ্ধ ফরম্যাট তৈরি করবে।'
                : 'No studio or Photoshop needed! Upload any clear photo or selfie — our AI automatically crops to 2×2 inch, fixes background, and applies strict consular standards.'}
            </p>
          </div>
        )}

        {(errorMessage || errorMsg) && (
          <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 p-2.5 sm:p-3 rounded-xl flex items-start gap-2 font-bangla">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <span className="font-bold block text-xs">
                {isBn ? 'ছবি সংক্রান্ত ত্রুটি' : 'Photo Error'}
              </span>
              <span className="text-[11px] leading-relaxed block break-words">{errorMessage || errorMsg}</span>
            </div>
          </div>
        )}
      </div>

      {/* Professional Interactive Cropping Modal */}
      {isModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900 font-bangla">
                  {isBn ? '২×২ ইঞ্চি ছবি ক্রপার ও পজিশন' : 'Consular 2×2 Photo Cropper'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cropper Viewport */}
            <div className="relative w-full h-80 sm:h-96 bg-zinc-950">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1} // Strict 1:1 square for consular 2x2
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
                cropShape="rect"
              />
            </div>

            {/* Controls Bar */}
            <div className="p-5 space-y-4 bg-zinc-50 border-t border-zinc-100">
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                {/* Zoom Slider */}
                <div className="flex items-center gap-2 w-full sm:w-64">
                  <ZoomOut className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.05}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <ZoomIn className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>

                {/* Rotate button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="rounded-xl text-xs gap-1.5 bg-white border-zinc-200 shadow-2xs hover:bg-zinc-100"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ঘোরান (90°)' : 'Rotate 90°'}</span>
                </Button>
              </div>

              <div className="text-[11px] text-zinc-500 font-bangla text-center sm:text-left">
                {isBn
                  ? 'ছবিটি টেনে সেন্টারে রাখুন যাতে সম্পূর্ণ মুখমণ্ডল ও কাঁধ ফ্রেমের মধ্যে স্পষ্ট দেখা যায়।'
                  : 'Drag and zoom so the full face, eyes, and shoulders are centered within the square.'}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold text-zinc-600"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleApplyCrop}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-5 gap-1.5 shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isBn ? 'প্রসেসিং...' : 'Cropping...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isBn ? 'ছবি সেভ করুন (২×২ ইঞ্চি)' : 'Save 2×2 Photo'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
