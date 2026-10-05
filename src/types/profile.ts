export type IndianMissionCode =
  | "BGDD" // BANGLADESH-DHAKA
  | "BGDC" // BANGLADESH-CHITTAGONG
  | "BGDK" // BANGLADESH-KHULNA
  | "BGDR" // BANGLADESH-RAJSHAHI
  | "BGDS"; // BANGLADESH-SYLHET

export type VisaPurposeCode =
  | "544" // TOURIST VISA (T1) - Tourism, Recreation & Sightseeing
  | "508" // TOURIST VISA (T2) - Mountaineering Expeditions
  | "515" // MEDICAL VISA (MED1) - Medical Treatment for Patient
  | "516" // MEDICAL ATTENDANT VISA (MED2) - Medical Escort / Attendant
  | "537" // BUSINESS VISA (B1) - Commercial & Business Activities
  | "502" // BUSINESS VISA (B5) - Conference & Seminars
  | "538" // BUSINESS VISA (B2) - Sports Persons & Coaches
  | "539" // BUSINESS VISA (B3) - Cultural & Commercial Performances
  | "504" // BUSINESS VISA (PRS) - Permanent Residency Status for Foreign Investors
  | "503" // BUSINESS VISA (B6) - Film & Reality TV Shooting
  | "540" // STUDENT VISA (S1) - Higher Education & University
  | "243" // STUDENT VISA (S2) - School Education
  | "542" // STUDENT VISA (S4) - Research Scholar
  | "233" // TRANSIT VISA (TR) - Travel Through India
  | "532" // MISCELLANEOUS VISA (X3) - Double Entry (Bangladeshi Nationals)
  | "509" // MISCELLANEOUS VISA (X1) - Person of Indian Origin / Spouse
  | "510" // MISCELLANEOUS VISA (X2) - Charitable / Religious Work
  | "511" // MISCELLANEOUS VISA (X-Misc) - General Miscellaneous
  | "533" // WORK VISA (E1) - Employment & Corporate Transfer
  | "534" // WORK VISA (E2) - Employment in NGOs
  | "535" // WORK VISA (E3) - Missionary / Religious Worker
  | (string & {});

// ----------------------------------------------------
// STEP 1: Registration
// ----------------------------------------------------
export interface Step1RegistrationProfile {
  countryApplyingFrom: "BGD";
  indianMission: IndianMissionCode;
  nationality: string; // e.g. "BGD"
  dateOfBirth: string; // DD/MM/YYYY
  email: string;
  reEnterEmail: string;
  expectedDateOfArrival: string; // DD/MM/YYYY
  visaPurpose: VisaPurposeCode;
  captcha?: string;
}

// ----------------------------------------------------
// STEP 2: Applicant & Passport Details
// ----------------------------------------------------
export type GenderCode = "M" | "F" | "X";
export type NationalityAcquisition = "BY BIRTH" | "NATURALIZATION";
export type EducationLevel =
  | "BELOW MATRICULATION"
  | "MATRICULATION"
  | "HIGHER SECONDARY"
  | "GRADUATE"
  | "POST GRADUATE"
  | "PROFESSIONAL"
  | "ILLITERATE"
  | "NA BEING MINOR"
  | "OTHERS";

export type ReligionCode =
  | "BAHAI"
  | "BUDDHISM"
  | "CHRISTIAN"
  | "HINDU"
  | "ISLAM"
  | "JAINISM"
  | "JUDAISM"
  | "OTHERS"
  | "PARSI"
  | "SIKH";

export interface Step2ApplicantDetailsProfile {
  surname: string;
  givenName: string;
  hasChangedName?: boolean;
  previousSurname?: string;
  previousGivenName?: string;
  gender: GenderCode;
  birthCity: string;
  birthCountry: string; // e.g. "BGD"
  nationalIdNumber: string; // e.g. "NA" or NID
  religion: ReligionCode;
  religionOther?: string;
  visibleIdentificationMarks: string; // e.g. "NA"
  educationalQualification: EducationLevel;
  nationalityAcquiredBy: NationalityAcquisition;
  previousNationality?: string;

  // Passport Details
  passportNumber: string;
  passportPlaceOfIssue: string;
  passportDateOfIssue: string; // DD/MM/YYYY
  passportDateOfExpiry: string; // DD/MM/YYYY
  hasOtherPassport?: boolean;
  otherPassportCountry?: string;
  otherPassportNumber?: string;
  otherPassportDateOfIssue?: string;
  otherPassportPlaceOfIssue?: string;
  otherPassportNationality?: string;
}

// ----------------------------------------------------
// STEP 3: Family Details & Address
// ----------------------------------------------------
export type OccupationCode =
  | "AIR FORCE"
  | "BUSINESS PERSON"
  | "CAMERAMAN"
  | "CHARITY/SOCIAL WORKER"
  | "CHARTERED ACCOUNTANT"
  | "COLLEGE/UNIVERSITY TEACHER"
  | "DIPLOMAT"
  | "DOCTOR"
  | "ENGINEER"
  | "FILM PRODUCER"
  | "GOVERNMENT SERVICE"
  | "HOUSE WIFE"
  | "JOURNALIST"
  | "LABOUR"
  | "LAWYER"
  | "MEDIA"
  | "MILITARY"
  | "MISSIONARY"
  | "NAVY"
  | "NEWS BROADCASTER"
  | "OFFICIAL"
  | "OTHERS"
  | "POLICE"
  | "PRESS"
  | "PRIVATE SERVICE"
  | "PUBLISHER"
  | "REPORTER"
  | "RESEARCHER"
  | "RETIRED"
  | "SEA MAN"
  | "SELF EMPLOYED/ FREELANCER"
  | "STUDENT"
  | "TRADER"
  | "TV PRODUCER"
  | "UN-EMPLOYED"
  | "UN OFFICIAL"
  | "WORKER"
  | "WRITER";

export interface Step3FamilyAddressProfile {
  // Present Address
  presentAddressLine1: string; // House No./Street (max 35 chars)
  presentCity: string;
  presentCountry: string; // e.g. "BGD"
  presentStateDistrict: string;
  postalCode: string;
  phone: string;
  mobileIsdCode?: string; // e.g. "880"
  mobile: string;
  sameAddress: boolean;

  // Permanent Address (if sameAddress === false)
  permanentAddressLine1?: string;
  permanentCity?: string;
  permanentStateDistrict?: string;

  // Father's Details
  fatherName: string;
  fatherNationality: string; // e.g. "BGD"
  fatherPreviousNationality?: string;
  fatherBirthPlace: string;
  fatherCountryOfBirth: string; // e.g. "BGD"

  // Mother's Details
  motherName: string;
  motherNationality: string; // e.g. "BGD"
  motherPreviousNationality?: string;
  motherBirthPlace: string;
  motherCountryOfBirth: string; // e.g. "BGD"

  // Marital Status
  maritalStatus: "SINGLE" | "MARRIED";
  spouseName?: string;
  spouseNationality?: string;
  spouseBirthPlace?: string;
  spouseCountryOfBirth?: string;

  // Grandparents
  grandparentsPakistanOrigin: boolean;
  grandparentsPakistanDetails?: string;

  // Occupation
  occupation: OccupationCode;
  pastOccupation?: OccupationCode | null;
  employerName: string;
  designation: string;
  employerAddress: string;
  employerPhone: string;
  previousOrganizationMilitary: boolean;
  previousOrganizationName?: string;
  previousDesignation?: string;
  previousRank?: string;
  previousPosting?: string;
}

export type PortOfTravel =
  | "BY AIR"
  | "BY AIR/ HARIDASPUR"
  | "BY RAIL CHITPUR"
  | "BY RAIL GEDE"
  | "BY RAIL GEDE/BY AIR"
  | "BY RAIL GEDE/BYROAD HARIDASPUR"
  | "BY RAIL NEW JALPAIGURI"
  | "BY RAIL NISCHINTPUR"
  | "BY RAIL PETRAPOLE"
  | "BY ROAD AGARTALA"
  | "BY ROAD BAGHMARA"
  | "BY ROAD BELONIA"
  | "BY ROAD BHOLAGONJ"
  | "BY ROAD CHANGRABANDHA"
  | "BY ROAD CHANGRABANDHA/JAYGAON"
  | "BY ROAD CHANGRABANDHA/RANIGANJ"
  | "BY ROAD DALU"
  | "BY ROAD DAWKI"
  | "BY ROAD DHALIGHAT"
  | "BY ROAD DHUBRI"
  | "BY ROAD GEDE"
  | "BY ROAD GHOJADANGA"
  | "BY ROAD GOLAKGANJ"
  | "BY ROAD HALDIBARI"
  | "BY ROAD HARIDASPUR"
  | "BY ROAD HILI"
  | "BY ROAD JAIGAON"
  | "BY ROAD JAIGAON/PHULBARI"
  | "BY ROAD KAILASHAHAR"
  | "BY ROAD KARIMGANJ"
  | "BY ROAD KHOWAI"
  | "BY ROAD LALGOLAGHAT"
  | "BY ROAD MAHADIPUR"
  | "BY ROAD MANKARCHAR"
  | "BY ROAD MUHURIGHAT"
  | "BY ROAD PHULBARI"
  | "BY ROAD PHULBARI/JAIGAON"
  | "BY ROAD PHULBARI/RANIGANJ"
  | "BY ROAD RADHIKAPUR"
  | "BY ROAD RANIGANJ"
  | "BY ROAD RANIGANJ/PHULBARI"
  | "BY ROAD SABROOM"
  | "BY ROAD SONAHAT"
  | "BY ROAD SRIMANTPUR"
  | "BY ROAD SUTERKANDI"
  | (string & {});

// ----------------------------------------------------
// STEP 4: Visa Sought & References
// ----------------------------------------------------
export type VisaDurationMonths = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type NumberOfEntriesCode = "1" | "2" | "3" | "4"; // 1=SINGLE, 2=MULTIPLE, 3=DOUBLE, 4=TRIPLE

export type PreviousVisaTypeCode =
  | "1"  // BUSINESS VISA
  | "4"  // CONFERENCE VISA
  | "11" // DIPLOMATIC VISA
  | "87" // DOUBLE ENTRY
  | "9"  // EMPLOYMENT VISA
  | "6"  // ENTRY VISA
  | "84" // FILM VISA
  | "8"  // JOURNALIST VISA
  | "16" // MEDICAL VISA
  | "7"  // MISSIONARY VISA
  | "63" // MOUNTAINEERING VISA
  | "12" // OFFICIAL VISA
  | "64" // PILGRIMES VISA
  | "2"  // STUDENT VISA
  | "3"  // TOURIST VISA
  | "5"  // TRANSIT VISA
  | "86" // UN DIPLOMAT
  | "17" // UN OFFICIAL
  | "76" // VISIT VISA
  | (string & {});

export type SaarcCountryCode =
  | "AFG" // AFGHANISTAN
  | "BTN" // BHUTAN
  | "PAK" // PAKISTAN
  | "MDV" // MALDIVES
  | "BGD" // BANGLADESH
  | "LKA" // SRI LANKA
  | "NPL" // NEPAL
  | (string & {});

export interface SaarcCountryVisit {
  country: SaarcCountryCode;
  year: string; // e.g. "2026", "2025", "2024", "2023"
  visitCount: string; // e.g. "1", "2"
}

export type IndianStateName =
  | "CHANDIGARH"
  | "ANDAMAN AND NICOBAR ISLANDS"
  | "ANDHRA PRADESH"
  | "ARUNACHAL PRADESH"
  | "ASSAM"
  | "BIHAR"
  | "CHHATTISGARH"
  | "DELHI"
  | "GOA"
  | "GUJARAT"
  | "HARYANA"
  | "HIMACHAL PRADESH"
  | "JAMMU AND KASHMIR"
  | "JHARKHAND"
  | "KARNATAKA"
  | "KERALA"
  | "MADHYA PRADESH"
  | "MAHARASHTRA"
  | "MANIPUR"
  | "MEGHALAYA"
  | "MIZORAM"
  | "NAGALAND"
  | "ORISSA"
  | "PONDICHERRY"
  | "PUNJAB"
  | "RAJASTHAN"
  | "SIKKIM"
  | "TAMIL NADU"
  | "TRIPURA"
  | "UTTAR PRADESH"
  | "WEST BENGAL"
  | "DADRA NAGAR HAVELI"
  | "LAKSHADWEEP"
  | "TELANGANA"
  | "UTTARAKHAND"
  | "LADAKH"
  | "DADRA NAGAR HAVELI AND DAMAN AND DIU"
  | (string & {});

export interface Step4VisaReferencesProfile {
  placesToBeVisited1: string; // Primary, e.g. "KOLKATA" (mandatory)
  placesToBeVisited2: string; // Secondary comma separated, e.g. "DELHI, JAIPUR" (mandatory)
  durationMonths: VisaDurationMonths; // Number between 1-12
  numberOfEntries: NumberOfEntriesCode;
  portOfArrival: PortOfTravel;
  portOfExit: PortOfTravel;

  // Previous visit
  everVisitedIndiaBefore: boolean;
  previousAddressLine1?: string; // Line 1: House/Street (max 35 chars)
  previousAddressLine2?: string; // Line 2: Village/Town/City (max 35 chars)
  previousAddressLine3?: string; // Line 3: State/District (max 35 chars)
  previousVisitAddress1?: string; // Alias for backward compatibility
  previousVisitCity?: string;
  previousVisaNumber?: string;
  previousVisaType?: PreviousVisaTypeCode;
  previousVisaIssuePlace?: string;
  previousVisaIssueDate?: string;
  permissionRefused?: boolean;
  permissionRefusedDetails?: string;

  // Travel history
  countriesVisitedLast10Years?: string; // comma separated, or "NONE"
  visitedSaarcCountriesLast3Years: boolean;
  saarcCountryVisits?: SaarcCountryVisit[];

  // Reference in India
  referenceNameIndia: string;
  referenceAddressIndia?: string; // backward compat
  referenceAddressIndiaLine1: string; // Line 1: Hotel/Street Address (max 200 chars)
  referenceAddressIndiaLine2?: string; // Line 2: Area/Landmark (max 200 chars)
  referenceStateIndia: IndianStateName; // e.g. "WEST BENGAL"
  referenceDistrictIndia: string; // e.g. "KOLKATA"
  referencePhoneIndia: string;

  // Reference in Bangladesh
  referenceNameBangladesh: string;
  referenceAddressBangladesh?: string; // backward compat
  referenceAddressBangladeshLine1: string; // Line 1: House/Road (max 35 chars)
  referenceAddressBangladeshLine2?: string; // Line 2: Area/Thana (max 35 chars)
  referencePhoneBangladesh: string;
}

// ----------------------------------------------------
// STEP 5: Additional Questions
// ----------------------------------------------------
export interface Step5AdditionalQuestionsProfile {
  arrestedOrConvicted: boolean; // default false
  refusedEntryOrDeported: boolean; // default false
  humanOrDrugTrafficking: boolean; // default false
  cyberCrimeOrTerrorism: boolean; // default false
  viewsJustifyingTerrorism: boolean; // default false
  soughtAsylum: boolean; // default false
}

// ----------------------------------------------------
// STEP 8: Stay Details (Hotel in India)
// ----------------------------------------------------
export interface Step8StayDetailsProfile {
  hotelName: string;
  address: string;
  state: string; // e.g. "WEST BENGAL"
  district: string; // e.g. "KOLKATA"
  email?: string; // Optional (leave empty if not provided)
  phone: string; // e.g. "03322239999"
}

// ----------------------------------------------------
// Complete Applicant Profile
// ----------------------------------------------------
export interface VisaApplicantProfile {
  temporaryApplicationId?: string;
  step1_registration: Step1RegistrationProfile;
  step2_applicant_details?: Step2ApplicantDetailsProfile;
  step3_family_address?: Step3FamilyAddressProfile;
  step4_visa_references?: Step4VisaReferencesProfile;
  step5_additional_questions?: Step5AdditionalQuestionsProfile;
  photoFilePath?: string;
  passportPdfPath?: string;
  step8_stay_details?: Step8StayDetailsProfile;
  submitFinalApplication?: boolean; // Default false (safety review hold)
  [key: string]: unknown;
}
