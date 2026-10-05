'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, FieldErrors, FormProvider } from 'react-hook-form';
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
  Check,
  Save,
  PlusCircle,
  Eye,
  Trash2,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/form/FieldError';
import { RegistrationMissionSection } from '@/components/apply/RegistrationMissionSection';
import { ApplicantPassportSection } from '@/components/apply/ApplicantPassportSection';
import { FamilyEmploymentSection } from '@/components/apply/FamilyEmploymentSection';
import { VisaReferencesSection } from '@/components/apply/VisaReferencesSection';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
import {
  VisaApplicantProfile,
} from '@/types/profile';
import {
  DEFAULT_BLANK_PROFILE,
  sanitizeProfileDefaults,
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
  plan: 'free' | 'paid';
  status: 'active' | 'expired' | 'revoked';
  quota_total: number | null;
  quota_used: number;
  starts_at: string;
  expires_at: string | null;
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
  const form = useForm<VisaApplicantProfile>({
    resolver: zodResolver(visaApplicantProfileSchema) as any,
    mode: 'onBlur',
    defaultValues: DEFAULT_BLANK_PROFILE,
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = form;

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
    const isProOrStandard = userRole === 'admin' || subscription?.plan === 'paid';

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
    // Remove values restored by browser/local form savers. Vault profiles are
    // the only supported way to prefill this form.
    try {
      const staleFormKeys = Array.from({ length: window.localStorage.length }, (_, index) =>
        window.localStorage.key(index)
      ).filter((key): key is string => key?.startsWith('formSaver_/apply_form_') ?? false);
      staleFormKeys.forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
      console.warn('Unable to clear locally saved apply form data:', error);
    }
    reset(DEFAULT_BLANK_PROFILE);
    setSelectedProfileId(null);
  }, [reset]);

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
      .then(([authData]) => {
        if (!authData.authenticated) {
          router.push('/sign-in');
          return;
        }
        if (authData.user?.accountStatus !== 'approved') {
          router.replace('/pending-approval');
          return;
        }
        setSubscription(authData.subscription);
        if (authData.user?.role) {
          setUserRole(authData.user.role);
        }

      })
      .catch((err) => {
        console.error(err);
        router.push('/sign-in');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isSignedIn, isLoaded, fetchProfiles, reset, router]);

  // Load a chosen saved profile
  const handleSelectProfile = (profileId: string) => {
    setErrorMsg(null);
    setShowDeleteConfirm(false);
    const found = profiles.find((p) => p.id === profileId);
    if (!found) return;

    try {
      const parsed = sanitizeProfileDefaults(JSON.parse(found.data_json));
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
      const currentValues = sanitizeProfileDefaults(getValues());
      if (currentValues.step1_registration) {
        currentValues.step1_registration.countryApplyingFrom = 'BGD';
        if (!currentValues.step1_registration.nationality) {
          currentValues.step1_registration.nationality = 'BGD';
        }
      }
      const given = currentValues.step2_applicant_details?.givenName?.trim() || '';
      const surname = currentValues.step2_applicant_details?.surname?.trim() || '';
      const passport = currentValues.step2_applicant_details?.passportNumber?.trim().toUpperCase() || 'NO_PASS';
      const defaultName = given || surname ? `${given} ${surname}`.trim() : 'Applicant Profile';

      const activeProfile = profiles.find((p) => p.id === selectedProfileId);
      const profileName = activeProfile ? activeProfile.profile_name : defaultName;

      // Check plan limits when creating a brand-new profile
      const isExisting = Boolean(selectedProfileId && profiles.some((p) => p.id === selectedProfileId));
      const maxAllowed = userRole === 'admin' ? 999 : subscription?.plan === 'paid' ? 50 : 1;

      if (!isExisting && userRole !== 'admin' && profiles.length >= maxAllowed) {
        const planName = subscription?.plan === 'paid'
          ? (isBn ? 'পেইড' : 'Paid')
          : (isBn ? 'ফ্রি' : 'Free');
        const upgradeSuggestion =
          subscription?.plan === 'free'
            ? (isBn
                ? 'একাধিক প্রোফাইল সেভ করতে পেইড প্ল্যানে আপগ্রেড করুন অথবা পূর্বের প্রোফাইলটি মুছে ফেলুন।'
                : 'Please upgrade to Paid to save multiple applicant profiles, or delete your saved profile.')
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
  const onSubmit = async (rawFormData: VisaApplicantProfile, autoRun: boolean) => {
    const data = sanitizeProfileDefaults(rawFormData);
    setErrorMsg(null);
    setSubmitting(true);

    try {
      // When autoRun is triggered, strictly validate mandatory photo and passport document
      if (autoRun) {
        let hasMediaError = false;

        const isStandard = subscription?.plan === 'paid' || userRole === 'admin';

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

      if (data.step1_registration) {
        data.step1_registration.countryApplyingFrom = 'BGD';
        if (!data.step1_registration.nationality) {
          data.step1_registration.nationality = 'BGD';
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

      // 1. Create application in database
      const createRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: applicantFullName,
          passportNumber,
          visaType: data.step1_registration?.visaPurpose || '544',
          formData: data,
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

  const quotaRemaining = subscription?.quota_total !== null && subscription?.quota_total !== undefined
    ? Math.max(0, subscription.quota_total - subscription.quota_used)
    : 0;
  const isUnlimited = subscription?.quota_total === null;
  const hasQuota = isUnlimited || quotaRemaining > 0;

  const maxProfiles = userRole === 'admin' ? 999 : subscription?.plan === 'paid' ? 50 : 1;

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
              {/* Batch processing is available to paid users. */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBatchModalOpen(true)}
                className={`h-7 sm:h-8 text-xs font-semibold rounded-xl gap-1.5 px-2.5 sm:px-3 transition-colors ${
                  subscription?.plan === 'paid'
                    ? 'border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100 shadow-2xs'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
                title={isBn ? 'মাল্টি-অ্যাপ্লিক্যান্ট ব্যাচ প্রসেসিং' : 'Multi-Applicant Batch Processing'}
              >
                <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>{isBn ? 'ব্যাচ প্রসেসিং' : 'Batch Launch'}</span>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[9px] px-1 py-0 ml-0.5">
                  Paid
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
                    ? `ভল্ট লিমিট: ${toBnDigits(profiles.length)}/${userRole === 'admin' ? '∞' : toBnDigits(maxProfiles)}${subscription?.plan === 'free' ? ' (ফ্রি)' : ''}`
                    : `Vault Limit: ${profiles.length}/${userRole === 'admin' ? 'Unlimited' : maxProfiles}${subscription?.plan === 'free' ? ' (Free)' : ''}`}
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
                          ? `ফ্রি প্ল্যানে সর্বোচ্চ ১টি প্রোফাইল সেভ করা যায় (${toBnDigits(profiles.length)}/${toBnDigits(maxProfiles)})—আরও প্রোফাইলের জন্য পেইড প্ল্যানে আপগ্রেড করুন।`
                          : `Free access allows 1 saved profile (${profiles.length}/${maxProfiles})—upgrade to Paid for more profiles or edit/delete your existing profile.`
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
                          <span>{isBn ? 'পেইড প্ল্যানে আপগ্রেড করুন (৫০০ ৳) →' : 'Upgrade to Paid (500 ৳) →'}</span>
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
                    ? (isBn ? 'আজকের ৩টি ফ্রি ওয়েব ফাইল শেষ হয়েছে' : 'Today’s 3 Free Web Files Used')
                    : (isBn ? 'ওয়েব ফাইল তৈরির কোটা শেষ হয়েছে' : 'No Web File Quota Remaining')}
                </h4>
                <p className="text-xs text-rose-700 font-bangla mt-0.5">
                  {subscription?.plan === 'free'
                    ? (isBn
                        ? 'আপনার ৩টি ফ্রি ওয়েব ফাইল ব্যবহার হয়েছে। কাজ চালিয়ে যেতে পেইড প্ল্যানে আপগ্রেড করুন।'
                        : 'You have used your 3 free web files. Upgrade to Paid to keep creating web files.')
                    : (isBn
                        ? 'আপনার অ্যাকাউন্টে নতুন ওয়েব ফাইল তৈরির কোটা অবশিষ্ট নেই। স্বয়ংক্রিয়ভাবে ওয়েব ফাইল প্রস্তুত করতে প্ল্যান রিনিউ করুন।'
                        : 'You have reached your quota limit. Upgrade or renew to launch the automation engine.')}
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 self-start sm:self-auto">
              <Link href="/pricing">
                <span>{subscription?.plan === 'free' ? (isBn ? 'পেইড নিন' : 'Upgrade to Paid') : (isBn ? 'প্ল্যান রিনিউ করুন' : 'Renew Plan')}</span>
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
                      ? `🎁 ফ্রি ব্যালেন্স: ৩টি ফাইলের মধ্যে অবশিষ্ট ${quotaRemaining}টি ওয়েব ফাইল`
                      : `🎁 Free: ${quotaRemaining} of 3 daily Web Files remaining`)
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
                ? (isBn ? 'ফ্রি' : 'Free')
                : (subscription?.plan || 'Active')}
            </Badge>
          </div>
        )}

        {/* FORM CONTENT WITH REACT HOOK FORM */}
        <FormProvider {...form}>
        <form autoComplete="off" className="space-y-4 sm:space-y-6">
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
                    {isBn ? 'পেইড (৫০০ ৳)' : 'Paid (500 ৳)'}
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
                if (subscription && subscription.plan !== 'paid') {
                  setErrorMsg(
                    isBn
                      ? 'স্মার্ট এআই ফর্ম ফিলার সুবিধাটি এজেন্সি প্রো (৫০০ ৳) প্যাকেজে অন্তর্ভুক্ত। আনলিমিটেড ব্যবহার করতে প্যাকেজটি আপগ্রেড করুন।'
                      : 'Smart AI Form Filler is available with Paid access (500 ৳). Please upgrade to unlock it.'
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
                  subscription?.plan === 'paid' ||
                  userRole === 'admin'
                }
                plan={subscription?.plan || 'free'}
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
                  subscription?.plan === 'paid' ||
                  userRole === 'admin'
                }
                plan={subscription?.plan || 'free'}
                initialPreviewUrl={photoPreviewUrl}
                hasError={Boolean(photoError)}
                errorMessage={photoError || undefined}
              />
            </div>
          </div>

          {/* Section 1: Registration & Mission */}
          <RegistrationMissionSection
            isBn={isBn}
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
          />

          <ApplicantPassportSection isBn={isBn} />
          <FamilyEmploymentSection isBn={isBn} />
          <VisaReferencesSection isBn={isBn} />
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
        </FormProvider>
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
