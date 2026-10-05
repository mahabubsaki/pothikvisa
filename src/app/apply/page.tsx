'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller, FieldErrors, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { visaApplicantProfileSchema } from '@/lib/validations/profile-schema';
import { cn, toBnDigits } from '@/lib/utils';
import {
  Sparkles,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Zap,
  Play,
  FileText,
  ShieldCheck,
  User,
  MapPin,
  Building,
  Check,
  Save,
  PlusCircle,
  Eye,
  Plus,
  Trash2,
  Layers,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DateSelector } from '@/components/ui/date-selector';
import { ConsularPhotoCropper } from '@/components/ConsularPhotoCropper';
import { PassportDocumentUploader, ExtractedFields } from '@/components/PassportDocumentUploader';
import { LiveAutomationModal } from '@/components/LiveAutomationModal';
import { AIPasteAutofillModal } from '@/components/AIPasteAutofillModal';
import { OfficialPdfDraftModal } from '@/components/OfficialPdfDraftModal';
import { DraftPreviewUpgradeModal } from '@/components/DraftPreviewUpgradeModal';
import { BatchProcessingModal } from '@/components/BatchProcessingModal';
import { validatePassportPhoto, validatePassportDocument } from '@/lib/validations/media-validator';
import { useLanguage } from '@/context/LanguageContext';
import { PothikVisaLogo } from '@/components/PothikVisaLogo';
import { useUser } from '@clerk/nextjs';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import {
  VisaApplicantProfile,
  VisaPurposeCode,
  IndianMissionCode,
  VisaDurationMonths,
  OccupationCode,
  NumberOfEntriesCode,
} from '@/types/profile';
import {
  INDIAN_MISSION_OPTIONS,
  VISA_PURPOSE_OPTIONS,
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
  EDUCATION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  NATIONALITY_ACQUISITION_OPTIONS,
  PORT_OPTIONS,
  OCCUPATION_OPTIONS,
  PAST_OCCUPATION_OPTIONS,
  DURATION_MONTHS_OPTIONS,
  NUMBER_OF_ENTRIES_OPTIONS,
  PREVIOUS_VISA_TYPE_OPTIONS,
  SAARC_COUNTRY_OPTIONS,
  SAARC_YEAR_OPTIONS,
  INDIA_STATES_OPTIONS,
  INDIA_DISTRICTS_BY_STATE,
  COUNTRY_OPTIONS,
  DEFAULT_BLANK_PROFILE,
} from '@/lib/profile-constants';

interface SavedProfileItem {
  id: string;
  profile_name: string;
  passport_number: string;
  data_json: string;
  updated_at: string;
}

interface SubscriptionData {
  id: string;
  plan: 'free' | 'starter' | 'standard' | 'agency';
  status: 'active' | 'expired' | 'canceled';
  quota_total: number;
  quota_used: number;
  starts_at: string;
  expires_at: string;
}

function FieldError({ error }: { error?: { message?: string } }) {
  if (!error || !error.message) return null;
  return (
    <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 font-bangla animate-in fade-in duration-150">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <span>{error.message}</span>
    </p>
  );
}

export default function ApplyPage() {
  const router = useRouter();
  const { isBn } = useLanguage();
  const { isSignedIn, isLoaded, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profiles, setProfiles] = useState<SavedProfileItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize React Hook Form with strict VisaApplicantProfile typing & Zod schema validation
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VisaApplicantProfile>({
    resolver: zodResolver(visaApplicantProfileSchema) as any,
    mode: 'onBlur',
    defaultValues: DEFAULT_BLANK_PROFILE,
  });

  const onValidationFailed = (fieldErrors: FieldErrors<VisaApplicantProfile>) => {
    console.warn('Form validation failed:', fieldErrors);
    let firstMsg = '';
    const s1 = fieldErrors.step1_registration as Record<string, { message?: string }> | undefined;
    const s2 = fieldErrors.step2_applicant_details as Record<string, { message?: string }> | undefined;
    const s3 = fieldErrors.step3_family_address as Record<string, { message?: string }> | undefined;
    const s4 = fieldErrors.step4_visa_references as Record<string, { message?: string }> | undefined;

    if (s1) {
      firstMsg = Object.values(s1).find((e) => e?.message)?.message || '';
    } else if (s2) {
      firstMsg = Object.values(s2).find((e) => e?.message)?.message || '';
    } else if (s3) {
      firstMsg = Object.values(s3).find((e) => e?.message)?.message || '';
    } else if (s4) {
      firstMsg = Object.values(s4).find((e) => e?.message)?.message || '';
    }

    const notice = isBn
      ? `ফর্মটিতে কিছু ভুল বা অসম্পূর্ণ তথ্য রয়েছে। লাল চিহ্নিত ফিল্ডগুলো চেক করুন। ${firstMsg ? `(${firstMsg})` : ''}`
      : `Please correct the highlighted errors before submitting. ${firstMsg ? `(${firstMsg})` : ''}`;

    setErrorMsg(notice);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const hasChangedName = watch('step2_applicant_details.hasChangedName');
  const nationalityAcquiredBy = watch('step2_applicant_details.nationalityAcquiredBy');
  const selectedReligion = watch('step2_applicant_details.religion');
  const hasOtherPassport = watch('step2_applicant_details.hasOtherPassport');
  const sameAddress = watch('step3_family_address.sameAddress');
  const maritalStatus = watch('step3_family_address.maritalStatus');
  const grandparentsPakistanOrigin = watch('step3_family_address.grandparentsPakistanOrigin');
  const previousOrganizationMilitary = watch('step3_family_address.previousOrganizationMilitary');
  const everVisitedIndiaBefore = watch('step4_visa_references.everVisitedIndiaBefore');
  const permissionRefused = watch('step4_visa_references.permissionRefused');
  const visitedSaarcCountriesLast3Years = watch('step4_visa_references.visitedSaarcCountriesLast3Years');
  const referenceStateIndia = watch('step4_visa_references.referenceStateIndia');

  const {
    fields: saarcFields,
    append: appendSaarc,
    remove: removeSaarc,
  } = useFieldArray<any>({
    control,
    name: 'step4_visa_references.saarcCountryVisits',
  });

  useEffect(() => {
    if (visitedSaarcCountriesLast3Years && saarcFields.length === 0) {
      appendSaarc({ country: 'NPL', year: '2024', visitCount: '1' } as any);
    }
  }, [visitedSaarcCountriesLast3Years, saarcFields.length, appendSaarc]);

  const [uploadedPhotoFile, setUploadedPhotoFile] = useState<File | null>(null);
  const [uploadedPassportFile, setUploadedPassportFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [passportDocError, setPassportDocError] = useState<string | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isAiPasteModalOpen, setIsAiPasteModalOpen] = useState(false);
  const [isPdfDraftOpen, setIsPdfDraftOpen] = useState(false);
  const [isDraftUpgradeModalOpen, setIsDraftUpgradeModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [activeModalAppId, setActiveModalAppId] = useState<string | null>(null);

  const currentProfileLoadingRef = useRef<string | null>(null);

  const loadProfileMedia = useCallback(async (profileId: string, _data?: Record<string, unknown>) => {
    currentProfileLoadingRef.current = profileId;

    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}/media`);
      if (!res.ok) {
        if (currentProfileLoadingRef.current === profileId) {
          setUploadedPassportFile(null);
          setUploadedPhotoFile(null);
          setPhotoPreviewUrl(undefined);
        }
        return;
      }

      const mediaData = await res.json();
      if (currentProfileLoadingRef.current !== profileId) return;

      // 1. Passport Bio-Data PDF
      if (mediaData.passport && mediaData.passport.base64) {
        const byteCharacters = atob(mediaData.passport.base64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const file = new File([byteNumbers], mediaData.passport.fileName || 'Passport.pdf', {
          type: 'application/pdf',
        });
        setUploadedPassportFile(file);
        setPassportDocError(null);
      } else {
        setUploadedPassportFile(null);
      }

      // 2. Consular 2x2 Photo
      if (mediaData.photo && mediaData.photo.base64) {
        setPhotoPreviewUrl(mediaData.photo.dataUrl);
        const byteCharacters = atob(mediaData.photo.base64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const file = new File([byteNumbers], 'photo.jpg', {
          type: 'image/jpeg',
        });
        setUploadedPhotoFile(file);
        setPhotoError(null);
      } else {
        setUploadedPhotoFile(null);
        setPhotoPreviewUrl(undefined);
      }
    } catch (err) {
      console.warn('Failed to load profile media:', err);
      if (currentProfileLoadingRef.current === profileId) {
        setUploadedPassportFile(null);
        setUploadedPhotoFile(null);
        setPhotoPreviewUrl(undefined);
      }
    }
  }, []);

  const handleOpenPdfDraft = () => {
    const isProOrStandard =
      userRole === 'admin' ||
      subscription?.plan === 'standard' ||
      subscription?.plan === 'agency';

    if (!isProOrStandard) {
      setIsDraftUpgradeModalOpen(true);
      return;
    }
    setIsPdfDraftOpen(true);
  };

  const handleAIExtractedProfile = (
    profile: VisaApplicantProfile,
    meta: {
      fieldsCount: number;
      detectedFormat: string;
      sanitizationNotices: string[];
      providerUsed: string;
    }
  ) => {
    reset(profile);

    const noticesSummary =
      meta.sanitizationNotices && meta.sanitizationNotices.length > 0
        ? ` (${meta.sanitizationNotices.slice(0, 2).join('; ')})`
        : '';

    setStatusNotice(
      isBn
        ? `✨ এআই সফলভাবে ${meta.fieldsCount}টি ফিল্ড ৯টি ধাপে পূরণ করেছে (${meta.providerUsed})${noticesSummary}`
        : `✨ AI populated ${meta.fieldsCount} fields across all 9 steps (${meta.providerUsed})${noticesSummary}`
    );
    setTimeout(() => setStatusNotice(null), 8000);
  };

  const handlePassportExtracted = (fields: ExtractedFields, file: File) => {
    setUploadedPassportFile(file);
    setPassportDocError(null);

    // 1. Step 2 Applicant Details
    setValue('step2_applicant_details.surname', fields.surname);
    setValue('step2_applicant_details.givenName', fields.givenName);
    setValue('step1_registration.dateOfBirth', fields.dateOfBirth);
    setValue('step2_applicant_details.gender', fields.gender);
    setValue('step2_applicant_details.birthCity', fields.birthCity);
    setValue('step2_applicant_details.nationalIdNumber', fields.nationalIdNumber || 'NA');
    setValue('step2_applicant_details.passportNumber', fields.passportNumber);
    setValue('step2_applicant_details.passportPlaceOfIssue', fields.passportPlaceOfIssue || 'DHAKA');
    setValue('step2_applicant_details.passportDateOfIssue', fields.passportDateOfIssue);
    setValue('step2_applicant_details.passportDateOfExpiry', fields.passportDateOfExpiry);

    if (fields.previousPassportNumber) {
      setValue('step2_applicant_details.hasOtherPassport', true);
      setValue('step2_applicant_details.otherPassportNumber', fields.previousPassportNumber);
      setValue('step2_applicant_details.otherPassportCountry', 'BANGLADESH');
      setValue('step2_applicant_details.otherPassportNationality', 'BANGLADESH');
    }

    // 2. Step 3 Family Details & Address (Dots removed from parents names)
    setValue('step3_family_address.fatherName', fields.fatherName);
    setValue('step3_family_address.motherName', fields.motherName);
    setValue('step3_family_address.presentAddressLine1', fields.presentAddressLine1);
    setValue('step3_family_address.presentCity', fields.presentCity);
    setValue('step3_family_address.presentStateDistrict', fields.presentStateDistrict);
    setValue('step3_family_address.postalCode', fields.postalCode);
    setValue('step3_family_address.sameAddress', true);

    setStatusNotice(
      isBn
        ? `পাসপোর্ট (${fields.passportNumber}) থেকে তথ্য সফলভাবে ২য় ও ৩য় ধাপে অটো-ফিল করা হয়েছে!`
        : `Passport (${fields.passportNumber}) bio-data auto-populated into Steps 2 & 3!`
    );
  };

  const handlePhotoProcessed = (file: File, previewUrl: string) => {
    setUploadedPhotoFile(file);
    setPhotoPreviewUrl(previewUrl);
    setPhotoError(null);
    setStatusNotice(
      isBn
        ? '২×২ ইঞ্চি কনস্যুলার সাইজ ছবি প্রস্তুত হয়েছে।'
        : 'Consular 2x2 photo formatted & ready.'
    );
  };

  // Fetch initial profile list and user info
  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        if (data.profiles && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
          return data.profiles;
        }
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
    return [];
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    Promise.all([
      fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()),
      fetchProfiles(),
    ])
      .then(([authData, loadedProfiles]) => {
        if (!authData.authenticated) {
          router.push('/sign-in');
          return;
        }
        setSubscription(authData.subscription);
        if (authData.user?.role) {
          setUserRole(authData.user.role);
        }

        // Pre-fill email from auth if available
        if (authData.user?.email) {
          setValue('step1_registration.email', authData.user.email);
          setValue('step1_registration.reEnterEmail', authData.user.email);
        }

        // Auto-select the first profile if available
        if (loadedProfiles && loadedProfiles.length > 0) {
          const first = loadedProfiles[0];
          try {
            const parsedData = JSON.parse(first.data_json);
            reset(parsedData);
            setSelectedProfileId(first.id);
            loadProfileMedia(first.id, parsedData);
          } catch (e) {
            console.error('Failed to parse profile JSON', e);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        router.push('/sign-in');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isSignedIn, isLoaded, fetchProfiles, reset, setValue, router, loadProfileMedia]);

  // Load a chosen saved profile
  const handleSelectProfile = (profileId: string) => {
    setErrorMsg(null);
    setShowDeleteConfirm(false);
    const found = profiles.find((p) => p.id === profileId);
    if (!found) return;

    try {
      const parsed = JSON.parse(found.data_json);
      if (parsed.step4_visa_references) {
        const s4 = parsed.step4_visa_references;
        if (!s4.previousAddressLine1 && s4.previousVisitAddress1) {
          s4.previousAddressLine1 = s4.previousVisitAddress1;
        }
        if (!s4.referenceAddressIndiaLine1 && s4.referenceAddressIndia) {
          s4.referenceAddressIndiaLine1 = s4.referenceAddressIndia;
        }
        if (!s4.referenceAddressBangladeshLine1 && s4.referenceAddressBangladesh) {
          s4.referenceAddressBangladeshLine1 = s4.referenceAddressBangladesh;
        }
      }
      reset(parsed);
      setSelectedProfileId(found.id);
      loadProfileMedia(found.id, parsed);
      setStatusNotice(
        isBn
          ? `"${found.profile_name}" প্রোফাইল সফলভাবে ফর্মটিতে লোড হয়েছে!`
          : `Loaded profile "${found.profile_name}" successfully!`
      );
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (e) {
      setErrorMsg(isBn ? 'প্রোফাইল পার্সিং ব্যর্থ হয়েছে' : 'Failed to parse profile data');
    }
  };

  // Start fresh with a blank form
  const handleCreateNewProfile = () => {
    currentProfileLoadingRef.current = null;
    reset(DEFAULT_BLANK_PROFILE);
    setSelectedProfileId(null);
    setShowDeleteConfirm(false);
    setUploadedPassportFile(null);
    setUploadedPhotoFile(null);
    setPhotoPreviewUrl(undefined);
    setPassportDocError(null);
    setPhotoError(null);
    setStatusNotice(
      isBn
        ? 'নতুন ফ্রেশ ফর্ম প্রস্তুত করা হয়েছে। তথ্য পূরণ করে সেভ করুন।'
        : 'Fresh blank profile ready. Fill in details and save anytime.'
    );
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Delete active or target profile from vault and database
  const handleDeleteProfile = async (profileIdToDelete?: string) => {
    const targetId = profileIdToDelete || selectedProfileId;
    if (!targetId) return;

    try {
      setDeletingProfile(true);
      setErrorMsg(null);

      const targetProfile = profiles.find((p) => p.id === targetId);
      const res = await fetch(`/api/profiles?id=${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to delete profile');
      }

      // Remove from client profiles state
      setProfiles((prev) => prev.filter((p) => p.id !== targetId));

      // If deleted profile was currently selected, reset form to blank
      if (selectedProfileId === targetId) {
        currentProfileLoadingRef.current = null;
        setSelectedProfileId(null);
        reset(DEFAULT_BLANK_PROFILE);
        setUploadedPassportFile(null);
        setUploadedPhotoFile(null);
        setPhotoPreviewUrl(undefined);
        setPassportDocError(null);
        setPhotoError(null);
      }

      setShowDeleteConfirm(false);
      setStatusNotice(
        isBn
          ? `"${targetProfile?.profile_name || 'প্রোফাইল'}" সফলভাবে মুছে ফেলা হয়েছে!`
          : `Profile "${targetProfile?.profile_name || 'Item'}" deleted successfully!`
      );
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting profile';
      setErrorMsg(msg);
    } finally {
      setDeletingProfile(false);
    }
  };

  // Explicit Save / Update Profile
  const handleSaveProfileOnly = async () => {
    try {
      setSavingProfile(true);
      setErrorMsg(null);
      const currentValues = getValues();
      const given = currentValues.step2_applicant_details?.givenName?.trim() || '';
      const surname = currentValues.step2_applicant_details?.surname?.trim() || '';
      const passport = currentValues.step2_applicant_details?.passportNumber?.trim().toUpperCase() || 'NO_PASS';
      const defaultName = given || surname ? `${given} ${surname}`.trim() : 'Applicant Profile';

      const activeProfile = profiles.find((p) => p.id === selectedProfileId);
      const profileName = activeProfile ? activeProfile.profile_name : defaultName;

      // Check plan limits when creating a brand-new profile
      const isExisting = Boolean(selectedProfileId && profiles.some((p) => p.id === selectedProfileId));
      const maxAllowed =
        userRole === 'admin'
          ? 999
          : subscription?.plan === 'agency'
            ? 50
            : subscription?.plan === 'standard'
              ? 10
              : subscription?.plan === 'starter'
                ? 5
                : 1; // Free trial gets 1 profile

      if (!isExisting && userRole !== 'admin' && profiles.length >= maxAllowed) {
        const planName =
          subscription?.plan === 'agency'
            ? (isBn ? 'এজেন্সি প্রো (Agency Pro)' : 'Agency Pro')
            : subscription?.plan === 'standard'
              ? (isBn ? 'স্ট্যান্ডার্ড (Standard)' : 'Standard')
              : subscription?.plan === 'starter'
                ? (isBn ? 'স্টার্টার (Starter)' : 'Starter')
                : (isBn ? 'ফ্রি ট্রায়াল (Free Trial)' : 'Free Trial');
        const upgradeSuggestion =
          subscription?.plan === 'free'
            ? (isBn
                ? 'পরিবার বা ক্লায়েন্টের একাধিক প্রোফাইল সেভ করতে স্টার্টার প্ল্যানে (১৫০ ৳) আপগ্রেড করুন অথবা পূর্বে সংরক্ষিত প্রোফাইলটি মুছে ফেলুন।'
                : 'Please upgrade to Starter (150 ৳) to save multiple applicant profiles or delete your saved profile.')
            : (isBn
                ? 'আরও প্রোফাইল সংরক্ষণ করতে প্ল্যান আপগ্রেড করুন অথবা পূর্বে সংরক্ষিত অপ্রয়োজনীয় প্রোফাইল মুছে ফেলুন।'
                : 'Please upgrade your plan or delete unused profiles.');

        const limitMsg = isBn
          ? `আপনার ${planName} অ্যাকাউন্টে সর্বোচ্চ ${toBnDigits(maxAllowed)}টি প্রোফাইল সংরক্ষণের সীমা পূর্ণ হয়েছে (${toBnDigits(profiles.length)}/${toBnDigits(maxAllowed)})। ${upgradeSuggestion}`
          : `Your ${planName} account has reached the maximum limit of ${maxAllowed} saved profile (${profiles.length}/${maxAllowed}). ${upgradeSuggestion}`;
        setErrorMsg(limitMsg);
        setSavingProfile(false);
        return;
      }

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProfileId || undefined,
          profileName,
          passportNumber: passport,
          data: currentValues,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || resData.error || 'Failed to save profile');
      }

      const targetSavedId = resData.profile?.id || selectedProfileId;
      if (targetSavedId) {
        setSelectedProfileId(targetSavedId);

        // Upload media (photo & passport) to profile vault if attached
        if (uploadedPassportFile || uploadedPhotoFile) {
          const mediaFormData = new FormData();
          if (uploadedPassportFile) {
            mediaFormData.append('passportPdf', uploadedPassportFile);
          }
          if (uploadedPhotoFile) {
            mediaFormData.append('photo', uploadedPhotoFile);
          }
          try {
            await fetch(`/api/profiles/${targetSavedId}/upload`, {
              method: 'POST',
              body: mediaFormData,
            });
          } catch (uploadErr) {
            console.warn('Profile media upload warning:', uploadErr);
          }
        }
      }

      await fetchProfiles();
      setStatusNotice(
        isBn
          ? 'প্রোফাইলটি সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!'
          : 'Profile successfully saved to your vault!'
      );
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving profile';
      setErrorMsg(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit and launch automation
  const onSubmit = async (data: VisaApplicantProfile, autoRun: boolean) => {
    setErrorMsg(null);
    setSubmitting(true);

    try {
      // When autoRun is triggered, strictly validate mandatory photo and passport document
      if (autoRun) {
        let hasMediaError = false;

        const isStandard =
          subscription?.plan === 'standard' ||
          subscription?.plan === 'agency' ||
          userRole === 'admin';

        const photoValidation = await validatePassportPhoto(uploadedPhotoFile, isStandard);
        if (!photoValidation.valid) {
          const err = isBn
            ? (photoValidation.errorBn || photoValidation.error || '২×২ ইঞ্চি কনস্যুলার ছবি আপলোড করা আবশ্যক।')
            : (photoValidation.error || '2×2 inch consular photo is required.');
          setPhotoError(err);
          hasMediaError = true;
        } else {
          setPhotoError(null);
        }

        const passportValidation = await validatePassportDocument(uploadedPassportFile, isStandard);
        if (!passportValidation.valid) {
          const err = isBn
            ? (passportValidation.errorBn || passportValidation.error || 'পাসপোর্ট পিডিএফ ডকুমেন্ট আপলোড করা আবশ্যক।')
            : (passportValidation.error || 'Passport PDF document is required.');
          setPassportDocError(err);
          hasMediaError = true;
        } else {
          setPassportDocError(null);
        }

        if (hasMediaError) {
          const generalMsg = isBn
            ? 'স্বয়ংক্রিয় ওয়েব ফাইল তৈরি করতে ২×২ ইঞ্চি ছবি এবং পাসপোর্ট ডকুমেন্ট আপলোড করা বাধ্যতামূলক।'
            : '2×2 inch photograph and passport document are mandatory before starting the automation engine.';
          setErrorMsg(generalMsg);
          const intakeElem = document.getElementById('document-intake-section');
          if (intakeElem) {
            intakeElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            window.scrollTo({ top: 320, behavior: 'smooth' });
          }
          setSubmitting(false);
          return;
        }
      }

      const given = (data.step2_applicant_details?.givenName || '').trim().toUpperCase();
      const surname = (data.step2_applicant_details?.surname || '').trim().toUpperCase();
      const applicantFullName = `${given} ${surname}`.trim() || 'APPLICANT';
      const passportNumber = (data.step2_applicant_details?.passportNumber || '').trim().toUpperCase();
      if (data.step2_applicant_details) {
        data.step2_applicant_details.passportPlaceOfIssue = 'DHAKA';
      }

      if (!passportNumber) {
        throw new Error(
          isBn
            ? 'পাসপোর্ট নম্বর প্রদান করা বাধ্যতামূলক।'
            : 'Passport Number is required to proceed.'
        );
      }

      // Automatically sync/save profile to vault with full updated form data
      const activeProfile =
        profiles.find((p) => p.id === selectedProfileId) ||
        profiles.find((p) => p.passport_number.toUpperCase() === passportNumber.toUpperCase());
      const profileName = activeProfile ? activeProfile.profile_name : applicantFullName;
      const targetProfileId = activeProfile?.id || selectedProfileId || undefined;

      try {
        const profRes = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetProfileId,
            profileName,
            passportNumber,
            data,
          }),
        });
        const profData = await profRes.json();
        if (profRes.ok && profData.profile?.id) {
          setSelectedProfileId(profData.profile.id);
          // Immediately update profile vault state & UI
          fetchProfiles();
        }
      } catch (profErr) {
        console.warn('Failed to update profile vault:', profErr);
      }

      // Generate hardware & canvas device fingerprint to enforce device-level limits
      const deviceFingerprint = await getDeviceFingerprint();

      // 1. Create application in database
      const createRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-device-fingerprint': deviceFingerprint,
        },
        body: JSON.stringify({
          applicantName: applicantFullName,
          passportNumber,
          visaType: data.step1_registration?.visaPurpose || '544',
          formData: data,
          deviceFingerprint,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.message || createData.error || 'Failed to create application');
      }

      const appId = createData.application.id;

      // Upload consular photo & passport document if attached
      if (uploadedPhotoFile || uploadedPassportFile) {
        const uploadFormData = new FormData();
        if (uploadedPhotoFile) uploadFormData.append('photo', uploadedPhotoFile);
        if (uploadedPassportFile) uploadFormData.append('passportPdf', uploadedPassportFile);

        try {
          await fetch(`/api/applications/${appId}/upload`, {
            method: 'POST',
            body: uploadFormData,
          });
        } catch (uploadErr) {
          console.warn('Document upload warning:', uploadErr);
        }

        // Also sync media to active profile vault so it is permanently preserved
        if (selectedProfileId) {
          fetch(`/api/profiles/${selectedProfileId}/upload`, {
            method: 'POST',
            body: uploadFormData,
          }).catch((err) => console.warn('Profile sync upload warning:', err));
        }
      }

      // 2. Trigger Stagehand 9-step runner if autoRun
      if (autoRun) {
        await fetch(`/api/applications/${appId}/run`, {
          method: 'POST',
        });
        setActiveModalAppId(appId);
        setIsLiveModalOpen(true);
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error occurred while saving application';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-black" />
          <p className="text-xs text-[#666666] font-medium font-bangla">
            {isBn ? 'হাই-পারফরম্যান্স ফর্ম ইঞ্জিন লোড হচ্ছে...' : 'Loading high-performance form engine...'}
          </p>
        </div>
      </div>
    );
  }

  const quotaRemaining = subscription
    ? Math.max(0, subscription.quota_total - subscription.quota_used)
    : 0;
  const isUnlimited = subscription?.plan === 'agency';
  const hasQuota = isUnlimited || quotaRemaining > 0;

  const maxProfiles =
    userRole === 'admin'
      ? 999
      : subscription?.plan === 'agency'
        ? 50
        : subscription?.plan === 'standard'
          ? 10
          : subscription?.plan === 'starter'
            ? 5
            : 1;

  const currentActiveProfile = profiles.find((p) => p.id === selectedProfileId);

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-black pb-24 font-sans">
      {/* Top Header */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAEAEA]">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Button asChild variant="ghost" size="sm" className="rounded-xl gap-1 text-xs hover:bg-zinc-100 px-2 sm:px-3 shrink-0" title={isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
              </Link>
            </Button>
            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <PothikVisaLogo size={24} className="shrink-0" />
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-black font-bangla truncate">
                {isBn ? 'ইন্ডিয়ান ভিসা ওয়েব ফাইল' : 'Indian Visa Web File'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenPdfDraft}
              className="text-xs font-semibold rounded-xl bg-emerald-50/80 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800 shadow-2xs gap-1 sm:gap-1.5 px-2.5 sm:px-3 h-8 sm:h-9"
              title={isBn ? 'অফিসিয়াল ২-পৃষ্ঠা ড্রাফট পিডিএফ' : 'Official 2-page draft PDF'}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{isBn ? 'ড্রাফট পিডিএফ' : 'Draft PDF'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingProfile}
              onClick={handleSaveProfileOnly}
              className="text-xs font-semibold rounded-xl bg-white hover:bg-zinc-50 border-zinc-200 shadow-2xs gap-1 sm:gap-1.5 px-2.5 sm:px-3 h-8 sm:h-9"
              title={isBn ? 'প্রোফাইল সেভ' : 'Save profile'}
            >
              {savingProfile ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-zinc-700" />
              )}
              <span className="hidden sm:inline">{isBn ? 'প্রোফাইল সেভ' : 'Save Profile'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCreateNewProfile}
              className="text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-2xs gap-1 sm:gap-1.5 px-2.5 sm:px-3 h-8 sm:h-9"
              title={isBn ? 'নতুন প্রোফাইল' : 'Create new profile'}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBn ? 'নতুন প্রোফাইল' : 'Create New Profile'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Profile Vault & Switcher Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-bangla truncate">
                {isBn ? 'আবেদনকারী প্রোফাইল ভল্ট' : 'Applicant Profile Vault'}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Batch Processing CTA for Agency Pro / Agencies */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBatchModalOpen(true)}
                className={`h-7 sm:h-8 text-xs font-semibold rounded-xl gap-1.5 px-2.5 sm:px-3 transition-colors ${
                  subscription?.plan === 'agency'
                    ? 'border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100 shadow-2xs'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
                title={isBn ? 'মাল্টি-অ্যাপ্লিক্যান্ট ব্যাচ প্রসেসিং' : 'Multi-Applicant Batch Processing'}
              >
                <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>{isBn ? 'ব্যাচ প্রসেসিং' : 'Batch Launch'}</span>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[9px] px-1 py-0 ml-0.5">
                  Agency Pro
                </Badge>
              </Button>

              {currentActiveProfile ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 self-start sm:self-auto max-w-full truncate">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {isBn ? 'সক্রিয়: ' : 'Active: '}
                    {currentActiveProfile.profile_name} ({currentActiveProfile.passport_number})
                  </span>
                </Badge>
              ) : (
                <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 text-xs font-semibold px-2.5 py-1 self-start sm:self-auto">
                  {isBn ? 'নতুন ফ্রেশ প্রোফাইল' : 'Fresh Blank Profile'}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-zinc-600 font-bangla">
                  {isBn ? 'পূর্বে সংরক্ষিত প্রোফাইল থেকে লোড করুন:' : 'Select Existing Saved Profile:'}
                </label>
                <span
                  className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                    userRole !== 'admin' && profiles.length >= maxProfiles
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}
                >
                  {isBn
                    ? `ভল্ট লিমিট: ${toBnDigits(profiles.length)}/${userRole === 'admin' ? '∞' : toBnDigits(maxProfiles)}${subscription?.plan === 'free' ? ' (ফ্রি ট্রায়াল)' : ''}`
                    : `Vault Limit: ${profiles.length}/${userRole === 'admin' ? 'Unlimited' : maxProfiles}${subscription?.plan === 'free' ? ' (Free Trial)' : ''}`}
                </span>
              </div>
              <SearchableSelect
                value={selectedProfileId || ''}
                onChange={handleSelectProfile}
                options={profiles.map((p) => ({
                  value: p.id,
                  label: `${p.profile_name} (${p.passport_number})`,
                  description: `Last updated: ${new Date(p.updated_at).toLocaleDateString()}`,
                }))}
                placeholder={
                  profiles.length > 0
                    ? isBn
                      ? 'সংরক্ষিত প্রোফাইল পছন্দ করুন...'
                      : 'Choose an existing profile to autofill...'
                    : isBn
                    ? 'কোনো প্রোফাইল নেই - নিচে ফর্ম পূরণ করুন'
                    : 'No profiles yet - fill out form below'
                }
                searchPlaceholder={isBn ? 'নাম বা পাসপোর্ট দিয়ে খুঁজুন...' : 'Search by name or passport...'}
                emptyText={isBn ? 'কোনো প্রোফাইল মেলেনি' : 'No matching profiles found'}
              />
              {!selectedProfileId && userRole !== 'admin' && profiles.length >= maxProfiles && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 mt-2 flex items-start gap-2 text-[11px] font-bangla text-amber-900 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <span>
                      {subscription?.plan === 'free'
                        ? isBn
                          ? `ফ্রি ট্রায়ালে সর্বোচ্চ ১টি প্রোফাইল সেভ অনুমোদিত (${toBnDigits(profiles.length)}/${toBnDigits(maxProfiles)})—পরিবার বা ক্লায়েন্টের একাধিক প্রোফাইল সেভ করতে স্টার্টার প্ল্যানে (১৫০ ৳) আপগ্রেড করুন অথবা ড্রপডাউন থেকে পূর্বের প্রোফাইলটি আপডেট/ডিলিট করুন।`
                          : `Free trial allows 1 saved profile (${profiles.length}/${maxProfiles})—upgrade to Starter (150 ৳) for multiple profiles or edit/delete your existing profile.`
                        : isBn
                        ? `ভল্ট লিমিট পূর্ণ (${toBnDigits(profiles.length)}/${toBnDigits(maxProfiles)})—নতুন প্রোফাইল সেভ করতে প্ল্যান আপগ্রেড করুন অথবা পূর্বে সংরক্ষিত কোনো প্রোফাইল মুছুন।`
                        : `Vault limit reached (${profiles.length}/${maxProfiles})—upgrade plan or delete old profiles to save new ones.`}
                    </span>
                    {subscription?.plan === 'free' && (
                      <div className="mt-1.5">
                        <Link
                          href="/pricing"
                          className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                        >
                          <span>{isBn ? 'স্টার্টার প্ল্যানে আপগ্রেড করুন (১৫০ ৳) →' : 'Upgrade to Starter (150 ৳) →'}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateNewProfile}
                className="h-10 rounded-xl text-xs font-semibold border-zinc-200 hover:bg-zinc-50 shrink-0"
              >
                {isBn ? 'ফর্ম রিসেট' : 'Clear Form'}
              </Button>

              {selectedProfileId && currentActiveProfile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingProfile}
                  onClick={() => setShowDeleteConfirm((prev) => !prev)}
                  className="h-10 rounded-xl text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 shrink-0 flex items-center gap-1.5 transition-colors"
                  title={isBn ? 'এই প্রোফাইলটি মুছে ফেলুন' : 'Delete this profile'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isBn ? 'প্রোফাইল মুছুন' : 'Delete Profile'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && currentActiveProfile && (
            <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3.5 sm:p-4 text-xs space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-900 font-bangla">
                    {isBn
                      ? `আপনি কি নিশ্চিত যে "${currentActiveProfile.profile_name}" (${currentActiveProfile.passport_number}) প্রোফাইলটি স্থায়ীভাবে মুছে ফেলতে চান?`
                      : `Are you sure you want to permanently delete "${currentActiveProfile.profile_name}" (${currentActiveProfile.passport_number})?`}
                  </p>
                  <p className="text-rose-700 text-[11px] font-bangla">
                    {isBn
                      ? 'এই কাজটি আর ফেরানো যাবে না। সংরক্ষিত সমস্ত ভিসা ফিল্ড তথ্য ডাটাবেজ থেকে মুছে যাবে।'
                      : 'This action cannot be undone. All saved visa fields for this applicant will be permanently removed from your vault.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end pt-1 border-t border-rose-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deletingProfile}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-8 text-xs font-semibold text-zinc-600 hover:bg-rose-100/60 rounded-lg px-3"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={deletingProfile}
                  onClick={() => handleDeleteProfile(currentActiveProfile.id)}
                  className="h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1.5 px-3.5 shadow-xs"
                >
                  {deletingProfile ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3" />
                      <span>{isBn ? 'হ্যাঁ, স্থায়ীভাবে মুছুন' : 'Yes, Delete Permanently'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Notices */}
        {statusNotice && (
          <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-xl flex items-center gap-2 font-bangla shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="break-words">{statusNotice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 sm:p-4 rounded-xl flex items-start sm:items-center gap-2 font-bangla shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5 sm:mt-0" />
            <span className="break-words">{errorMsg}</span>
          </div>
        )}

        {/* Quota Banner */}
        {!hasQuota ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-rose-900 font-bangla">
                  {subscription?.plan === 'free'
                    ? (isBn ? 'আপনার ৩টি ফ্রি ট্রায়াল ওয়েব ফাইল শেষ হয়েছে' : '3 Free Trial Web Files Used')
                    : (isBn ? 'ওয়েব ফাইল তৈরির কোটা শেষ হয়েছে' : 'No Web File Quota Remaining')}
                </h4>
                <p className="text-xs text-rose-700 font-bangla mt-0.5">
                  {subscription?.plan === 'free'
                    ? (isBn
                        ? 'আপনার বিনামূল্যে ৩টি ওয়েব ফাইল তৈরির ট্রায়াল সম্পন্ন হয়েছে। নিয়মিত ওয়েব ফাইল তৈরি চালু রাখতে মাত্র ১৫০ ৳ বা ৩০০ ৳ প্ল্যান বেছে নিন।'
                        : 'You have used your 3 free trial web files. Choose a plan starting from 150 ৳ to keep creating web files.')
                    : (isBn
                        ? 'আপনার অ্যাকাউন্টে নতুন ওয়েব ফাইল তৈরির কোটা অবশিষ্ট নেই। স্বয়ংক্রিয়ভাবে ওয়েব ফাইল প্রস্তুত করতে প্ল্যান রিনিউ করুন।'
                        : 'You have reached your quota limit. Upgrade or renew to launch the automation engine.')}
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 self-start sm:self-auto">
              <Link href="/pricing">
                <span>{subscription?.plan === 'free' ? (isBn ? 'প্ল্যান কিনুন (১৫০ ৳ থেকে)' : 'Get a Plan (from 150 ৳)') : (isBn ? 'প্ল্যান রিনিউ করুন' : 'Renew Plan')}</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className={`border rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            subscription?.plan === 'free'
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300'
              : 'bg-emerald-50/70 border-emerald-200/80'
          }`}>
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              <span className="text-xs font-semibold text-emerald-900 font-bangla leading-relaxed">
                {subscription?.plan === 'free'
                  ? (isBn
                      ? `🎁 ফ্রি ট্রায়াল ব্যালেন্স: ৩টি ফাইলের মধ্যে অবশিষ্ট ${quotaRemaining}টি ওয়েব ফাইল (মেয়াদ ১ দিন)`
                      : `🎁 Free Trial: ${quotaRemaining} of 3 Web Files remaining (1 day validity)`)
                  : (isBn
                      ? `সক্রিয় সাবস্ক্রিপশন: অবশিষ্ট কোটা ${isUnlimited ? 'সীমাহীন' : `${quotaRemaining}টি`} ওয়েব ফাইল`
                      : `Active Subscription: ${isUnlimited ? 'Unlimited' : `${quotaRemaining} Web Files remaining`}`)}
              </span>
            </div>
            <Badge className={`${
              subscription?.plan === 'free'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            } text-[10px] font-bold uppercase shrink-0 self-start sm:self-auto`}>
              {subscription?.plan === 'free'
                ? (isBn ? 'ফ্রি ট্রায়াল' : 'Free Trial')
                : (subscription?.plan || 'Active')}
            </Badge>
          </div>
        )}

        {/* FORM CONTENT WITH REACT HOOK FORM */}
        <form className="space-y-4 sm:space-y-6">
          {/* AI Unstructured Data Intake Banner */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-zinc-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight font-bangla">
                    {isBn ? '✨ স্মার্ট এআই ফর্ম ফিলার' : '✨ Smart AI Form Filler'}
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] sm:text-[10px] font-bold">
                    {isBn ? 'এজেন্সি প্রো (৫০০ ৳)' : 'Agency Pro (500 ৳)'}
                  </Badge>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-300 font-bangla mt-0.5 leading-relaxed">
                  {isBn
                    ? 'হোয়াটসঅ্যাপ চ্যাট, এক্সেল রো বা নোট পেস্ট করলেই সমস্ত ৯টি ধাপ স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে।'
                    : 'Paste raw WhatsApp chats, Excel rows, or notes to auto-populate all 9 steps in seconds.'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                if (subscription && subscription.plan !== 'agency') {
                  setErrorMsg(
                    isBn
                      ? 'স্মার্ট এআই ফর্ম ফিলার সুবিধাটি এজেন্সি প্রো (৫০০ ৳) প্যাকেজে অন্তর্ভুক্ত। আনলিমিটেড ব্যবহার করতে প্যাকেজটি আপগ্রেড করুন।'
                      : 'Smart AI Form Filler is available on the Agency Pro (500 ৳) package. Please upgrade your plan to unlock.'
                  );
                  return;
                }
                setIsAiPasteModalOpen(true);
              }}
              className="w-full sm:w-auto rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 shrink-0 shadow-md gap-1.5 justify-center"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? 'এআই দিয়ে পূরণ করুন' : 'AI Paste to Autofill'}</span>
            </Button>
          </div>

          {/* Smart Document Intake: Passport Auto-Fill & Consular 2x2 Photo Cropper */}
          <div id="document-intake-section" className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 px-1">
              <span className="text-xs font-bold text-zinc-900 font-bangla">
                {isBn ? 'বাধ্যতামূলক ডকুমেন্ট সংযুক্তি (Photo & Passport are strictly MUST)' : 'Mandatory Document Intake (Photo & Passport MUST)'}
              </span>
              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-mono">
                REQUIRED TO SUBMIT
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PassportDocumentUploader
                onPassportExtracted={handlePassportExtracted}
                onPdfUploaded={(file) => {
                  setUploadedPassportFile(file);
                  setPassportDocError(null);
                }}
                onClear={() => {
                  setUploadedPassportFile(null);
                  setPassportDocError(null);
                }}
                isStandardSubscriber={
                  subscription?.plan === 'standard' ||
                  subscription?.plan === 'agency' ||
                  userRole === 'admin'
                }
                plan={subscription?.plan || 'starter'}
                hasError={Boolean(passportDocError)}
                errorMessage={passportDocError || undefined}
                uploadedFileName={uploadedPassportFile?.name}
                uploadedFileSizeKb={uploadedPassportFile ? Math.round(uploadedPassportFile.size / 1024) : undefined}
              />
              <ConsularPhotoCropper
                onPhotoProcessed={handlePhotoProcessed}
                onClear={() => {
                  setUploadedPhotoFile(null);
                  setPhotoPreviewUrl(undefined);
                  setPhotoError(null);
                }}
                isStandardSubscriber={
                  subscription?.plan === 'standard' ||
                  subscription?.plan === 'agency' ||
                  userRole === 'admin'
                }
                plan={subscription?.plan || 'starter'}
                initialPreviewUrl={photoPreviewUrl}
                hasError={Boolean(photoError)}
                errorMessage={photoError || undefined}
              />
            </div>
          </div>

          {/* Section 1: Registration & Mission */}
          <div className="bg-white rounded-2xl border border-[#EAEAEA] p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Building className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-black font-bangla truncate">
                  {isBn ? '১. আইভ্যাক সেন্টার ও ভিসার ধরন (Registration & Mission)' : '1. IVAC Mission & Visa Type'}
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono shrink-0">Step 1 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'ইন্ডিয়ান মিশন (IVAC Mission)' : 'Indian Mission (IVAC)'}
                </label>
                <Controller
                  name="step1_registration.indianMission"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={INDIAN_MISSION_OPTIONS}
                      placeholder={isBn ? 'মিশন নির্বাচন করুন...' : 'Select Mission...'}
                      searchPlaceholder={isBn ? 'মিশন খুঁজুন...' : 'Search mission...'}
                      hasError={Boolean(errors.step1_registration?.indianMission)}
                    />
                  )}
                />
                <FieldError error={errors.step1_registration?.indianMission} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'ভিসার ধরন ও কোড (Visa Purpose Code)' : 'Visa Purpose & Code'}
                </label>
                <Controller
                  name="step1_registration.visaPurpose"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={VISA_PURPOSE_OPTIONS}
                      placeholder={isBn ? 'ভিসার উদ্দেশ্য নির্বাচন করুন...' : 'Select Visa Purpose...'}
                      searchPlaceholder={isBn ? 'ভিসা বা কোড লিখুন (যেমন 544, মেডিকেল)...' : 'Type purpose or code (544, Tourist)...'}
                      hasError={Boolean(errors.step1_registration?.visaPurpose)}
                    />
                  )}
                />
                <FieldError error={errors.step1_registration?.visaPurpose} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'সম্ভাব্য আগমনের তারিখ (Arrival Date)' : 'Expected Arrival Date'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="step1_registration.expectedDateOfArrival"
                  control={control}
                  render={({ field }) => (
                    <DateSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="DD/MM/YYYY"
                      minYear={new Date().getFullYear()}
                      maxYear={new Date().getFullYear() + 5}
                      hasError={Boolean(errors.step1_registration?.expectedDateOfArrival)}
                    />
                  )}
                />
                <FieldError error={errors.step1_registration?.expectedDateOfArrival} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                </label>
                <input
                  type="email"
                  {...register('step1_registration.email', {
                    onChange: (e) => setValue('step1_registration.reEnterEmail', e.target.value),
                  })}
                  className={cn(
                    'w-full text-xs font-medium rounded-xl px-3 py-2.5 font-mono shadow-2xs focus:outline-none transition-all',
                    errors.step1_registration?.email
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="applicant@pothikvisa.com"
                />
                <FieldError error={errors.step1_registration?.email} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'মোবাইল নম্বর' : 'Phone / Mobile Number'}
                </label>
                <input
                  type="text"
                  {...register('step3_family_address.phone', {
                    onChange: (e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      const local = digits.startsWith('880') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
                      setValue('step3_family_address.mobile', local);
                    },
                  })}
                  className={cn(
                    'w-full text-xs font-medium rounded-xl px-3 py-2.5 font-mono shadow-2xs focus:outline-none transition-all',
                    errors.step3_family_address?.phone
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="01819234567"
                />
                <FieldError error={errors.step3_family_address?.phone} />
              </div>
            </div>
          </div>

          {/* Section 2: Applicant & Passport Details */}
          <div className="bg-white rounded-2xl border border-[#EAEAEA] p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-black font-bangla truncate">
                  {isBn ? '২. আবেদনকারী ও পাসপোর্ট তথ্য (Applicant Details)' : '2. Applicant & Passport Details'}
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono shrink-0">Step 2 of 4</span>
            </div>

            {/* Name Change Details (Connected / Conditional) */}
            <div className="pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-zinc-900 font-bangla block">
                    {isBn ? 'পূর্বে কখনো কি নাম পরিবর্তন করেছিলেন?' : 'Have you ever changed your name?'}
                  </label>
                  <p className="text-[11px] text-zinc-500 font-bangla">
                    {isBn ? 'যদি হ্যাঁ হয়, পূর্বের নাম ও পদবি প্রদান করুন।' : 'If yes, provide your previous name and surname.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(hasChangedName)}
                    onChange={(e) => setValue('step2_applicant_details.hasChangedName', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {hasChangedName && (
                <div className="mt-3 p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'পূর্বের নামের প্রথম অংশ (Previous Given Name)' : 'Previous Given Name'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step2_applicant_details.previousGivenName')}
                      className={cn(
                        'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                        errors.step2_applicant_details?.previousGivenName
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="PREVIOUS GIVEN NAME"
                    />
                    <FieldError error={errors.step2_applicant_details?.previousGivenName} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'পূর্বের পদবি (Previous Surname)' : 'Previous Surname'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step2_applicant_details.previousSurname')}
                      className={cn(
                        'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                        errors.step2_applicant_details?.previousSurname
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="PREVIOUS SURNAME"
                    />
                    <FieldError error={errors.step2_applicant_details?.previousSurname} />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'নামের প্রথম অংশ (Given Name)' : 'Given Name'}
                </label>
                <input
                  type="text"
                  {...register('step2_applicant_details.givenName')}
                  className={cn(
                    'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                    errors.step2_applicant_details?.givenName
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="TAREK HASAN"
                />
                <FieldError error={errors.step2_applicant_details?.givenName} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'পদবি / শেষ অংশ (Surname)' : 'Surname'}
                </label>
                <input
                  type="text"
                  {...register('step2_applicant_details.surname')}
                  className={cn(
                    'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                    errors.step2_applicant_details?.surname
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="CHOWDHURY"
                />
                <FieldError error={errors.step2_applicant_details?.surname} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'লিঙ্গ (Gender)' : 'Gender'}
                </label>
                <Controller
                  name="step2_applicant_details.gender"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={GENDER_OPTIONS}
                      placeholder={isBn ? 'লিঙ্গ নির্বাচন করুন...' : 'Select Gender...'}
                      hasError={Boolean(errors.step2_applicant_details?.gender)}
                    />
                  )}
                />
                <FieldError error={errors.step2_applicant_details?.gender} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'জন্ম তারিখ (Date of Birth)' : 'Date of Birth (DOB)'}
                </label>
                <Controller
                  name="step1_registration.dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <DateSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="DD/MM/YYYY"
                      minYear={1930}
                      maxYear={2026}
                      hasError={Boolean(errors.step1_registration?.dateOfBirth)}
                    />
                  )}
                />
                <FieldError error={errors.step1_registration?.dateOfBirth} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'জন্ম শহর (Birth City)' : 'Birth City'}
                </label>
                <input
                  type="text"
                  {...register('step2_applicant_details.birthCity')}
                  className={cn(
                    'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                    errors.step2_applicant_details?.birthCity
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="DHAKA"
                />
                <FieldError error={errors.step2_applicant_details?.birthCity} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'জন্মের দেশ (Country of Birth)' : 'Country of Birth'}
                </label>
                <Controller
                  name="step2_applicant_details.birthCountry"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value || 'BGD'}
                      onChange={field.onChange}
                      options={COUNTRY_OPTIONS}
                      placeholder={isBn ? 'দেশ নির্বাচন করুন...' : 'Select Country...'}
                      searchPlaceholder={isBn ? 'দেশ খুঁজুন...' : 'Search country...'}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'ধর্ম (Religion)' : 'Religion'}
                </label>
                <Controller
                  name="step2_applicant_details.religion"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={RELIGION_OPTIONS}
                      placeholder={isBn ? 'ধর্ম নির্বাচন করুন...' : 'Select Religion...'}
                      hasError={Boolean(errors.step2_applicant_details?.religion)}
                    />
                  )}
                />
                <FieldError error={errors.step2_applicant_details?.religion} />
              </div>

              {selectedReligion === 'OTHERS' && (
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'অন্যান্য ধর্ম উল্লেখ করুন (Specify Religion)' : 'Specify Religion'}
                  </label>
                  <input
                    type="text"
                    {...register('step2_applicant_details.religionOther')}
                    className="w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                    placeholder="Specify religion..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'শিক্ষাগত যোগ্যতা (Education)' : 'Educational Qualification'}
                </label>
                <Controller
                  name="step2_applicant_details.educationalQualification"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={EDUCATION_OPTIONS}
                      placeholder={isBn ? 'শিক্ষাগত যোগ্যতা...' : 'Select Education...'}
                      hasError={Boolean(errors.step2_applicant_details?.educationalQualification)}
                    />
                  )}
                />
                <FieldError error={errors.step2_applicant_details?.educationalQualification} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'জাতীয় পরিচয়পত্র নম্বর (NID)' : 'National ID (NID)'}
                </label>
                <input
                  type="text"
                  {...register('step2_applicant_details.nationalIdNumber')}
                  className={cn(
                    'w-full text-xs font-medium rounded-xl px-3 py-2.5 font-mono shadow-2xs focus:outline-none transition-all',
                    errors.step2_applicant_details?.nationalIdNumber
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="19982691234567891"
                />
                <FieldError error={errors.step2_applicant_details?.nationalIdNumber} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'শনাক্তকরণ চিহ্ন (Visible Marks)' : 'Visible Identification Marks'}
                </label>
                <input
                  type="text"
                  {...register('step2_applicant_details.visibleIdentificationMarks')}
                  className="w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                  placeholder="NA (or e.g. MOLE ON FOREHEAD)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'নাগরিকত্ব অর্জনের উপায়' : 'Nationality Acquired By'}
                </label>
                <Controller
                  name="step2_applicant_details.nationalityAcquiredBy"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={NATIONALITY_ACQUISITION_OPTIONS}
                      placeholder={isBn ? 'নির্বাচন করুন...' : 'Select...'}
                      hasError={Boolean(errors.step2_applicant_details?.nationalityAcquiredBy)}
                    />
                  )}
                />
                <FieldError error={errors.step2_applicant_details?.nationalityAcquiredBy} />
              </div>

              {nationalityAcquiredBy === 'NATURALIZATION' && (
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'পূর্ববর্তী নাগরিকত্ব (Previous Nationality)' : 'Previous Nationality'}
                  </label>
                  <Controller
                    name="step2_applicant_details.previousNationality"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        options={COUNTRY_OPTIONS}
                        placeholder={isBn ? 'পূর্বের দেশ...' : 'Select Country...'}
                        searchPlaceholder={isBn ? 'দেশ খুঁজুন...' : 'Search country...'}
                      />
                    )}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'পাসপোর্ট নম্বর (Passport No)' : 'Passport Number'}
                </label>
                <input
                  type="text"
                  {...register('step2_applicant_details.passportNumber')}
                  className={cn(
                    'w-full text-xs font-black uppercase rounded-xl px-3 py-2.5 font-mono tracking-wider shadow-2xs focus:outline-none transition-all',
                    errors.step2_applicant_details?.passportNumber
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="B09871234"
                />
                <FieldError error={errors.step2_applicant_details?.passportNumber} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#555555] font-bangla">
                    {isBn ? 'ইস্যুর স্থান (Place of Issue)' : 'Passport Place of Issue'}
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    {isBn ? 'স্থায়ী' : 'Fixed'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value="DHAKA"
                    {...register('step2_applicant_details.passportPlaceOfIssue')}
                    className="w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 bg-zinc-100/90 border border-[#EAEAEA] text-zinc-700 cursor-not-allowed select-none shadow-2xs font-mono"
                    placeholder="DHAKA"
                  />
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-zinc-500 font-bangla mt-1">
                  {isBn
                    ? 'ইস্যুর স্থান সবসময় DHAKA হিসেবে নির্ধারিত।'
                    : 'Place of Issue will be always DHAKA.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'ইস্যুর তারিখ (Issue Date)' : 'Passport Issue Date'}
                </label>
                <Controller
                  name="step2_applicant_details.passportDateOfIssue"
                  control={control}
                  render={({ field }) => (
                    <DateSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="DD/MM/YYYY"
                      minYear={2014}
                      maxYear={2026}
                      hasError={Boolean(errors.step2_applicant_details?.passportDateOfIssue)}
                    />
                  )}
                />
                <FieldError error={errors.step2_applicant_details?.passportDateOfIssue} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'মেয়াদোত্তীর্ণের তারিখ (Expiry Date)' : 'Passport Expiry Date'}
                </label>
                <Controller
                  name="step2_applicant_details.passportDateOfExpiry"
                  control={control}
                  render={({ field }) => (
                    <DateSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="DD/MM/YYYY"
                      minYear={2025}
                      maxYear={2040}
                      hasError={Boolean(errors.step2_applicant_details?.passportDateOfExpiry)}
                    />
                  )}
                />
                <FieldError error={errors.step2_applicant_details?.passportDateOfExpiry} />
              </div>
            </div>

            {/* Any other valid Passport/IC held */}
            <div className="pt-4 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-zinc-900 font-bangla block">
                    {isBn
                      ? 'অন্য কোনো বৈধ পাসপোর্ট বা আইডেন্টিটি সার্টিফিকেট আছে কি?'
                      : 'Any other valid Passport/Identity Certificate(IC) held?'}
                  </label>
                  <p className="text-[11px] text-zinc-500 font-bangla">
                    {isBn
                      ? 'যদি আপনার অন্য কোনো সক্রিয় পাসপোর্ট বা পূর্বতন দেশের ট্রাভেল ডকুমেন্ট থাকে তবে হ্যাঁ নির্বাচন করুন।'
                      : 'Select yes if you hold any other valid passport or identity certificate.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(hasOtherPassport)}
                    onChange={(e) => setValue('step2_applicant_details.hasOtherPassport', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {hasOtherPassport && (
                <div className="mt-4 p-4 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'ইস্যুকারী দেশ (Country of Issue)' : 'Country of Issue'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step2_applicant_details.otherPassportCountry')}
                      className={cn(
                        'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                        errors.step2_applicant_details?.otherPassportCountry
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="BANGLADESH"
                    />
                    <FieldError error={errors.step2_applicant_details?.otherPassportCountry} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'পাসপোর্ট / আইসি নম্বর (Passport/IC No.)' : 'Passport/IC No.'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step2_applicant_details.otherPassportNumber')}
                      className={cn(
                        'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 font-mono shadow-2xs focus:outline-none transition-all',
                        errors.step2_applicant_details?.otherPassportNumber
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="A01234567"
                    />
                    <FieldError error={errors.step2_applicant_details?.otherPassportNumber} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'ইস্যুর তারিখ (Date of Issue)' : 'Date of Issue'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      name="step2_applicant_details.otherPassportDateOfIssue"
                      control={control}
                      render={({ field }) => (
                        <DateSelector
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="DD/MM/YYYY"
                          minYear={2010}
                          maxYear={2026}
                          hasError={Boolean(errors.step2_applicant_details?.otherPassportDateOfIssue)}
                        />
                      )}
                    />
                    <FieldError error={errors.step2_applicant_details?.otherPassportDateOfIssue} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'ইস্যুর স্থান (Place of Issue)' : 'Place of Issue'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step2_applicant_details.otherPassportPlaceOfIssue')}
                      className={cn(
                        'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                        errors.step2_applicant_details?.otherPassportPlaceOfIssue
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="DHAKA"
                    />
                    <FieldError error={errors.step2_applicant_details?.otherPassportPlaceOfIssue} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'জাতীয়তা (Nationality)' : 'Nationality'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step2_applicant_details.otherPassportNationality')}
                      className={cn(
                        'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                        errors.step2_applicant_details?.otherPassportNationality
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="BANGLADESH"
                    />
                    <FieldError error={errors.step2_applicant_details?.otherPassportNationality} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Family, Address & Employment */}
          <div className="bg-white rounded-2xl border border-[#EAEAEA] p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-black font-bangla truncate">
                  {isBn ? '৩. পারিবারিক ও পেশাগত তথ্য (Family & Address)' : '3. Family, Address & Occupation'}
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono shrink-0">Step 3 of 4</span>
            </div>

            {/* Address Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-bangla border-b border-[#F0F0F0] pb-1.5">
                {isBn ? 'বর্তমান ঠিকানা (Present Address)' : 'Present Address'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#555555] font-bangla">
                      {isBn ? 'বাড়ি নং / সড়ক (House No./Street - সর্বোচ্চ ৩৫ অক্ষর)' : 'House No./Street (Max 35 Chars)'}
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {(watch('step3_family_address.presentAddressLine1') || '').length}/35
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={35}
                    {...register('step3_family_address.presentAddressLine1')}
                    className={cn(
                      'w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                      errors.step3_family_address?.presentAddressLine1
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                    )}
                    placeholder="HOUSE 45, ROAD 7, BANANI"
                  />
                  <FieldError error={errors.step3_family_address?.presentAddressLine1} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'গ্রাম / শহর (Village / City)' : 'Village / Town / City'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.presentCity')}
                    className="w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                    placeholder="DHAKA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'জেলা (District / State)' : 'State / District'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.presentStateDistrict')}
                    className="w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                    placeholder="DHAKA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'পোস্টাল কোড (Postal / Zip Code)' : 'Postal / Zip Code'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.postalCode')}
                    className="w-full text-xs font-medium rounded-xl px-3 py-2.5 font-mono bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                    placeholder="1213"
                  />
                </div>
              </div>

              {/* Same Address Toggle */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-zinc-900 font-bangla block">
                      {isBn
                        ? 'স্থায়ী ঠিকানা কি বর্তমান ঠিকানার মতোই?'
                        : 'Permanent address same as present address?'}
                    </label>
                    <p className="text-[11px] text-zinc-500 font-bangla">
                      {isBn
                        ? 'স্থায়ী ও বর্তমান ঠিকানা ভিন্ন হলে সুইচটি বন্ধ করে নিচের তথ্য দিন।'
                        : 'If different, switch off to enter permanent address details.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={Boolean(sameAddress)}
                      onChange={(e) => setValue('step3_family_address.sameAddress', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {!sameAddress && (
                  <div className="mt-3 p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'স্থায়ী বাড়ি/সড়ক (Permanent Address - সর্বোচ্চ ৩৫ অক্ষর)' : 'Permanent House/Street'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={35}
                        {...register('step3_family_address.permanentAddressLine1')}
                        className={cn(
                          'w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.permanentAddressLine1
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="VILLAGE / HOUSE, ROAD"
                      />
                      <FieldError error={errors.step3_family_address?.permanentAddressLine1} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'স্থায়ী গ্রাম/শহর (Permanent City)' : 'Permanent City'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('step3_family_address.permanentCity')}
                        className={cn(
                          'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.permanentCity
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="DHAKA"
                      />
                      <FieldError error={errors.step3_family_address?.permanentCity} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'স্থায়ী জেলা (Permanent District)' : 'Permanent District'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('step3_family_address.permanentStateDistrict')}
                        className={cn(
                          'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.permanentStateDistrict
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="DHAKA"
                      />
                      <FieldError error={errors.step3_family_address?.permanentStateDistrict} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Parents' Details */}
            <div className="space-y-4 pt-3 border-t border-[#F0F0F0]">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-bangla border-b border-[#F0F0F0] pb-1.5">
                {isBn ? 'পিতামাতার বিবরণী (Parents Details)' : 'Parents Details'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'পিতার নাম (Father Name)' : 'Father Name'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.fatherName')}
                    className={cn(
                      'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                      errors.step3_family_address?.fatherName
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                    )}
                    placeholder="MD MOTIUR RAHMAN CHOWDHURY"
                  />
                  <FieldError error={errors.step3_family_address?.fatherName} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'পিতার জন্মস্থান (Father Birth Place)' : "Father's Birth Place"}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.fatherBirthPlace')}
                    className="w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                    placeholder="DHAKA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'পিতার জাতীয়তা (Father Nationality)' : "Father's Nationality"}
                  </label>
                  <Controller
                    name="step3_family_address.fatherNationality"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value || 'BGD'}
                        onChange={field.onChange}
                        options={COUNTRY_OPTIONS}
                        placeholder={isBn ? 'জাতীয়তা...' : 'Select Country...'}
                        searchPlaceholder={isBn ? 'দেশ খুঁজুন...' : 'Search country...'}
                      />
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'মাতার নাম (Mother Name)' : 'Mother Name'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.motherName')}
                    className={cn(
                      'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                      errors.step3_family_address?.motherName
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                    )}
                    placeholder="SURAIYA BEGUM"
                  />
                  <FieldError error={errors.step3_family_address?.motherName} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'মাতার জন্মস্থান (Mother Birth Place)' : "Mother's Birth Place"}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.motherBirthPlace')}
                    className="w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                    placeholder="DHAKA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'মাতার জাতীয়তা (Mother Nationality)' : "Mother's Nationality"}
                  </label>
                  <Controller
                    name="step3_family_address.motherNationality"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value || 'BGD'}
                        onChange={field.onChange}
                        options={COUNTRY_OPTIONS}
                        placeholder={isBn ? 'জাতীয়তা...' : 'Select Country...'}
                        searchPlaceholder={isBn ? 'দেশ খুঁজুন...' : 'Search country...'}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Marital Status & Spouse Details (Connected / Conditional) */}
            <div className="space-y-4 pt-3 border-t border-[#F0F0F0]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'বৈবাহিক অবস্থা (Marital Status)' : 'Marital Status'}
                  </label>
                  <Controller
                    name="step3_family_address.maritalStatus"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={MARITAL_STATUS_OPTIONS}
                        placeholder={isBn ? 'বৈবাহিক অবস্থা...' : 'Select Marital Status...'}
                        hasError={Boolean(errors.step3_family_address?.maritalStatus)}
                      />
                    )}
                  />
                  <FieldError error={errors.step3_family_address?.maritalStatus} />
                </div>
              </div>

              {maritalStatus === 'MARRIED' && (
                <div className="p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl space-y-3">
                  <span className="text-xs font-bold text-zinc-900 font-bangla block">
                    {isBn ? 'স্বামী / স্ত্রীর বিবরণী (Spouse Details)' : 'Spouse Details'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'স্বামী/স্ত্রীর নাম (Spouse Name)' : 'Spouse Name'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('step3_family_address.spouseName')}
                        className={cn(
                          'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.spouseName
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="SPOUSE FULL NAME"
                      />
                      <FieldError error={errors.step3_family_address?.spouseName} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'জন্মস্থান (Spouse Birth Place)' : 'Spouse Birth Place'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('step3_family_address.spouseBirthPlace')}
                        className={cn(
                          'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.spouseBirthPlace
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="DHAKA"
                      />
                      <FieldError error={errors.step3_family_address?.spouseBirthPlace} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'জাতীয়তা (Spouse Nationality)' : 'Spouse Nationality'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <Controller
                        name="step3_family_address.spouseNationality"
                        control={control}
                        render={({ field }) => (
                          <SearchableSelect
                            value={field.value || 'BGD'}
                            onChange={field.onChange}
                            options={COUNTRY_OPTIONS}
                            placeholder={isBn ? 'জাতীয়তা...' : 'Select Country...'}
                            searchPlaceholder={isBn ? 'দেশ খুঁজুন...' : 'Search country...'}
                            hasError={Boolean(errors.step3_family_address?.spouseNationality)}
                          />
                        )}
                      />
                      <FieldError error={errors.step3_family_address?.spouseNationality} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Grandparents Pakistan Origin (Connected / Conditional) */}
            <div className="pt-2 pb-1 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-zinc-900 font-bangla block">
                    {isBn
                      ? 'দাদা-দাদি / নানা-নানি কি পাকিস্তানি নাগরিক ছিলেন?'
                      : 'Were Grandparents Pakistan Nationals?'}
                  </label>
                  <p className="text-[11px] text-zinc-500 font-bangla">
                    {isBn
                      ? 'দাদা/দাদি/নানা/নানি পাকিস্তানি নাগরিক বা পাকিস্তান-অধিকৃত এলাকার অধিবাসী ছিলেন কি?'
                      : 'Were grandfather/grandmother Pakistan nationals or belong to Pakistan held area?'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(grandparentsPakistanOrigin)}
                    onChange={(e) => setValue('step3_family_address.grandparentsPakistanOrigin', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {grandparentsPakistanOrigin && (
                <div className="mt-3 p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl">
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'বিস্তারিত বিবরণ (Details)' : 'Details'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.grandparentsPakistanDetails')}
                    className={cn(
                      'w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                      errors.step3_family_address?.grandparentsPakistanDetails
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                    )}
                    placeholder="Provide details..."
                  />
                  <FieldError error={errors.step3_family_address?.grandparentsPakistanDetails} />
                </div>
              )}
            </div>

            {/* Profession / Occupation Details */}
            <div className="space-y-4 pt-3 border-t border-[#F0F0F0]">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-bangla border-b border-[#F0F0F0] pb-1.5">
                {isBn ? 'পেশাগত বিবরণী (Profession / Occupation Details)' : 'Occupation & Employment'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'বর্তমান পেশা (Present Occupation)' : 'Present Occupation'}
                  </label>
                  <Controller
                    name="step3_family_address.occupation"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={OCCUPATION_OPTIONS}
                        placeholder={isBn ? 'পেশা নির্বাচন করুন...' : 'Select Occupation...'}
                        searchPlaceholder={isBn ? 'পেশা খুঁজুন...' : 'Search occupation...'}
                        hasError={Boolean(errors.step3_family_address?.occupation)}
                      />
                    )}
                  />
                  <FieldError error={errors.step3_family_address?.occupation} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'পূর্বতন পেশা (Past Occupation, if any)' : 'Past Occupation, if any'}
                  </label>
                  <Controller
                    name="step3_family_address.pastOccupation"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value || ''}
                        onChange={(val) => field.onChange(val ? (val as OccupationCode) : null)}
                        options={PAST_OCCUPATION_OPTIONS}
                        placeholder={isBn ? 'প্রযোজ্য নয় (None)' : 'None / Leave Default...'}
                        searchPlaceholder={isBn ? 'পূর্বতন পেশা খুঁজুন...' : 'Search past occupation...'}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'প্রতিষ্ঠানের নাম (Employer / Company Name)' : 'Employer / Company Name'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.employerName')}
                    className={cn(
                      'w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                      errors.step3_family_address?.employerName
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                    )}
                    placeholder="APEX FINTECH SOLUTIONS"
                  />
                  <FieldError error={errors.step3_family_address?.employerName} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'পদবি (Designation / Title)' : 'Designation / Title'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.designation')}
                    className="w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                    placeholder="SYSTEM ANALYST"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'প্রতিষ্ঠানের ঠিকানা (Employer Address)' : 'Employer Address'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.employerAddress', {
                      onChange: (e) => {
                        // Automatically replace dots with space to help the user avoid portal rejection
                        if (e.target.value.includes('.')) {
                          e.target.value = e.target.value.replace(/\./g, ' ');
                        }
                      }
                    })}
                    className={`w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 bg-[#FAFAFA] border ${
                      errors.step3_family_address?.employerAddress ? 'border-red-500' : 'border-[#EAEAEA]'
                    } text-black focus:border-black focus:bg-white shadow-2xs`}
                    placeholder="BANANI, DHAKA"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {isBn
                      ? 'ডট (.) ছাড়া বর্ণ, সংখ্যা, স্পেস এবং / # , - ব্যবহার করুন (সর্বোচ্চ ৫০ অক্ষর)'
                      : 'Letters, numbers, spaces and / # , - only. No dots (.) allowed (max 50 chars).'}
                  </p>
                  <FieldError error={errors.step3_family_address?.employerAddress} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'প্রতিষ্ঠানের ফোন (Employer Phone)' : 'Employer Phone'}
                  </label>
                  <input
                    type="text"
                    {...register('step3_family_address.employerPhone')}
                    className="w-full text-xs font-medium rounded-xl px-3 py-2.5 font-mono bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white shadow-2xs"
                    placeholder="01819234567"
                  />
                </div>
              </div>

              {/* Military / Police Organization (Connected / Conditional) */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-zinc-900 font-bangla block">
                      {isBn
                        ? 'সামরিক বা পুলিশ সংস্থায় চাকরির অভিজ্ঞতা আছে কি?'
                        : 'Military / Semi-Military / Police / Security Organization?'}
                    </label>
                    <p className="text-[11px] text-zinc-500 font-bangla">
                      {isBn
                        ? 'যদি কোনো নিরাপত্তা বাহিনীতে দায়িত্ব পালন করে থাকেন, বিবরণ দিন।'
                        : 'Select yes if you have served in military, police, or security forces.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={Boolean(previousOrganizationMilitary)}
                      onChange={(e) => setValue('step3_family_address.previousOrganizationMilitary', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {previousOrganizationMilitary && (
                  <div className="mt-3 p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'সংস্থার নাম (Organization)' : 'Organization'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('step3_family_address.previousOrganizationName')}
                        className={cn(
                          'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.previousOrganizationName
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="e.g. ARMY / POLICE"
                      />
                      <FieldError error={errors.step3_family_address?.previousOrganizationName} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'পদবি (Designation)' : 'Designation'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('step3_family_address.previousDesignation')}
                        className={cn(
                          'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.previousDesignation
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="OFFICER"
                      />
                      <FieldError error={errors.step3_family_address?.previousDesignation} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'র‍্যাংক (Rank)' : 'Rank'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('step3_family_address.previousRank')}
                        className={cn(
                          'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.previousRank
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="MAJOR / INSPECTOR"
                      />
                      <FieldError error={errors.step3_family_address?.previousRank} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                        {isBn ? 'কর্মস্থল (Place of Posting)' : 'Place of Posting'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('step3_family_address.previousPosting')}
                        className={cn(
                          'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                          errors.step3_family_address?.previousPosting
                            ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                            : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                        )}
                        placeholder="DHAKA"
                      />
                      <FieldError error={errors.step3_family_address?.previousPosting} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Ports & References */}
          <div className="bg-white rounded-2xl border border-[#EAEAEA] p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0" />
                <h3 className="text-sm font-bold text-black font-bangla truncate">
                  {isBn ? '৪. ভিসা বিবরণী, বন্দর ও রেফারেন্স (Visa Details & Ports)' : '4. Visa Details, Ports & References'}
                </h3>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono shrink-0">Step 4 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'ভিসার মেয়াদ (Duration in Months)' : 'Duration (Months)'}
                </label>
                <Controller
                  name="step4_visa_references.durationMonths"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value ? String(field.value) : ''}
                      onChange={(val) => field.onChange(val ? (Number(val) as VisaDurationMonths) : '')}
                      options={DURATION_MONTHS_OPTIONS}
                      placeholder={isBn ? 'মেয়াদ নির্বাচন করুন...' : 'Select Duration...'}
                      hasError={Boolean(errors.step4_visa_references?.durationMonths)}
                    />
                  )}
                />
                <FieldError error={errors.step4_visa_references?.durationMonths} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'প্রবেশের সংখ্যা (Number of Entries)' : 'No. of Entries'}
                </label>
                <Controller
                  name="step4_visa_references.numberOfEntries"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value || ''}
                      onChange={(val) => field.onChange(val as NumberOfEntriesCode)}
                      options={NUMBER_OF_ENTRIES_OPTIONS}
                      placeholder={isBn ? 'প্রবেশের ধরন...' : 'Select Entries...'}
                      hasError={Boolean(errors.step4_visa_references?.numberOfEntries)}
                    />
                  )}
                />
                <FieldError error={errors.step4_visa_references?.numberOfEntries} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'প্রধান দর্শনীয় স্থান (Primary Visiting Place)' : 'Primary Visiting Place'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('step4_visa_references.placesToBeVisited1')}
                  className={cn(
                    'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                    errors.step4_visa_references?.placesToBeVisited1
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="KOLKATA"
                />
                <FieldError error={errors.step4_visa_references?.placesToBeVisited1} />
                <p className="text-[10px] text-zinc-400 font-bangla mt-1">
                  {isBn ? 'ভারতে আপনার প্রধান গন্তব্য শহর' : 'Main destination city in India'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn
                    ? 'অন্যান্য দর্শনীয় স্থানসমূহ (Other Places - Comma Separated)'
                    : 'Other Places to Visit (Comma Separated)'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('step4_visa_references.placesToBeVisited2')}
                  className={cn(
                    'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                    errors.step4_visa_references?.placesToBeVisited2
                      ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                      : 'bg-[#FAFAFA] border border-[#EAEAEA] text-black focus:border-black focus:bg-white'
                  )}
                  placeholder="DELHI, JAIPUR, AGRA"
                />
                <FieldError error={errors.step4_visa_references?.placesToBeVisited2} />
                <p className="text-[10px] text-zinc-400 font-bangla mt-1">
                  {isBn ? 'অন্যান্য স্থানসমূহ কমা দিয়ে লিখুন' : 'Separate other places with commas'}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'ভারতে প্রবেশের বন্দর (Port of Arrival in India)' : 'Port of Arrival in India'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="step4_visa_references.portOfArrival"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={PORT_OPTIONS}
                      placeholder={isBn ? 'প্রবেশ বন্দর নির্বাচন করুন...' : 'Select Port of Arrival in India...'}
                      searchPlaceholder={isBn ? 'বন্দর খুঁজুন (যেমন হরিদাসপুর, আকাশপথ)...' : 'Search port (Haridaspur, Air)...'}
                      hasError={Boolean(errors.step4_visa_references?.portOfArrival)}
                    />
                  )}
                />
                <FieldError error={errors.step4_visa_references?.portOfArrival} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn ? 'ভারত থেকে প্রস্থানের বন্দর (Expected Port of Exit from India)' : 'Expected Port of Exit from India'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="step4_visa_references.portOfExit"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={PORT_OPTIONS}
                      placeholder={isBn ? 'প্রস্থান বন্দর নির্বাচন করুন...' : 'Select Expected Port of Exit from India...'}
                      searchPlaceholder={isBn ? 'বন্দর খুঁজুন...' : 'Search port...'}
                      hasError={Boolean(errors.step4_visa_references?.portOfExit)}
                    />
                  )}
                />
                <FieldError error={errors.step4_visa_references?.portOfExit} />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                  {isBn
                    ? 'বিগত ১০ বছরে ভ্রমণকৃত দেশসমূহ (একাধিক হলে কমা দিয়ে লিখুন) / Countries Visited in Last 10 Years'
                    : 'Countries Visited in Last 10 Years (comma separated, e.g. NEPAL, THAILAND)'}
                </label>
                <input
                  type="text"
                  {...register('step4_visa_references.countriesVisitedLast10Years')}
                  className="w-full text-xs font-medium uppercase bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl px-3 py-2.5 focus:outline-none focus:border-black focus:bg-white shadow-2xs"
                  placeholder="e.g. NEPAL, THAILAND, BHUTAN (or NONE if none)"
                />
                <p className="text-[11px] text-zinc-400 mt-1 font-bangla">
                  {isBn
                    ? 'বিগত ১০ বছরে কোনো দেশ ভ্রমণ না করে থাকলে "NONE" লিখুন। একাধিক দেশ হলে কমা (,) দিয়ে আলাদা করুন।'
                    : 'If no country visited, write NONE. If multiple countries visited, separate with commas (e.g. NEPAL, BHUTAN).'}
                </p>
              </div>
            </div>

            {/* Previous Visit to India Toggle */}
            <div className="pt-4 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-zinc-900 font-bangla block">
                    {isBn
                      ? 'পূর্বে কি কখনো ভারত ভ্রমণ করেছেন? (Visited India Before?)'
                      : 'Have you ever visited India before?'}
                  </label>
                  <p className="text-[11px] text-zinc-500 font-bangla">
                    {isBn
                      ? 'হ্যাঁ হলে পূর্বতন ভিসার তথ্য এবং থাকার ঠিকানা প্রদান করুন।'
                      : 'Select yes if you previously held an Indian visa or travelled to India.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...register('step4_visa_references.everVisitedIndiaBefore')}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {everVisitedIndiaBefore && (
                <div className="mt-4 p-4 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#555555] font-bangla">
                        {isBn ? 'ভারতে পূর্ববর্তী অবস্থানের ঠিকানা (Address of stay during last visit)' : 'Address of stay during last visit in India'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">3 Lines (Max 35 chars each)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <input
                          type="text"
                          maxLength={35}
                          {...register('step4_visa_references.previousAddressLine1')}
                          className={cn(
                            'w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                            errors.step4_visa_references?.previousAddressLine1
                              ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                              : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                          )}
                          placeholder="Line 1: HOTEL / STREET (Max 35)"
                        />
                        <FieldError error={errors.step4_visa_references?.previousAddressLine1} />
                      </div>

                      <div>
                        <input
                          type="text"
                          maxLength={35}
                          {...register('step4_visa_references.previousAddressLine2')}
                          className="w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 bg-white border border-[#EAEAEA] text-black focus:border-black shadow-2xs"
                          placeholder="Line 2: CITY / TOWN (Optional, Max 35)"
                        />
                        <FieldError error={errors.step4_visa_references?.previousAddressLine2} />
                      </div>

                      <div>
                        <input
                          type="text"
                          maxLength={35}
                          {...register('step4_visa_references.previousAddressLine3')}
                          className="w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 bg-white border border-[#EAEAEA] text-black focus:border-black shadow-2xs"
                          placeholder="Line 3: STATE / PIN (Optional, Max 35)"
                        />
                        <FieldError error={errors.step4_visa_references?.previousAddressLine3} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'ভ্রমণকৃত শহরসমূহ (কমা দিয়ে লিখুন) / Cities Visited' : 'Cities Visited in India (comma separated)'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step4_visa_references.previousVisitCity')}
                      className={cn(
                        'w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                        errors.step4_visa_references?.previousVisitCity
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="KOLKATA, DELHI"
                    />
                    <FieldError error={errors.step4_visa_references?.previousVisitCity} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'পূর্ববর্তী ভিসা নম্বর (Previous Visa No)' : 'Last Indian Visa No. / Currently Valid Visa No.'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step4_visa_references.previousVisaNumber')}
                      className={cn(
                        'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 font-mono shadow-2xs focus:outline-none transition-all',
                        errors.step4_visa_references?.previousVisaNumber
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="VZ1234567"
                    />
                    <FieldError error={errors.step4_visa_references?.previousVisaNumber} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'ভিসার ধরন (Type of Visa)' : 'Type of Visa'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      name="step4_visa_references.previousVisaType"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={PREVIOUS_VISA_TYPE_OPTIONS}
                          placeholder={isBn ? 'ভিসার ধরন নির্বাচন করুন...' : 'Select visa type...'}
                          searchPlaceholder={isBn ? 'ভিসা খুঁজুন...' : 'Search visa type...'}
                          hasError={Boolean(errors.step4_visa_references?.previousVisaType)}
                        />
                      )}
                    />
                    <FieldError error={errors.step4_visa_references?.previousVisaType} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'ইস্যুর স্থান (Place of Issue)' : 'Place of Issue'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('step4_visa_references.previousVisaIssuePlace')}
                      className={cn(
                        'w-full text-xs font-bold uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                        errors.step4_visa_references?.previousVisaIssuePlace
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                      placeholder="DHAKA"
                    />
                    <FieldError error={errors.step4_visa_references?.previousVisaIssuePlace} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'ইস্যুর তারিখ (Date of Issue)' : 'Date of Issue (DD/MM/YYYY)'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      name="step4_visa_references.previousVisaIssueDate"
                      control={control}
                      render={({ field }) => (
                        <DateSelector
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="DD/MM/YYYY"
                          minYear={2014}
                          maxYear={new Date().getFullYear()}
                          hasError={Boolean(errors.step4_visa_references?.previousVisaIssueDate)}
                        />
                      )}
                    />
                    <FieldError error={errors.step4_visa_references?.previousVisaIssueDate} />
                  </div>
                </div>
              )}
            </div>

            {/* Permission Refused Toggle (Connected / Conditional) */}
            <div className="pt-3 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-zinc-900 font-bangla block">
                    {isBn
                      ? 'ভারতে প্রবেশ বা ভিসার মেয়াদ বাড়ানোর আবেদন পূর্বে কখনো প্রত্যাখ্যাত হয়েছে কি?'
                      : 'Has permission to visit or extend stay in India previously been refused?'}
                  </label>
                  <p className="text-[11px] text-zinc-500 font-bangla">
                    {isBn
                      ? 'যদি কখনো ভারত ভিসা প্রত্যাখ্যাত হয়ে থাকে, হ্যাঁ নির্বাচন করে বিবরণ দিন।'
                      : 'Select yes if your Indian visa or extension was ever refused.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(permissionRefused)}
                    onChange={(e) => setValue('step4_visa_references.permissionRefused', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {permissionRefused && (
                <div className="mt-3 p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl">
                  <label className="block text-xs font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'প্রত্যাখ্যানের বিবরণ (Control No. ও তারিখসহ) / Refusal Details' : 'Refusal Details (Mention Control No. and Date)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('step4_visa_references.permissionRefusedDetails')}
                    className={cn(
                      'w-full text-xs font-medium uppercase rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                      errors.step4_visa_references?.permissionRefusedDetails
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                    )}
                    placeholder="Provide refusal date, control number, and details..."
                  />
                  <FieldError error={errors.step4_visa_references?.permissionRefusedDetails} />
                </div>
              )}
            </div>

            {/* SAARC Country Visit Details */}
            <div className="pt-2 pb-1 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-zinc-900 font-bangla block">
                    {isBn
                      ? 'বিগত ৩ বছরে সার্কভুক্ত কোনো দেশ ভ্রমণ করেছেন? (SAARC Country Visit Details)'
                      : 'Have you visited SAARC countries during last 3 years?'}
                  </label>
                  <p className="text-[11px] text-zinc-500 font-bangla">
                    {isBn
                      ? 'সার্কভুক্ত দেশ (ভুটান, নেপাল, মালদ্বীপ, শ্রীলঙ্কা, পাকিস্তান, আফগানিস্তান) ভ্রমণ করে থাকলে হ্যাঁ দিন।'
                      : 'Have you visited SAARC countries (except your own country) during last 3 years?'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={Boolean(visitedSaarcCountriesLast3Years)}
                    onChange={(e) => setValue('step4_visa_references.visitedSaarcCountriesLast3Years', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {visitedSaarcCountriesLast3Years && (
                <div className="mt-3 p-4 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 font-bangla">
                      {isBn ? 'সার্ক দেশ ভ্রমণের তালিকা' : 'SAARC Country Visits'}{' '}
                      <span className="text-rose-500">*</span>
                    </span>
                    {saarcFields.length < 8 && (
                      <button
                        type="button"
                        onClick={() => appendSaarc({ country: 'NPL', year: '2024', visitCount: '1' })}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isBn ? '+ আরো দেশ যোগ করুন' : '+ Add Country'}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {saarcFields.map((field, idx) => (
                      <div key={field.id} className="p-3 bg-white rounded-xl border border-[#EAEAEA] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-[#555555] mb-1 font-bangla">
                            {isBn ? 'দেশের নাম (SAARC Country)' : 'Name of SAARC Country'}{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <Controller
                            name={`step4_visa_references.saarcCountryVisits.${idx}.country`}
                            control={control}
                            render={({ field: cField }) => (
                              <SearchableSelect
                                value={cField.value}
                                onChange={cField.onChange}
                                options={SAARC_COUNTRY_OPTIONS}
                                placeholder={isBn ? 'দেশ নির্বাচন করুন...' : 'Select country...'}
                                hasError={Boolean(errors.step4_visa_references?.saarcCountryVisits?.[idx]?.country)}
                              />
                            )}
                          />
                          <FieldError error={errors.step4_visa_references?.saarcCountryVisits?.[idx]?.country} />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-[#555555] mb-1 font-bangla">
                            {isBn ? 'বছর (Year)' : 'Year'}{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <Controller
                            name={`step4_visa_references.saarcCountryVisits.${idx}.year`}
                            control={control}
                            render={({ field: yField }) => (
                              <SearchableSelect
                                value={yField.value}
                                onChange={yField.onChange}
                                options={SAARC_YEAR_OPTIONS}
                                placeholder={isBn ? 'বছর...' : 'Year...'}
                                hasError={Boolean(errors.step4_visa_references?.saarcCountryVisits?.[idx]?.year)}
                              />
                            )}
                          />
                          <FieldError error={errors.step4_visa_references?.saarcCountryVisits?.[idx]?.year} />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-[#555555] mb-1 font-bangla">
                            {isBn ? 'ভ্রমণ সংখ্যা (No. of visits)' : 'No. of visits'}{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...register(`step4_visa_references.saarcCountryVisits.${idx}.visitCount`)}
                            className={cn(
                              'w-full text-xs font-bold rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none transition-all',
                              errors.step4_visa_references?.saarcCountryVisits?.[idx]?.visitCount
                                ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                                : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                            )}
                            placeholder="1"
                          />
                          <FieldError error={errors.step4_visa_references?.saarcCountryVisits?.[idx]?.visitCount} />
                        </div>

                        <div className="sm:col-span-1 flex items-center justify-end pb-1">
                          {saarcFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSaarc(idx)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title={isBn ? 'মুছে ফেলুন' : 'Remove row'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FieldError error={errors.step4_visa_references?.saarcCountryVisits as any} />
                </div>
              )}
            </div>

            {/* References Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F0F0F0]">
              {/* India Reference */}
              <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] space-y-3">
                <span className="text-xs font-bold text-black font-bangla block">
                  {isBn ? 'ভারতের রেফারেন্স (হোটেল বা ব্যক্তি)' : 'India Reference (Hotel/Person)'}{' '}
                  <span className="text-rose-500">*</span>
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'নাম (Hotel / Contact Person Name)' : 'Reference / Hotel Name'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Hotel / Contact Person Name"
                    {...register('step4_visa_references.referenceNameIndia')}
                    className={cn(
                      'w-full text-xs font-medium uppercase rounded-lg px-3 py-2 shadow-2xs focus:outline-none transition-all',
                      errors.step4_visa_references?.referenceNameIndia
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                    )}
                  />
                  <FieldError error={errors.step4_visa_references?.referenceNameIndia} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-[#555555] font-bangla">
                      {isBn ? 'ঠিকানা (Address in India)' : 'Address in India'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">2 Lines (Max 200 chars each)</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      maxLength={200}
                      placeholder="Line 1: Hotel Name / Street (Max 200)"
                      {...register('step4_visa_references.referenceAddressIndiaLine1')}
                      className={cn(
                        'w-full text-xs font-medium uppercase rounded-lg px-3 py-2 shadow-2xs focus:outline-none transition-all',
                        errors.step4_visa_references?.referenceAddressIndiaLine1
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                    />
                    <FieldError error={errors.step4_visa_references?.referenceAddressIndiaLine1} />
                  </div>
                  <div>
                    <input
                      type="text"
                      maxLength={200}
                      placeholder="Line 2: Area / Landmark (Optional, Max 200)"
                      {...register('step4_visa_references.referenceAddressIndiaLine2')}
                      className="w-full text-xs font-medium uppercase rounded-lg px-3 py-2 bg-white border border-[#EAEAEA] text-black focus:border-black shadow-2xs"
                    />
                    <FieldError error={errors.step4_visa_references?.referenceAddressIndiaLine2} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'রাজ্য (State)' : 'State'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      name="step4_visa_references.referenceStateIndia"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            setValue('step4_visa_references.referenceDistrictIndia', '');
                          }}
                          options={INDIA_STATES_OPTIONS}
                          placeholder={isBn ? 'রাজ্য নির্বাচন করুন...' : 'Select State...'}
                          searchPlaceholder={isBn ? 'রাজ্য খুঁজুন (যেমন West Bengal)...' : 'Search state (e.g. West Bengal)...'}
                          hasError={Boolean(errors.step4_visa_references?.referenceStateIndia)}
                        />
                      )}
                    />
                    <FieldError error={errors.step4_visa_references?.referenceStateIndia} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1 font-bangla">
                      {isBn ? 'জেলা (District)' : 'District'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      name="step4_visa_references.referenceDistrictIndia"
                      control={control}
                      render={({ field }) => {
                        const scopedDistricts = (referenceStateIndia && INDIA_DISTRICTS_BY_STATE[referenceStateIndia]) || [];
                        return (
                          <SearchableSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={scopedDistricts}
                            placeholder={
                              referenceStateIndia
                                ? isBn
                                  ? 'জেলা নির্বাচন করুন...'
                                  : 'Select District...'
                                : isBn
                                ? 'আগে রাজ্য বেছে নিন...'
                                : 'Select State first...'
                            }
                            searchPlaceholder={isBn ? 'জেলা খুঁজুন (যেমন Kolkata)...' : 'Search district (e.g. Kolkata)...'}
                            disabled={!referenceStateIndia}
                            hasError={Boolean(errors.step4_visa_references?.referenceDistrictIndia)}
                          />
                        );
                      }}
                    />
                    <FieldError error={errors.step4_visa_references?.referenceDistrictIndia} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#555555] mb-1 font-bangla">
                    {isBn ? 'ফোন নম্বর (Phone)' : 'Phone Number'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contact Phone Number"
                    {...register('step4_visa_references.referencePhoneIndia')}
                    className={cn(
                      'w-full text-xs font-medium rounded-lg px-3 py-2 font-mono shadow-2xs focus:outline-none transition-all',
                      errors.step4_visa_references?.referencePhoneIndia
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                    )}
                  />
                  <FieldError error={errors.step4_visa_references?.referencePhoneIndia} />
                </div>
              </div>

              {/* Bangladesh Reference */}
              <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#EAEAEA] space-y-3">
                <span className="text-xs font-bold text-black font-bangla block">
                  {isBn ? 'বাংলাদেশের রেফারেন্স (পরিচিত ব্যক্তি)' : 'Bangladesh Reference'}
                </span>
                <div>
                  <input
                    type="text"
                    placeholder="Contact Person Full Name"
                    {...register('step4_visa_references.referenceNameBangladesh')}
                    className={cn(
                      'w-full text-xs font-medium uppercase rounded-lg px-3 py-2 shadow-2xs focus:outline-none transition-all',
                      errors.step4_visa_references?.referenceNameBangladesh
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                    )}
                  />
                  <FieldError error={errors.step4_visa_references?.referenceNameBangladesh} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-[#555555] font-bangla">
                      {isBn ? 'ঠিকানা (Address in Bangladesh)' : 'Address in Bangladesh'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">2 Lines (Max 35 chars each)</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      maxLength={35}
                      placeholder="Line 1: House / Road / Area (Max 35)"
                      {...register('step4_visa_references.referenceAddressBangladeshLine1')}
                      className={cn(
                        'w-full text-xs font-medium uppercase rounded-lg px-3 py-2 shadow-2xs focus:outline-none transition-all',
                        errors.step4_visa_references?.referenceAddressBangladeshLine1
                          ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                          : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                      )}
                    />
                    <FieldError error={errors.step4_visa_references?.referenceAddressBangladeshLine1} />
                  </div>
                  <div>
                    <input
                      type="text"
                      maxLength={35}
                      placeholder="Line 2: Thana / City / District (Optional, Max 35)"
                      {...register('step4_visa_references.referenceAddressBangladeshLine2')}
                      className="w-full text-xs font-medium uppercase rounded-lg px-3 py-2 bg-white border border-[#EAEAEA] text-black focus:border-black shadow-2xs"
                    />
                    <FieldError error={errors.step4_visa_references?.referenceAddressBangladeshLine2} />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Contact Mobile Number"
                    {...register('step4_visa_references.referencePhoneBangladesh')}
                    className={cn(
                      'w-full text-xs font-medium rounded-lg px-3 py-2 font-mono shadow-2xs focus:outline-none transition-all',
                      errors.step4_visa_references?.referencePhoneBangladesh
                        ? 'bg-rose-50/30 border border-rose-400 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                        : 'bg-white border border-[#EAEAEA] text-black focus:border-black'
                    )}
                  />
                  <FieldError error={errors.step4_visa_references?.referencePhoneBangladesh} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Status & Error Notices */}
          {statusNotice && (
            <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-xl flex items-center gap-2 font-bangla shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="break-words">{statusNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 sm:p-4 rounded-xl flex items-start sm:items-center gap-2 font-bangla shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5 sm:mt-0" />
              <span className="break-words">{errorMsg}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="bg-white rounded-2xl border border-[#EAEAEA] p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-black font-bangla">
                {isBn ? 'ইন্ডিয়ান ভিসা ওয়েব ফাইল তৈরিতে প্রস্তুত?' : 'Ready to Create Indian Visa Web File?'}
              </h4>
              <p className="text-xs text-[#666666] font-bangla mt-0.5">
                {isBn
                  ? 'বাটনে ক্লিক করলেই স্বয়ংক্রিয় ব্রাউজার ৯টি ধাপ পূরণ করে তাৎক্ষণিক অফিশিয়াল ওয়েব ফাইল প্রস্তুত করবে।'
                  : 'Automated browser execution across 9 steps generating your official Indian Visa Web File.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenPdfDraft}
                className="w-full sm:w-auto rounded-xl text-xs font-bold border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/70 h-10 sm:h-11 shadow-2xs gap-1.5"
                title={isBn ? 'অফিসিয়াল ২-পৃষ্ঠা ড্রাফট পিডিএফ দেখুন' : 'Preview official 2-page draft PDF'}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isBn ? 'অফিসিয়াল পিডিএফ প্রিভিউ' : 'Official PDF Preview'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={savingProfile || submitting}
                onClick={handleSaveProfileOnly}
                className="w-full sm:w-auto rounded-xl text-xs font-bold border-zinc-200 hover:bg-zinc-50 h-10 sm:h-11 gap-1"
                title={isBn ? 'ড্রাফট হিসেবে প্রোফাইল সেভ করুন' : 'Save draft profile'}
              >
                {savingProfile ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1 text-zinc-700" />
                )}
                <span>{isBn ? 'ড্রাফট হিসেবে রাখুন' : 'Save Draft'}</span>
              </Button>

              <Button
                type="button"
                disabled={submitting || !hasQuota}
                onClick={handleSubmit((data) => onSubmit(data, true), onValidationFailed)}
                className="w-full sm:w-auto rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white h-10 sm:h-11 px-4 sm:px-6 shadow-sm gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isBn ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span className="truncate">{isBn ? 'স্বয়ংক্রিয় ওয়েব ফাইল তৈরি করুন' : 'Create Web File Now'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {activeModalAppId && (
        <LiveAutomationModal
          applicationId={activeModalAppId}
          isOpen={isLiveModalOpen}
          onClose={() => setIsLiveModalOpen(false)}
          onViewDashboard={() => router.push('/dashboard')}
        />
      )}

      <AIPasteAutofillModal
        isOpen={isAiPasteModalOpen}
        onClose={() => setIsAiPasteModalOpen(false)}
        onProfileExtracted={handleAIExtractedProfile}
      />

      <OfficialPdfDraftModal
        isOpen={isPdfDraftOpen}
        onClose={() => setIsPdfDraftOpen(false)}
        getProfileData={getValues}
        photoBase64={photoPreviewUrl}
        applicationId="BGDDW1EF0826"
      />

      <DraftPreviewUpgradeModal
        isOpen={isDraftUpgradeModalOpen}
        onClose={() => setIsDraftUpgradeModalOpen(false)}
      />

      <BatchProcessingModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        profiles={profiles as any}
        userPlan={subscription?.plan}
        isAdmin={userRole === 'admin'}
        onBatchComplete={fetchProfiles}
      />
    </div>
  );
}
