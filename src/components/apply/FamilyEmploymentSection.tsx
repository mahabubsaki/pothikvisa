import { MapPin } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FieldError } from '@/components/form/FieldError';
import { cn } from '@/lib/utils';
import {
  COUNTRY_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  OCCUPATION_OPTIONS,
  PAST_OCCUPATION_OPTIONS,
} from '@/lib/profile-constants';
import type { OccupationCode, VisaApplicantProfile } from '@/types/profile';

export function FamilyEmploymentSection({ isBn }: { isBn: boolean }) {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext<VisaApplicantProfile>();
  const sameAddress = watch('step3_family_address.sameAddress');
  const maritalStatus = watch('step3_family_address.maritalStatus');
  const grandparentsPakistanOrigin = watch('step3_family_address.grandparentsPakistanOrigin');
  const previousOrganizationMilitary = watch('step3_family_address.previousOrganizationMilitary');

  return (
    <>
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

                {sameAddress === false && (
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

    </>
  );
}
