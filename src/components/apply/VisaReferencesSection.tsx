import { useEffect } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { DateSelector } from '@/components/ui/date-selector';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FieldError } from '@/components/form/FieldError';
import { cn } from '@/lib/utils';
import {
  DURATION_MONTHS_OPTIONS,
  INDIA_DISTRICTS_BY_STATE,
  INDIA_STATES_OPTIONS,
  NUMBER_OF_ENTRIES_OPTIONS,
  PORT_OPTIONS,
  PREVIOUS_VISA_TYPE_OPTIONS,
  SAARC_COUNTRY_OPTIONS,
  SAARC_YEAR_OPTIONS,
} from '@/lib/profile-constants';
import type { NumberOfEntriesCode, VisaApplicantProfile, VisaDurationMonths } from '@/types/profile';

export function VisaReferencesSection({ isBn }: { isBn: boolean }) {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext<VisaApplicantProfile>();
  const everVisitedIndiaBefore = watch('step4_visa_references.everVisitedIndiaBefore');
  const permissionRefused = watch('step4_visa_references.permissionRefused');
  const visitedSaarcCountriesLast3Years = watch('step4_visa_references.visitedSaarcCountriesLast3Years');
  const referenceStateIndia = watch('step4_visa_references.referenceStateIndia');
  const { fields: saarcFields, append: appendSaarc, remove: removeSaarc } = useFieldArray<any>({
    control,
    name: 'step4_visa_references.saarcCountryVisits',
  });

  useEffect(() => {
    if (visitedSaarcCountriesLast3Years && saarcFields.length === 0) {
      appendSaarc({ country: 'NPL', year: '2024', visitCount: '1' });
    }
  }, [visitedSaarcCountriesLast3Years, saarcFields.length, appendSaarc]);

  return (
    <>
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
                    ? 'অন্যান্য দর্শনীয় স্থানসমূহ  - Comma Separated'
                    : 'Other Places - Comma Separated '}
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

    </>
  );
}
