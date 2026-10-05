import { Lock, MapPin, User } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { DateSelector } from '@/components/ui/date-selector';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FieldError } from '@/components/form/FieldError';
import { cn } from '@/lib/utils';
import {
  COUNTRY_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  NATIONALITY_ACQUISITION_OPTIONS,
  RELIGION_OPTIONS,
} from '@/lib/profile-constants';
import type { VisaApplicantProfile } from '@/types/profile';

export function ApplicantPassportSection({ isBn }: { isBn: boolean }) {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext<VisaApplicantProfile>();
  const hasChangedName = watch('step2_applicant_details.hasChangedName');
  const nationalityAcquiredBy = watch('step2_applicant_details.nationalityAcquiredBy');
  const selectedReligion = watch('step2_applicant_details.religion');
  const hasOtherPassport = watch('step2_applicant_details.hasOtherPassport');

  return (
    <>
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

    </>
  );
}
