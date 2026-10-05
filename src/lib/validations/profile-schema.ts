import { z } from 'zod';

const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
const PASSPORT_REGEX = /^[A-Z0-9]{7,9}$/i;
const BD_PHONE_REGEX = /^(?:\+?880|0)?1[3-9]\d{8}$/;

const isPastDate = (val: string): boolean => {
  const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// ----------------------------------------------------
// STEP 1: Registration Schema
// ----------------------------------------------------
export const step1RegistrationSchema = z.object({
  countryApplyingFrom: z.string().default('BGD'),
  indianMission: z.enum(['BGDD', 'BGDC', 'BGDK', 'BGDR', 'BGDS'], {
    error: 'Please select an Indian Mission (IVAC center)',
  }),
  nationality: z.string().default('BGD'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(DATE_REGEX, 'Format must be DD/MM/YYYY (e.g. 12/09/1998)'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Valid email address required'),
  reEnterEmail: z.string().optional().default(''),
  expectedDateOfArrival: z
    .string()
    .min(1, 'Expected arrival date is required')
    .regex(DATE_REGEX, 'Format must be DD/MM/YYYY (e.g. 28/11/2026)')
    .refine((val) => !isPastDate(val), {
      message: 'Expected arrival date cannot be a past date',
    }),
  visaPurpose: z.string().min(1, 'Please select a visa purpose (e.g. 544 Tourist)'),
  captcha: z.string().optional(),
});

// ----------------------------------------------------
// STEP 2: Applicant Details Schema
// ----------------------------------------------------
export const step2ApplicantDetailsSchema = z
  .object({
    surname: z
      .string()
      .min(1, 'Surname is required (e.g. CHOWDHURY)')
      .max(50, 'Surname exceeds 50 characters'),
    givenName: z
      .string()
      .min(1, 'Given name is required (e.g. TAREK HASAN)')
      .max(50, 'Given name exceeds 50 characters'),
    hasChangedName: z.boolean().optional().default(false),
    previousSurname: z.string().optional(),
    previousGivenName: z.string().optional(),
    gender: z.enum(['M', 'F', 'X'], {
      error: 'Please select gender (M/F/X)',
    }),
    birthCity: z.string().min(1, 'Birth city / town is required (e.g. DHAKA)'),
    birthCountry: z.string().optional().default('BGD'),
    nationalIdNumber: z
      .string()
      .min(1, 'National ID is required (Enter "NA" if not applicable)'),
    religion: z.string().min(1, 'Please select religion'),
    religionOther: z.string().optional(),
    visibleIdentificationMarks: z.string().optional().default(''),
    educationalQualification: z
      .string()
      .min(1, 'Educational qualification is required'),
    nationalityAcquiredBy: z
      .enum(['BY BIRTH', 'NATURALIZATION'])
      .default('BY BIRTH'),
    previousNationality: z.string().optional(),

    // Passport Details
    passportNumber: z
      .string()
      .min(1, 'Passport number is required')
      .regex(PASSPORT_REGEX, 'Passport must be 7-9 alphanumeric characters (e.g. B09871234)'),
    passportPlaceOfIssue: z
      .string()
      .optional()
      .default('DHAKA'),
    passportDateOfIssue: z
      .string()
      .min(1, 'Issue date is required')
      .regex(DATE_REGEX, 'Format must be DD/MM/YYYY (e.g. 15/03/2022)'),
    passportDateOfExpiry: z
      .string()
      .min(1, 'Expiry date is required')
      .regex(DATE_REGEX, 'Format must be DD/MM/YYYY (e.g. 14/03/2032)'),
    hasOtherPassport: z.boolean().optional().default(false),
    otherPassportCountry: z.string().optional(),
    otherPassportNumber: z.string().optional(),
    otherPassportDateOfIssue: z.string().optional(),
    otherPassportPlaceOfIssue: z.string().optional(),
    otherPassportNationality: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasChangedName) {
      if (!data.previousGivenName || data.previousGivenName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousGivenName'],
          message: 'Previous given name is mandatory when name change is selected',
        });
      }
      if (!data.previousSurname || data.previousSurname.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousSurname'],
          message: 'Previous surname is mandatory when name change is selected',
        });
      }
    }

    if (data.hasOtherPassport) {
      if (!data.otherPassportCountry || data.otherPassportCountry.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherPassportCountry'],
          message: 'Country of issue is mandatory',
        });
      }
      if (!data.otherPassportNumber || data.otherPassportNumber.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherPassportNumber'],
          message: 'Passport/IC number is mandatory',
        });
      }
      if (!data.otherPassportDateOfIssue || data.otherPassportDateOfIssue.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherPassportDateOfIssue'],
          message: 'Date of issue is mandatory (DD/MM/YYYY)',
        });
      } else if (!DATE_REGEX.test(data.otherPassportDateOfIssue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherPassportDateOfIssue'],
          message: 'Format must be DD/MM/YYYY (e.g. 15/03/2020)',
        });
      }
      if (!data.otherPassportPlaceOfIssue || data.otherPassportPlaceOfIssue.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherPassportPlaceOfIssue'],
          message: 'Place of issue is mandatory (e.g. DHAKA)',
        });
      }
      if (!data.otherPassportNationality || data.otherPassportNationality.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otherPassportNationality'],
          message: 'Nationality is mandatory',
        });
      }
    }
  });

// ----------------------------------------------------
// STEP 3: Family Details & Address Schema
// ----------------------------------------------------
export const step3FamilyAddressSchema = z
  .object({
    presentAddressLine1: z
      .string()
      .min(1, 'Present address is required')
      .max(35, 'Address line cannot exceed 35 characters per portal rules'),
    presentCity: z.string().optional().default(''),
    presentCountry: z.string().optional().default('BGD'),
    presentStateDistrict: z.string().optional().default(''),
    postalCode: z.string().optional().default(''),
    phone: z
      .string()
      .min(1, 'Phone / Mobile number is required')
      .regex(BD_PHONE_REGEX, 'Valid Bangladeshi mobile number required (e.g. 01819234567)'),
    mobileIsdCode: z.string().optional().default('880'),
    mobile: z.string().optional().default(''),
    sameAddress: z.boolean().default(true),

    permanentAddressLine1: z.string().max(35).optional(),
    permanentCity: z.string().optional(),
    permanentStateDistrict: z.string().optional(),

    fatherName: z.string().min(1, "Father's name is required"),
    fatherNationality: z.string().optional().default('BGD'),
    fatherPreviousNationality: z.string().optional(),
    fatherBirthPlace: z.string().optional().default(''),
    fatherCountryOfBirth: z.string().optional().default('BGD'),

    motherName: z.string().min(1, "Mother's name is required"),
    motherNationality: z.string().optional().default('BGD'),
    motherPreviousNationality: z.string().optional(),
    motherBirthPlace: z.string().optional().default(''),
    motherCountryOfBirth: z.string().optional().default('BGD'),

    maritalStatus: z.enum(['SINGLE', 'MARRIED'], { error: 'Please select marital status' }),
    spouseName: z.string().optional(),
    spouseNationality: z.string().optional(),
    spouseBirthPlace: z.string().optional(),
    spouseCountryOfBirth: z.string().optional(),

    grandparentsPakistanOrigin: z.boolean().default(false),
    grandparentsPakistanDetails: z.string().optional(),

    occupation: z.string().min(1, 'Please select current occupation'),
    pastOccupation: z.string().nullable().optional(),
    employerName: z.string().min(1, 'Employer / College / Company name is required'),
    designation: z.string().optional().default(''),
    employerAddress: z
      .string()
      .max(50, 'Employer address can contain maximum 50 characters')
      .refine(
        (val) => !val || !val.includes('.'),
        'Dots/periods (.) are not allowed by the portal. Use commas or spaces instead.'
      )
      .refine(
        (val) => !val || /^[0-9a-zA-Z\s/,\-#]+$/.test(val),
        'Enter Alphanumeric characters / # , or - only'
      )
      .optional()
      .default(''),
    employerPhone: z.string().optional().default(''),
    previousOrganizationMilitary: z.boolean().default(false),
    previousOrganizationName: z.string().optional(),
    previousDesignation: z.string().optional(),
    previousRank: z.string().optional(),
    previousPosting: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // 1. Permanent Address is mandatory if not same as present address
    if (!data.sameAddress) {
      if (!data.permanentAddressLine1 || data.permanentAddressLine1.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permanentAddressLine1'],
          message: 'Permanent house/street address is mandatory',
        });
      }
      if (!data.permanentCity || data.permanentCity.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permanentCity'],
          message: 'Permanent city is mandatory',
        });
      }
      if (!data.permanentStateDistrict || data.permanentStateDistrict.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permanentStateDistrict'],
          message: 'Permanent district is mandatory',
        });
      }
    }

    // 2. Spouse details are mandatory if married
    if (data.maritalStatus === 'MARRIED') {
      if (!data.spouseName || data.spouseName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['spouseName'],
          message: 'Spouse name is mandatory when married',
        });
      }
      if (!data.spouseBirthPlace || data.spouseBirthPlace.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['spouseBirthPlace'],
          message: 'Spouse birth place is mandatory when married',
        });
      }
      if (!data.spouseNationality || data.spouseNationality.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['spouseNationality'],
          message: 'Spouse nationality is mandatory when married',
        });
      }
    }

    // 3. Grandparents Pakistan origin details mandatory if checked
    if (data.grandparentsPakistanOrigin) {
      if (!data.grandparentsPakistanDetails || data.grandparentsPakistanDetails.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['grandparentsPakistanDetails'],
          message: 'Details of Pakistan origin/held area are mandatory',
        });
      }
    }

    // 4. Military / Police organization details mandatory if checked
    if (data.previousOrganizationMilitary) {
      if (!data.previousOrganizationName || data.previousOrganizationName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousOrganizationName'],
          message: 'Organization name is mandatory',
        });
      }
      if (!data.previousDesignation || data.previousDesignation.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousDesignation'],
          message: 'Designation is mandatory',
        });
      }
      if (!data.previousRank || data.previousRank.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousRank'],
          message: 'Rank is mandatory',
        });
      }
      if (!data.previousPosting || data.previousPosting.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousPosting'],
          message: 'Place of posting is mandatory',
        });
      }
    }
  });

// ----------------------------------------------------
// STEP 4: Visa Sought & References Schema
// ----------------------------------------------------
export const saarcCountryVisitSchema = z.object({
  country: z.string().min(1, 'Please select a SAARC country'),
  year: z.string().min(1, 'Please select visit year'),
  visitCount: z.string().min(1, 'Enter number of visits (e.g. 1)'),
});

export const step4VisaReferencesSchema = z
  .object({
    placesToBeVisited1: z
      .string()
      .min(1, 'Primary visiting place is required (e.g. KOLKATA)'),
    placesToBeVisited2: z
      .string()
      .min(1, 'Other places to be visited is required (comma separated, e.g. DELHI, JAIPUR)'),
    durationMonths: z.coerce.number().min(1, 'Duration in months is required').max(12, 'Maximum duration is 12 months'),
    numberOfEntries: z.enum(['1', '2', '3', '4'], { error: 'Please select number of entries' }),
    portOfArrival: z.string().min(1, 'Port of arrival is required'),
    portOfExit: z.string().min(1, 'Port of exit is required'),

    everVisitedIndiaBefore: z.boolean().default(false),
    previousAddressLine1: z.string().max(35, 'Address line 1 cannot exceed 35 characters').optional().default(''),
    previousAddressLine2: z.string().max(35, 'Address line 2 cannot exceed 35 characters').optional().default(''),
    previousAddressLine3: z.string().max(35, 'Address line 3 cannot exceed 35 characters').optional().default(''),
    previousVisitAddress1: z.string().optional(),
    previousVisitCity: z.string().optional(),
    previousVisaNumber: z.string().optional(),
    previousVisaType: z.string().optional(),
    previousVisaIssuePlace: z.string().optional(),
    previousVisaIssueDate: z.string().optional(),
    permissionRefused: z.boolean().default(false),
    permissionRefusedDetails: z.string().optional(),

    countriesVisitedLast10Years: z.string().optional().default(''),
    visitedSaarcCountriesLast3Years: z.boolean().default(false),
    saarcCountryVisits: z.array(saarcCountryVisitSchema).optional().default([]),

    referenceNameIndia: z.string().min(1, 'India reference / Hotel name is required'),
    referenceAddressIndia: z.string().optional().default(''),
    referenceAddressIndiaLine1: z.string().min(1, 'Address line 1 is required').max(200, 'Cannot exceed 200 characters').default(''),
    referenceAddressIndiaLine2: z.string().max(200, 'Cannot exceed 200 characters').optional().default(''),
    referenceStateIndia: z.string().min(1, 'India reference state is required (e.g. WEST BENGAL)'),
    referenceDistrictIndia: z.string().min(1, 'India reference district is required (e.g. KOLKATA)'),
    referencePhoneIndia: z.string().min(1, 'India reference phone is required'),

    referenceNameBangladesh: z.string().min(1, 'Bangladesh emergency contact name is required'),
    referenceAddressBangladesh: z.string().optional().default(''),
    referenceAddressBangladeshLine1: z.string().min(1, 'Address line 1 is required').max(35, 'Cannot exceed 35 characters').default(''),
    referenceAddressBangladeshLine2: z.string().max(35, 'Cannot exceed 35 characters').optional().default(''),
    referencePhoneBangladesh: z.string().min(1, 'Bangladesh emergency contact mobile is required'),
  })
  .superRefine((data, ctx) => {
    // 1. If visited India before, previous details are strictly mandatory
    if (data.everVisitedIndiaBefore) {
      const line1 = (data.previousAddressLine1 || data.previousVisitAddress1 || '').trim();
      if (!line1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousAddressLine1'],
          message: 'Previous address in India (Line 1) is mandatory (max 35 chars)',
        });
      }
      if (!data.previousVisitCity || data.previousVisitCity.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousVisitCity'],
          message: 'Cities visited in India (comma separated) is mandatory',
        });
      }
      if (!data.previousVisaNumber || data.previousVisaNumber.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousVisaNumber'],
          message: 'Last Indian visa number is mandatory',
        });
      }
      if (!data.previousVisaType || data.previousVisaType.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousVisaType'],
          message: 'Please select type of visa',
        });
      }
      if (!data.previousVisaIssuePlace || data.previousVisaIssuePlace.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousVisaIssuePlace'],
          message: 'Place of issue is mandatory',
        });
      }
      if (!data.previousVisaIssueDate || data.previousVisaIssueDate.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousVisaIssueDate'],
          message: 'Date of issue is mandatory (DD/MM/YYYY)',
        });
      } else if (!DATE_REGEX.test(data.previousVisaIssueDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['previousVisaIssueDate'],
          message: 'Format must be DD/MM/YYYY',
        });
      }
    }

    // 2. If permission refused, refusal details are strictly mandatory
    if (data.permissionRefused) {
      if (!data.permissionRefusedDetails || data.permissionRefusedDetails.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['permissionRefusedDetails'],
          message: 'Refusal details (Control No. and Date) are mandatory',
        });
      }
    }

    // 3. If visited SAARC countries in last 3 years, at least 1 visit entry is mandatory
    if (data.visitedSaarcCountriesLast3Years) {
      if (!data.saarcCountryVisits || data.saarcCountryVisits.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['saarcCountryVisits'],
          message: 'Please add at least one SAARC country visit detail',
        });
      } else {
        data.saarcCountryVisits.forEach((visit, idx) => {
          if (!visit.country || visit.country.trim().length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['saarcCountryVisits', idx, 'country'],
              message: 'Country is required',
            });
          }
          if (!visit.year || visit.year.trim().length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['saarcCountryVisits', idx, 'year'],
              message: 'Year is required',
            });
          }
          if (!visit.visitCount || visit.visitCount.trim().length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['saarcCountryVisits', idx, 'visitCount'],
              message: 'Visit count is required',
            });
          }
        });
      }
    }
  });

// ----------------------------------------------------
// STEP 5: Additional Questions Schema
// ----------------------------------------------------
export const step5AdditionalQuestionsSchema = z.object({
  arrestedOrConvicted: z.boolean().default(false),
  refusedEntryOrDeported: z.boolean().default(false),
  humanOrDrugTrafficking: z.boolean().default(false),
  cyberCrimeOrTerrorism: z.boolean().default(false),
  viewsJustifyingTerrorism: z.boolean().default(false),
  soughtAsylum: z.boolean().default(false),
});

// ----------------------------------------------------
// STEP 8: Stay Details Schema
// ----------------------------------------------------
export const step8StayDetailsSchema = z.object({
  hotelName: z.string().optional().default(''),
  address: z.string().optional().default(''),
  state: z.string().optional().default(''),
  district: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
});

// ----------------------------------------------------
// COMPLETE VISA APPLICANT PROFILE SCHEMA
// ----------------------------------------------------
export const visaApplicantProfileSchema = z.object({
  temporaryApplicationId: z.string().optional(),
  step1_registration: step1RegistrationSchema,
  step2_applicant_details: step2ApplicantDetailsSchema,
  step3_family_address: step3FamilyAddressSchema,
  step4_visa_references: step4VisaReferencesSchema,
  step5_additional_questions: step5AdditionalQuestionsSchema.optional(),
  photoFilePath: z.string().optional(),
  passportPdfPath: z.string().optional(),
  step8_stay_details: step8StayDetailsSchema.optional(),
  submitFinalApplication: z.boolean().optional().default(false),
});

export type VisaApplicantProfileValidated = z.infer<typeof visaApplicantProfileSchema>;
