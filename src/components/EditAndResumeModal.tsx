'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  Users,
  MapPin,
  Compass,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/context/LanguageContext';

interface EditAndResumeModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onResumeStarted: (appId: string) => void;
  onSaved: () => void;
  showToast: (message: string, variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info') => void;
}

interface RawFormData {
  step2_applicant_details?: Record<string, string>;
  step3_family_address?: Record<string, string>;
  step4_visa_references?: Record<string, string>;
  step8_stay_details?: Record<string, string>;
  [key: string]: unknown;
}

export function EditAndResumeModal({
  applicationId,
  isOpen,
  onClose,
  onResumeStarted,
  onSaved,
  showToast,
}: EditAndResumeModalProps) {
  const { isBn } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'travel'>('personal');
  const [localAlert, setLocalAlert] = useState<{ message: string; variant: 'destructive' | 'success' | 'warning' | 'info' } | null>(null);

  // Application metadata
  const [appMeta, setAppMeta] = useState<{
    id: string;
    tempId?: string | null;
    status: string;
    currentStep: number;
    failedStep?: number | null;
    failureReason?: string | null;
  } | null>(null);

  // Editable Form Data
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [rawFormData, setRawFormData] = useState<RawFormData>({});

  useEffect(() => {
    if (!isOpen || !applicationId) return;

    setLoading(true);
    setLocalAlert(null);

    fetch(`/api/applications/${applicationId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load application details');
        return res.json();
      })
      .then((data) => {
        if (data.application) {
          const app = data.application;
          setAppMeta({
            id: app.id,
            tempId: app.temp_id,
            status: app.status,
            currentStep: app.current_step,
            failedStep: app.failed_step,
            failureReason: app.failure_reason,
          });

          let parsed: RawFormData = {};
          try {
            parsed = JSON.parse(app.form_data_json || '{}') as RawFormData;
          } catch {}
          setRawFormData(parsed);

          setFormData({
            // Personal & Passport (Step 2)
            givenName: parsed.step2_applicant_details?.givenName || app.applicant_name?.split(' ').slice(0, -1).join(' ') || '',
            surname: parsed.step2_applicant_details?.surname || app.applicant_name?.split(' ').slice(-1)[0] || '',
            gender: parsed.step2_applicant_details?.gender || 'M',
            birthCity: parsed.step2_applicant_details?.birthCity || '',
            birthCountry: parsed.step2_applicant_details?.birthCountry || 'BGD',
            religion: parsed.step2_applicant_details?.religion || 'ISLAM',
            nationalIdNumber: parsed.step2_applicant_details?.nationalIdNumber || 'NA',
            visibleIdentificationMarks: parsed.step2_applicant_details?.visibleIdentificationMarks || 'NA',
            educationalQualification: parsed.step2_applicant_details?.educationalQualification || 'GRADUATE',
            passportNumber: parsed.step2_applicant_details?.passportNumber || app.passport_number || '',
            passportPlaceOfIssue: parsed.step2_applicant_details?.passportPlaceOfIssue || 'DHAKA',
            passportDateOfIssue: parsed.step2_applicant_details?.passportDateOfIssue || '',
            passportDateOfExpiry: parsed.step2_applicant_details?.passportDateOfExpiry || '',

            // Family & Address (Step 3)
            fatherName: parsed.step3_family_address?.fatherName || '',
            fatherNationality: parsed.step3_family_address?.fatherNationality || 'BGD',
            fatherBirthPlace: parsed.step3_family_address?.fatherBirthPlace || '',
            motherName: parsed.step3_family_address?.motherName || '',
            motherNationality: parsed.step3_family_address?.motherNationality || 'BGD',
            motherBirthPlace: parsed.step3_family_address?.motherBirthPlace || '',
            maritalStatus: parsed.step3_family_address?.maritalStatus || 'SINGLE',
            spouseName: parsed.step3_family_address?.spouseName || '',
            presentAddressLine1: parsed.step3_family_address?.presentAddressLine1 || '',
            presentCity: parsed.step3_family_address?.presentCity || '',
            presentStateDistrict: parsed.step3_family_address?.presentStateDistrict || '',
            postalCode: parsed.step3_family_address?.postalCode || '',
            phone: parsed.step3_family_address?.phone || '',
            occupation: parsed.step3_family_address?.occupation || 'PRIVATE SERVICE',
            employerName: parsed.step3_family_address?.employerName || '',
            designation: parsed.step3_family_address?.designation || '',
            employerAddress: parsed.step3_family_address?.employerAddress || '',
            employerPhone: parsed.step3_family_address?.employerPhone || '',

            // Travel & References (Step 4 & 8)
            placesToBeVisited1: parsed.step4_visa_references?.placesToBeVisited1 || 'KOLKATA',
            placesToBeVisited2: parsed.step4_visa_references?.placesToBeVisited2 || '',
            portOfArrival: parsed.step4_visa_references?.portOfArrival || 'BY AIR/ HARIDASPUR',
            portOfExit: parsed.step4_visa_references?.portOfExit || 'BY AIR/ HARIDASPUR',
            referenceNameIndia: parsed.step4_visa_references?.referenceNameIndia || parsed.step8_stay_details?.hotelName || '',
            referenceAddressIndia: parsed.step4_visa_references?.referenceAddressIndia || parsed.step8_stay_details?.hotelAddress || '',
            referencePhoneIndia: parsed.step4_visa_references?.referencePhoneIndia || parsed.step8_stay_details?.hotelPhone || '',
            referenceNameBangladesh: parsed.step4_visa_references?.referenceNameBangladesh || '',
            referenceAddressBangladesh: parsed.step4_visa_references?.referenceAddressBangladesh || '',
            referencePhoneBangladesh: parsed.step4_visa_references?.referencePhoneBangladesh || '',
          });
        }
      })
      .catch((err) => {
        setLocalAlert({
          variant: 'destructive',
          message: err.message || 'Error loading application data',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, applicationId]);

  if (!isOpen || !applicationId) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const constructUpdatedPayload = () => {
    const updated = JSON.parse(JSON.stringify(rawFormData));

    // Step 2
    updated.step2_applicant_details = {
      ...(updated.step2_applicant_details || {}),
      givenName: formData.givenName?.toUpperCase().trim(),
      surname: formData.surname?.toUpperCase().trim(),
      gender: formData.gender,
      birthCity: formData.birthCity?.toUpperCase().trim(),
      birthCountry: formData.birthCountry || 'BGD',
      religion: formData.religion,
      nationalIdNumber: formData.nationalIdNumber?.trim() || 'NA',
      visibleIdentificationMarks: formData.visibleIdentificationMarks?.trim() || 'NA',
      educationalQualification: formData.educationalQualification,
      passportNumber: formData.passportNumber?.toUpperCase().trim(),
      passportPlaceOfIssue: formData.passportPlaceOfIssue?.toUpperCase().trim() || 'DHAKA',
      passportDateOfIssue: formData.passportDateOfIssue?.trim(),
      passportDateOfExpiry: formData.passportDateOfExpiry?.trim(),
    };

    // Step 3
    updated.step3_family_address = {
      ...(updated.step3_family_address || {}),
      fatherName: formData.fatherName?.toUpperCase().trim(),
      fatherNationality: formData.fatherNationality || 'BGD',
      fatherBirthPlace: formData.fatherBirthPlace?.toUpperCase().trim(),
      motherName: formData.motherName?.toUpperCase().trim(),
      motherNationality: formData.motherNationality || 'BGD',
      motherBirthPlace: formData.motherBirthPlace?.toUpperCase().trim(),
      maritalStatus: formData.maritalStatus,
      spouseName: formData.spouseName ? formData.spouseName.toUpperCase().trim() : undefined,
      presentAddressLine1: formData.presentAddressLine1?.trim(),
      presentCity: formData.presentCity?.toUpperCase().trim(),
      presentStateDistrict: formData.presentStateDistrict?.toUpperCase().trim(),
      postalCode: formData.postalCode?.trim(),
      phone: formData.phone?.trim(),
      occupation: formData.occupation,
      employerName: formData.employerName?.toUpperCase().trim(),
      designation: formData.designation ? formData.designation.toUpperCase().trim() : '',
      employerAddress: formData.employerAddress?.trim(),
      employerPhone: formData.employerPhone?.trim() || '',
    };

    // Step 4
    updated.step4_visa_references = {
      ...(updated.step4_visa_references || {}),
      placesToBeVisited1: formData.placesToBeVisited1?.toUpperCase().trim() || 'KOLKATA',
      placesToBeVisited2: formData.placesToBeVisited2 ? formData.placesToBeVisited2.toUpperCase().trim() : undefined,
      portOfArrival: formData.portOfArrival || 'BY AIR/ HARIDASPUR',
      portOfExit: formData.portOfExit || 'BY AIR/ HARIDASPUR',
      referenceNameIndia: formData.referenceNameIndia?.toUpperCase().trim(),
      referenceAddressIndia: formData.referenceAddressIndia?.trim(),
      referencePhoneIndia: formData.referencePhoneIndia?.trim(),
      referenceNameBangladesh: formData.referenceNameBangladesh?.toUpperCase().trim(),
      referenceAddressBangladesh: formData.referenceAddressBangladesh?.trim(),
      referencePhoneBangladesh: formData.referencePhoneBangladesh?.trim(),
    };

    // Step 8 (Keep in sync with reference India / Hotel)
    updated.step8_stay_details = {
      hotelName: formData.referenceNameIndia?.toUpperCase().trim() || 'HOTEL',
      hotelAddress: formData.referenceAddressIndia?.trim() || 'KOLKATA',
      hotelState: 'WEST BENGAL',
      hotelCity: 'KOLKATA',
      hotelPhone: formData.referencePhoneIndia?.trim() || '9876543210',
    };

    const applicantFullName = `${formData.givenName} ${formData.surname}`.trim().toUpperCase();

    return {
      formData: updated,
      applicantName: applicantFullName,
      passportNumber: formData.passportNumber?.toUpperCase().trim(),
      resetError: true,
    };
  };

  const handleSaveOnly = async () => {
    setSaving(true);
    setLocalAlert(null);
    try {
      const payload = constructUpdatedPayload();
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save application');
      }

      setLocalAlert({
        variant: 'success',
        message: isBn
          ? 'আবেদনের সংশোধিত তথ্য সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে।'
          : 'Application details updated and saved successfully.',
      });
      showToast(
        isBn ? 'তথ্য সফলভাবে সংরক্ষিত হয়েছে' : 'Information saved successfully',
        'success'
      );
      onSaved();
    } catch (err: unknown) {
      setLocalAlert({
        variant: 'destructive',
        message: err instanceof Error ? err.message : 'Error saving changes',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndResume = async () => {
    setResuming(true);
    setLocalAlert(null);
    try {
      // 1. Save updated details
      const payload = constructUpdatedPayload();
      const saveRes = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || 'Failed to save updated changes before resume');
      }

      // 2. Trigger Resume Automation (executes from Step 2 onwards)
      const resumeRes = await fetch(`/api/applications/${applicationId}/resume`, {
        method: 'POST',
      });
      const resumeData = await resumeRes.json();
      if (!resumeRes.ok || !resumeData.success) {
        throw new Error(resumeData.message || resumeData.error || 'Failed to trigger resume');
      }

      showToast(
        isBn
          ? `ধাপ ২ থেকে রিজিউম প্রক্রিয়া শুরু হয়েছে (Temp ID: ${appMeta?.tempId})`
          : `Resume automation started from Step 2 (Temp ID: ${appMeta?.tempId})`,
        'success'
      );

      onSaved();
      onClose();
      onResumeStarted(applicationId);
    } catch (err: unknown) {
      setLocalAlert({
        variant: 'destructive',
        message: err instanceof Error ? err.message : 'Failed to save and resume',
      });
    } finally {
      setResuming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-black font-bangla">
                {isBn ? 'আবেদনের তথ্য পরিবর্তন ও রিজিউম' : 'Edit Application & Resume Run'}
              </h2>
              {appMeta?.tempId && (
                <Badge variant="outline" className="font-mono text-[10px] bg-white border-zinc-300 font-bold text-zinc-700">
                  Temp ID: {appMeta.tempId}
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-bangla mt-0.5">
              {isBn
                ? 'প্রথম ধাপ সম্পন্ন হওয়ায় পোর্টাল থেকে ধাপ ২ (BasicDetails) থেকে সরাসরি রিজিউম করা হবে।'
                : 'Since Step 1 is passed, the runner will resume directly from Step 2 (BasicDetails).'}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200/60"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Failure Notice / Local Alert */}
        <div className="px-5 pt-4 space-y-2">
          {appMeta?.failureReason && (
            <Alert variant="destructive" className="border-rose-300 bg-rose-50/90 text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <div>
                <AlertTitle>
                  {isBn
                    ? `ধাপ ${appMeta.failedStep || appMeta.currentStep}-এ ত্রুটি দেখা দিয়েছিল`
                    : `Previous Execution Error at Step ${appMeta.failedStep || appMeta.currentStep}`}
                </AlertTitle>
                <AlertDescription className="mt-1">
                  <span className="font-mono text-[11px] block bg-white/70 p-1.5 rounded border border-rose-200 mb-1">
                    {appMeta.failureReason}
                  </span>
                  <span>
                    {isBn
                      ? 'নিচের ফর্ম থেকে প্রয়োজনীয় ভুল তথ্য সংশোধন করে "সংরক্ষণ ও রিজিউম রান" বাটনে চাপ দিন।'
                      : 'You can correct any erroneous fields below and resume directly from Step 2.'}
                  </span>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {localAlert && (
            <Alert variant={localAlert.variant}>
              {localAlert.variant === 'destructive' && <AlertCircle className="w-4 h-4" />}
              {localAlert.variant === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {localAlert.variant === 'warning' && <ShieldAlert className="w-4 h-4" />}
              <div>
                <AlertTitle>{localAlert.variant === 'success' ? 'সফল' : 'বিজ্ঞপ্তি'}</AlertTitle>
                <AlertDescription>{localAlert.message}</AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'personal' ? 'bg-white text-black shadow-xs font-bold' : 'text-zinc-500 hover:text-black'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isBn ? 'ব্যক্তিগত ও পাসপোর্ট (ধাপ ২)' : 'Personal & Passport'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('family')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'family' ? 'bg-white text-black shadow-xs font-bold' : 'text-zinc-500 hover:text-black'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isBn ? 'পারিবারিক ও ঠিকানা (ধাপ ৩)' : 'Family & Address'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('travel')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'travel' ? 'bg-white text-black shadow-xs font-bold' : 'text-zinc-500 hover:text-black'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isBn ? 'ভ্রমণ ও রেফারেন্স (ধাপ ৪/৮)' : 'Travel & References'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-zinc-500">
              <RefreshCw className="w-6 h-6 animate-spin text-black" />
              <span>{isBn ? 'আবেদনের তথ্য লোড হচ্ছে...' : 'Loading application details...'}</span>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* TAB 1: Personal & Passport */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'প্রদত্ত নাম (Given Name)' : 'Given Name'}</Label>
                      <Input
                        value={formData.givenName || ''}
                        onChange={(e) => handleChange('givenName', e.target.value)}
                        placeholder="e.g. MOHAMMAD"
                        className="font-mono uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'বংশনাম / পদবী (Surname)' : 'Surname'}</Label>
                      <Input
                        value={formData.surname || ''}
                        onChange={(e) => handleChange('surname', e.target.value)}
                        placeholder="e.g. RAHMAN"
                        className="font-mono uppercase text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'লিঙ্গ (Gender)' : 'Gender'}</Label>
                      <select
                        value={formData.gender || 'M'}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium"
                      >
                        <option value="M">Male (পুরুষ)</option>
                        <option value="F">Female (নারী)</option>
                        <option value="X">Transgender / Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'জন্ম শহর (Birth City)' : 'Birth City'}</Label>
                      <Input
                        value={formData.birthCity || ''}
                        onChange={(e) => handleChange('birthCity', e.target.value)}
                        placeholder="e.g. DHAKA"
                        className="uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'ধর্ম (Religion)' : 'Religion'}</Label>
                      <select
                        value={formData.religion || 'ISLAM'}
                        onChange={(e) => handleChange('religion', e.target.value)}
                        className="w-full h-9 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium"
                      >
                        <option value="ISLAM">ISLAM</option>
                        <option value="HINDU">HINDU</option>
                        <option value="BUDDHISM">BUDDHISM</option>
                        <option value="CHRISTIAN">CHRISTIAN</option>
                        <option value="OTHERS">OTHERS</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'জাতীয় পরিচয়পত্র নম্বর (NID)' : 'National ID Number'}</Label>
                      <Input
                        value={formData.nationalIdNumber || ''}
                        onChange={(e) => handleChange('nationalIdNumber', e.target.value)}
                        placeholder="NID or NA"
                        className="font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'শনাক্তকরণ চিহ্ন' : 'Visible Identification Mark'}</Label>
                      <Input
                        value={formData.visibleIdentificationMarks || ''}
                        onChange={(e) => handleChange('visibleIdentificationMarks', e.target.value)}
                        placeholder="e.g. MOLE ON FOREHEAD or NA"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                    <div className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'পাসপোর্ট সংক্রান্ত বিবরণ' : 'Passport Information'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'পাসপোর্ট নম্বর' : 'Passport No'}</Label>
                        <Input
                          value={formData.passportNumber || ''}
                          onChange={(e) => handleChange('passportNumber', e.target.value)}
                          placeholder="e.g. A17601265"
                          className="font-mono uppercase font-bold text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'ইস্যুর তারিখ (DD/MM/YYYY)' : 'Issue Date'}</Label>
                        <Input
                          value={formData.passportDateOfIssue || ''}
                          onChange={(e) => handleChange('passportDateOfIssue', e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="font-mono text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'মেয়াদোত্তীর্ণের তারিখ (DD/MM/YYYY)' : 'Expiry Date'}</Label>
                        <Input
                          value={formData.passportDateOfExpiry || ''}
                          onChange={(e) => handleChange('passportDateOfExpiry', e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="font-mono text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Family & Address */}
              {activeTab === 'family' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'পিতার পুরো নাম' : 'Father’s Full Name'}</Label>
                      <Input
                        value={formData.fatherName || ''}
                        onChange={(e) => handleChange('fatherName', e.target.value)}
                        placeholder="e.g. MD ABDUR RAHIM"
                        className="uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'পিতার জন্মস্থান' : 'Father’s Birth Place'}</Label>
                      <Input
                        value={formData.fatherBirthPlace || ''}
                        onChange={(e) => handleChange('fatherBirthPlace', e.target.value)}
                        placeholder="e.g. DHAKA"
                        className="uppercase text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'মাতার পুরো নাম' : 'Mother’s Full Name'}</Label>
                      <Input
                        value={formData.motherName || ''}
                        onChange={(e) => handleChange('motherName', e.target.value)}
                        placeholder="e.g. FATEMA BEGUM"
                        className="uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'মাতার জন্মস্থান' : 'Mother’s Birth Place'}</Label>
                      <Input
                        value={formData.motherBirthPlace || ''}
                        onChange={(e) => handleChange('motherBirthPlace', e.target.value)}
                        placeholder="e.g. CHITTAGONG"
                        className="uppercase text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                    <div className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isBn ? 'বর্তমান ঠিকানা (ইউটিলিটি বিলের সাথে মিল আবশ্যক)' : 'Present Address'}</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600">{isBn ? 'ঠিকানার ১ম লাইন (House/Road/Area)' : 'Address Line 1'}</Label>
                      <Input
                        value={formData.presentAddressLine1 || ''}
                        onChange={(e) => handleChange('presentAddressLine1', e.target.value)}
                        placeholder="e.g. House 12, Road 4, Sector 7"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'শহর (City)' : 'City'}</Label>
                        <Input
                          value={formData.presentCity || ''}
                          onChange={(e) => handleChange('presentCity', e.target.value)}
                          placeholder="e.g. DHAKA"
                          className="uppercase text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'জেলা (District)' : 'District'}</Label>
                        <Input
                          value={formData.presentStateDistrict || ''}
                          onChange={(e) => handleChange('presentStateDistrict', e.target.value)}
                          placeholder="e.g. DHAKA"
                          className="uppercase text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'পোস্ট কোড' : 'Postal Code'}</Label>
                        <Input
                          value={formData.postalCode || ''}
                          onChange={(e) => handleChange('postalCode', e.target.value)}
                          placeholder="e.g. 1230"
                          className="font-mono text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'পেশা (Occupation)' : 'Occupation'}</Label>
                      <Input
                        value={formData.occupation || ''}
                        onChange={(e) => handleChange('occupation', e.target.value)}
                        placeholder="e.g. PRIVATE SERVICE"
                        className="uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'পদবি (Designation)' : 'Designation'}</Label>
                      <Input
                        value={formData.designation || ''}
                        onChange={(e) => handleChange('designation', e.target.value)}
                        placeholder="e.g. WEB DEVELOPER"
                        className="uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'প্রতিষ্ঠান / কোম্পানির নাম' : 'Employer / Business Name'}</Label>
                      <Input
                        value={formData.employerName || ''}
                        onChange={(e) => handleChange('employerName', e.target.value)}
                        placeholder="e.g. ABC TECH LTD"
                        className="uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'প্রতিষ্ঠানের ঠিকানা' : 'Employer Address'}</Label>
                      <Input
                        value={formData.employerAddress || ''}
                        onChange={(e) => handleChange('employerAddress', e.target.value)}
                        placeholder="e.g. MIRPUR DOHS, DHAKA"
                        className="uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'প্রতিষ্ঠানের ফোন' : 'Employer Phone'}</Label>
                      <Input
                        value={formData.employerPhone || ''}
                        onChange={(e) => handleChange('employerPhone', e.target.value)}
                        placeholder="e.g. 01322901105"
                        className="text-xs h-9 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Travel & References */}
              {activeTab === 'travel' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'ভ্রমণস্থল ১ (Place to Visit 1)' : 'Place to Visit 1'}</Label>
                      <Input
                        value={formData.placesToBeVisited1 || ''}
                        onChange={(e) => handleChange('placesToBeVisited1', e.target.value)}
                        placeholder="e.g. KOLKATA"
                        className="uppercase text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600 font-semibold">{isBn ? 'ভ্রমণস্থল ২ (ঐচ্ছিক)' : 'Place to Visit 2'}</Label>
                      <Input
                        value={formData.placesToBeVisited2 || ''}
                        onChange={(e) => handleChange('placesToBeVisited2', e.target.value)}
                        placeholder="e.g. DELHI or AGRA"
                        className="uppercase text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                    <div className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isBn ? 'ভারতে রেফারেন্স অথবা হোটেল' : 'Reference or Hotel in India'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'হোটেল / রেফারেন্সের নাম' : 'Hotel or Person Name'}</Label>
                        <Input
                          value={formData.referenceNameIndia || ''}
                          onChange={(e) => handleChange('referenceNameIndia', e.target.value)}
                          placeholder="e.g. HOTEL LINDSAY"
                          className="uppercase text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'হোটেল / রেফারেন্সের ফোন নম্বর' : 'Phone in India'}</Label>
                        <Input
                          value={formData.referencePhoneIndia || ''}
                          onChange={(e) => handleChange('referencePhoneIndia', e.target.value)}
                          placeholder="e.g. 9831000000"
                          className="font-mono text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600">{isBn ? 'হোটেল / রেফারেন্সের ঠিকানা' : 'Address in India'}</Label>
                      <Input
                        value={formData.referenceAddressIndia || ''}
                        onChange={(e) => handleChange('referenceAddressIndia', e.target.value)}
                        placeholder="e.g. 8A LINDSAY STREET, NEW MARKET, KOLKATA"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                    <div className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'বাংলাদেশে জরুরি যোগাযোগের রেফারেন্স' : 'Emergency Reference in Bangladesh'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'রেফারেন্স ব্যক্তির নাম' : 'Reference Person Name'}</Label>
                        <Input
                          value={formData.referenceNameBangladesh || ''}
                          onChange={(e) => handleChange('referenceNameBangladesh', e.target.value)}
                          placeholder="e.g. KAMAL HOSSAIN"
                          className="uppercase text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-zinc-600">{isBn ? 'রেফারেন্স ফোন নম্বর' : 'Reference Phone'}</Label>
                        <Input
                          value={formData.referencePhoneBangladesh || ''}
                          onChange={(e) => handleChange('referencePhoneBangladesh', e.target.value)}
                          placeholder="e.g. 01711000000"
                          className="font-mono text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-zinc-600">{isBn ? 'রেফারেন্সের ঠিকানা' : 'Reference Address'}</Label>
                      <Input
                        value={formData.referenceAddressBangladesh || ''}
                        onChange={(e) => handleChange('referenceAddressBangladesh', e.target.value)}
                        placeholder="e.g. MIRPUR-10, DHAKA"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>{isBn ? 'রিজিউম করলে স্বয়ংক্রিয়ভাবে ধাপ ২ থেকে শুরু হবে' : 'Resume runs from Step 2 onwards'}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving || resuming}
              onClick={handleSaveOnly}
              className="flex-1 sm:flex-none text-xs rounded-xl border-zinc-300 font-bold"
            >
              <Save className={`w-3.5 h-3.5 mr-1 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'শুধু তথ্য সেভ করুন' : 'Save Changes')}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={saving || resuming}
              onClick={handleSaveAndResume}
              className="flex-1 sm:flex-none text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            >
              <Play className={`w-3.5 h-3.5 mr-1 fill-white ${resuming ? 'animate-spin' : ''}`} />
              <span>
                {resuming
                  ? (isBn ? 'রিজিউম শুরু হচ্ছে...' : 'Resuming...')
                  : (isBn ? 'সংরক্ষণ ও রিজিউম রান (ধাপ ২)' : 'Save & Resume (Step 2)')}
              </span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
