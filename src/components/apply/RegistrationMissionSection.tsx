import { Building } from 'lucide-react';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { DateSelector } from '@/components/ui/date-selector';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FieldError } from '@/components/form/FieldError';
import { cn } from '@/lib/utils';
import { INDIAN_MISSION_OPTIONS, VISA_PURPOSE_OPTIONS } from '@/lib/profile-constants';
import type { VisaApplicantProfile } from '@/types/profile';

interface RegistrationMissionSectionProps {
  isBn: boolean;
  control: Control<VisaApplicantProfile>;
  register: UseFormRegister<VisaApplicantProfile>;
  setValue: UseFormSetValue<VisaApplicantProfile>;
  errors: FieldErrors<VisaApplicantProfile>;
}

export function RegistrationMissionSection({
  isBn,
  control,
  register,
  setValue,
  errors,
}: RegistrationMissionSectionProps) {
  return (
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
              onChange: (event) => setValue('step1_registration.reEnterEmail', event.target.value),
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
              onChange: (event) => {
                const digits = event.target.value.replace(/\D/g, '');
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
  );
}
