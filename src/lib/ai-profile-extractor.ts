import {
  VisaApplicantProfile,
  IndianMissionCode,
  VisaPurposeCode,
  GenderCode,
  ReligionCode,
  EducationLevel,
  NationalityAcquisition,
  OccupationCode,
  PortOfTravel,
  VisaDurationMonths,
  NumberOfEntriesCode,
} from '@/types/profile';
import { DEFAULT_BLANK_PROFILE } from '@/lib/profile-constants';

export interface ExtractionResult {
  success: boolean;
  profile: VisaApplicantProfile;
  fieldsCount: number;
  detectedFormat: 'excel' | 'whatsapp' | 'biodata' | 'unstructured';
  sanitizationNotices: string[];
  providerUsed: string;
  error?: string;
}

export const CONSULAR_SYSTEM_PROMPT = `You are an expert Consular AI Assistant and automated form parser for Indian Visa Applications (IVAC Bangladesh).
Your objective is to ingest unstructured client data (such as raw WhatsApp messages, informal notes, emails, Excel copy-pastes, TSV tables, or bio-data sheets) and extract, normalize, and construct a complete, 100% compliant Indian Visa Applicant Profile JSON object.

### MANDATORY CONSULAR VALIDATION & FORMATTING RULES:

1. **NO PERIODS / DOTS IN NAMES**:
   - The Indian visa portal rejects periods/dots with fatal validation errors.
   - You MUST strip all dots and periods from ALL name fields:
     - "Md." -> "MD"
     - "Dr." -> "DR"
     - "Mrs." -> "MRS"
     - "Md. Robiul Islam" -> "MD ROBIUL ISLAM"
   - Every name field must be completely in UPPERCASE.

2. **NAME SPLITTING**:
   - step2_applicant_details.surname: Family name or last word of the full name (e.g. "ISLAM").
   - step2_applicant_details.givenName: First and middle names (e.g. "MOHAMMAD ROBIUL").
   - If the person has only a single name, set both surname and givenName to that single name.

3. **DATE NORMALIZATION**:
   - All dates (DOB, passport issue/expiry, arrival date) MUST be formatted strictly as "DD/MM/YYYY" (e.g. "15/06/1995").
   - If month is written in words (e.g. "15 June 1995" or "Oct 24, 1992"), convert to 2-digit month.

4. **ADDRESS RESTRICTIONS**:
   - presentAddressLine1: The portal has a HARD limit of 35 characters maximum.
   - If an address is longer than 35 characters, place the primary building/street in Line 1 (max 35 chars) and put remaining locality/district into presentCity and presentStateDistrict.
   - Remove special punctuation like # or commas.

5. **INDIAN MISSION CODES**:
   - Based on applicant's current division/district:
     - Dhaka, Gazipur, Narayanganj, Barisal, Faridpur, Mymensingh -> "BGDD" (Dhaka)
     - Chittagong, Cox's Bazar, Comilla, Noakhali, Feni, Brahmanbaria -> "BGDC" (Chittagong)
     - Sylhet, Moulvibazar, Habiganj, Sunamganj -> "BGDS" (Sylhet)
     - Rajshahi, Bogra, Rangpur, Dinajpur, Pabna -> "BGDR" (Rajshahi)
     - Khulna, Jessore, Kushtia, Satkhira -> "BGDK" (Khulna)
   - Default: "BGDD"

6. **VISA PURPOSE CODES**:
   - Tourist / Sightseeing / Recreation -> "544"
   - Medical Treatment -> "515"
   - Medical Attendant -> "516"
   - Business / Commercial -> "537"
   - Student -> "540"
   - Double Entry -> "532"
   - Transit -> "233"
   - Default: "544"

7. **OCCUPATION CODE**:
   - Must be one of the portal's allowed occupation values:
     "PRIVATE SERVICE", "BUSINESS PERSON", "GOVERNMENT SERVICE", "STUDENT", "HOUSE WIFE", "DOCTOR", "ENGINEER", "LAWYER", "JOURNALIST", "COLLEGE/UNIVERSITY TEACHER", "SELF EMPLOYED/ FREELANCER", "RETIRED", "UN-EMPLOYED", "OTHERS".
   - Default: "PRIVATE SERVICE"

8. **PORT OF TRAVEL**:
   - Haridaspur / Benapole -> "BY AIR/ HARIDASPUR"
   - Gede / Darsana -> "BY ROAD GEDE" or "BY RAIL GEDE"
   - Air / Flight -> "BY AIR"
   - Changrabandha / Burimari -> "BY ROAD CHANGRABANDHA"
   - Agartala / Akhaura -> "BY ROAD AGARTALA"
   - Default: "BY AIR/ HARIDASPUR"

9. **STAY & REFERENCES**:
   - Hotel in India: populate step8_stay_details (hotelName, address, state, district, phone) and step4_visa_references (referenceNameIndia, referenceAddressIndia, referencePhoneIndia).
   - Relative / Contact in Bangladesh: populate step4_visa_references (referenceNameBangladesh, referenceAddressBangladesh, referencePhoneBangladesh).

10. **MISSING FIELDS (IMPUTATION DEFAULTS)**:
    - visibleIdentificationMarks: "NA"
    - nationalIdNumber: "NA" (if unstated)
    - nationality: "BGD"
    - birthCountry: "BGD"
    - educationalQualification: "GRADUATE" (or inferred from profession)
    - religion: "ISLAM" (or as stated)
    - durationMonths: 12
    - numberOfEntries: "2"
    - sameAddress: true
    - step5_additional_questions: all false
    - grandparentsPakistanOrigin: false
    - previousOrganizationMilitary: false

### TARGET JSON STRUCTURE:
Return a single JSON object with this exact structure:
{
  "step1_registration": {
    "indianMission": "BGDD",
    "visaPurpose": "544",
    "dateOfBirth": "DD/MM/YYYY",
    "expectedDateOfArrival": "DD/MM/YYYY",
    "email": "...",
    "reEnterEmail": "..."
  },
  "step2_applicant_details": {
    "surname": "...",
    "givenName": "...",
    "gender": "M",
    "birthCity": "DHAKA",
    "nationalIdNumber": "NA",
    "religion": "ISLAM",
    "educationalQualification": "GRADUATE",
    "passportNumber": "...",
    "passportDateOfIssue": "DD/MM/YYYY",
    "passportDateOfExpiry": "DD/MM/YYYY",
    "passportPlaceOfIssue": "DHAKA"
  },
  "step3_family_address": {
    "fatherName": "...",
    "motherName": "...",
    "maritalStatus": "MARRIED",
    "spouseName": "...",
    "presentAddressLine1": "...",
    "presentCity": "DHAKA",
    "presentStateDistrict": "DHAKA",
    "postalCode": "1216",
    "mobile": "...",
    "occupation": "PRIVATE SERVICE",
    "employerName": "...",
    "designation": "..."
  },
  "step4_visa_references": {
    "portOfArrival": "BY AIR/ HARIDASPUR",
    "referenceNameIndia": "...",
    "referenceAddressIndia": "...",
    "referencePhoneIndia": "...",
    "referenceNameBangladesh": "...",
    "referenceAddressBangladesh": "...",
    "referencePhoneBangladesh": "..."
  },
  "step8_stay_details": {
    "hotelName": "...",
    "address": "...",
    "state": "WEST BENGAL",
    "district": "KOLKATA",
    "phone": "..."
  }
}
Return ONLY valid JSON.`;

/**
 * Strips dots, cleans whitespace, and converts to uppercase for consular portal compatibility.
 */
export function cleanConsularName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\./g, '') // Remove dots (Md. -> MD)
    .replace(/[^A-Za-z\s\-]/g, ' ') // Remove non-alpha except hyphens
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/**
 * Truncates an address to a maximum of 35 characters at a word boundary.
 */
export function sanitizeAddressLine(address: string, maxLen = 35): string {
  if (!address) return '';
  const cleaned = address
    .replace(/[#,\.\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  if (cleaned.length <= maxLen) return cleaned;

  // Cut at last space before maxLen
  const truncated = cleaned.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 15) {
    return truncated.slice(0, lastSpace).trim();
  }
  return truncated.trim();
}

/**
 * Converts various date formats into DD/MM/YYYY.
 */
export function normalizeDateToDDMMYYYY(rawDate: string): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();

  // If already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
  }

  // DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
  }

  // Month in words: e.g. "15 June 1995" or "June 15, 1995"
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  const wordMatch1 = trimmed.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/i);
  if (wordMatch1) {
    const dd = wordMatch1[1].padStart(2, '0');
    const monKey = wordMatch1[2].toLowerCase().slice(0, 3);
    const mm = months[monKey] || '01';
    const yyyy = wordMatch1[3];
    return `${dd}/${mm}/${yyyy}`;
  }

  const wordMatch2 = trimmed.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/i);
  if (wordMatch2) {
    const monKey = wordMatch2[1].toLowerCase().slice(0, 3);
    const mm = months[monKey] || '01';
    const dd = wordMatch2[2].padStart(2, '0');
    const yyyy = wordMatch2[3];
    return `${dd}/${mm}/${yyyy}`;
  }

  return trimmed;
}

/**
 * Enforces consular rules and safety defaults on any extracted profile object.
 * Uses an omnidirectional mapping engine to find fields regardless of model output nesting.
 */
export function postSanitizeProfile(
  rawProfile: unknown,
  notices: string[] = []
): VisaApplicantProfile {
  const getRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  const getStr = (v: unknown, fallback = ''): string =>
    typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;

  // Start from standard blank profile clone
  const sanitized: VisaApplicantProfile = JSON.parse(JSON.stringify(DEFAULT_BLANK_PROFILE));

  const root = getRecord(rawProfile);
  const s1 = getRecord(root.step1_registration);
  const s2 = getRecord(root.step2_applicant_details);
  const s3 = getRecord(root.step3_family_address || root.step3_travel_details);
  const s4 = getRecord(root.step4_visa_references);
  const s8 = getRecord(root.step8_stay_details);
  const passportObj = getRecord(root.passport);
  const s2Passport = getRecord(s2.passport);

  // Step 1: Registration
  const mission = getStr(
    s1.indianMission || s3.indianMissionCode || root.indianMission,
    sanitized.step1_registration.indianMission
  ) as IndianMissionCode;
  const purpose = getStr(
    s1.visaPurpose || s3.visaPurposeCode || root.visaPurpose,
    sanitized.step1_registration.visaPurpose
  ) as VisaPurposeCode;
  const rawDob = getStr(s1.dateOfBirth || s2.dateOfBirth || root.dateOfBirth || root.dob);
  const rawEmail = getStr(s1.email || s2.emailAddress || root.email || root.emailAddress);
  const rawArrival = getStr(
    s1.expectedDateOfArrival || s3.dateOfArrivalInIndia || root.dateOfArrivalInIndia || root.arrivalDate
  );

  sanitized.step1_registration.indianMission = mission;
  sanitized.step1_registration.visaPurpose = purpose;
  if (rawDob) sanitized.step1_registration.dateOfBirth = normalizeDateToDDMMYYYY(rawDob);
  if (rawEmail) {
    sanitized.step1_registration.email = rawEmail.trim();
    sanitized.step1_registration.reEnterEmail = rawEmail.trim();
  }
  if (rawArrival) sanitized.step1_registration.expectedDateOfArrival = normalizeDateToDDMMYYYY(rawArrival);

  // Step 2: Applicant details
  const rawGiven = getStr(s2.givenName || root.givenName || root.client_name || root.name || s2.name);
  const rawSurname = getStr(s2.surname || root.surname || root.last_name);

  let cleanGiven = cleanConsularName(rawGiven);
  let cleanSurname = cleanConsularName(rawSurname);

  if (rawGiven.includes('.') || rawSurname.includes('.')) {
    notices.push('Cleaned dots from applicant name for IVAC portal compliance.');
  }

  // If surname is missing but givenName has multiple words, split
  if (!cleanSurname && cleanGiven.includes(' ')) {
    const parts = cleanGiven.split(' ');
    cleanSurname = parts.pop() || '';
    cleanGiven = parts.join(' ');
    notices.push('Split full name into Given Name and Surname.');
  } else if (!cleanSurname && cleanGiven) {
    cleanSurname = cleanGiven;
  }

  const rawPassport = getStr(
    s2.passportNumber || root.passportNumber || passportObj.number || s2Passport.number || root.passport
  );
  const rawIssueDate = getStr(
    s2.passportDateOfIssue || s2.passportIssueDate || root.passportIssueDate || passportObj.issue_date
  );
  const rawExpiryDate = getStr(
    s2.passportDateOfExpiry || s2.passportExpiryDate || root.passportExpiryDate || passportObj.expiry_date
  );
  const rawPlace = getStr(s2.passportPlaceOfIssue || s2.passportIssuePlace || root.passportIssuePlace, 'DHAKA');

  sanitized.step2_applicant_details = {
    ...sanitized.step2_applicant_details,
    givenName: cleanGiven,
    surname: cleanSurname,
    gender: (getStr(s2.gender || root.gender, 'M')) as GenderCode,
    birthCity: getStr(s2.birthCity || s2.placeOfBirth || root.birthCity, 'DHAKA').toUpperCase().trim(),
    birthCountry: 'BGD',
    nationalIdNumber: getStr(s2.nationalIdNumber || root.nationalIdNumber, 'NA').toUpperCase().trim(),
    religion: (getStr(s2.religion || root.religion, 'ISLAM')) as ReligionCode,
    visibleIdentificationMarks: getStr(s2.visibleIdentificationMarks || root.visibleIdentificationMarks, 'NA').toUpperCase().trim(),
    educationalQualification: (getStr(s2.educationalQualification || root.educationalQualification, 'GRADUATE')) as EducationLevel,
    nationalityAcquiredBy: (getStr(s2.nationalityAcquiredBy || root.nationalityAcquiredBy, 'BY BIRTH')) as NationalityAcquisition,
    passportNumber: rawPassport.toUpperCase().replace(/[^A-Z0-9]/g, '').trim(),
    passportPlaceOfIssue: rawPlace.toUpperCase().trim(),
    passportDateOfIssue: normalizeDateToDDMMYYYY(rawIssueDate),
    passportDateOfExpiry: normalizeDateToDDMMYYYY(rawExpiryDate),
    hasOtherPassport: Boolean(s2.hasOtherPassport || root.hasOtherPassport),
    otherPassportNumber: s2.otherPassportNumber ? getStr(s2.otherPassportNumber).toUpperCase().trim() : '',
    otherPassportCountry: 'BANGLADESH',
  };

  // Step 3: Family details & Address
  const rawFather = getStr(s3.fatherName || s2.fatherName || root.fatherName || root.father);
  const rawMother = getStr(s3.motherName || s2.motherName || root.motherName || root.mother);
  const rawSpouse = getStr(s3.spouseName || s2.spouseName || root.spouseName || root.wife || root.husband);

  const cleanFather = cleanConsularName(rawFather);
  const cleanMother = cleanConsularName(rawMother);
  const cleanSpouse = cleanConsularName(rawSpouse);

  if ((rawFather && rawFather.includes('.')) || (rawMother && rawMother.includes('.'))) {
    notices.push('Removed dots from parent names.');
  }

  const rawAddr1 = getStr(s3.presentAddressLine1 || s2.presentAddressLine1 || root.presentAddressLine1 || root.address);
  let addr1 = sanitizeAddressLine(rawAddr1);
  if (addr1.length > 35) {
    addr1 = addr1.slice(0, 35).trim();
    notices.push('Truncated Address Line 1 to 35 characters maximum.');
  }

  const rawPhone = getStr(s3.phone || s3.mobile || s2.phoneNumber || root.mobile || root.phone);
  const rawEmployer = getStr(s3.employerName || s2.organization || s3.organization || root.employerName || root.organization);
  const rawDesignation = getStr(s3.designation || s2.designation || root.designation, 'EXECUTIVE');
  const rawOccupation = (getStr(s3.occupation || s2.occupation || root.occupation, 'PRIVATE SERVICE')) as OccupationCode;

  sanitized.step3_family_address = {
    ...sanitized.step3_family_address,
    presentAddressLine1: addr1,
    presentCity: getStr(s3.presentCity || s2.presentCity || root.presentCity, 'DHAKA').toUpperCase().trim(),
    presentCountry: 'BGD',
    presentStateDistrict: getStr(s3.presentStateDistrict || s2.presentStateDistrict || root.presentStateDistrict, 'DHAKA').toUpperCase().trim(),
    postalCode: getStr(s3.postalCode || s3.presentPostalCode || s2.presentPostalCode || root.postalCode, '1213').trim(),
    phone: rawPhone.replace(/[^0-9+]/g, '').trim(),
    mobile: rawPhone.replace(/[^0-9+]/g, '').trim(),
    sameAddress: true,
    fatherName: cleanFather,
    fatherNationality: 'BGD',
    fatherBirthPlace: getStr(s3.fatherBirthPlace, 'DHAKA').toUpperCase().trim(),
    fatherCountryOfBirth: 'BGD',
    motherName: cleanMother,
    motherNationality: 'BGD',
    motherBirthPlace: getStr(s3.motherBirthPlace, 'DHAKA').toUpperCase().trim(),
    motherCountryOfBirth: 'BGD',
    maritalStatus: (getStr(s3.maritalStatus || s2.maritalStatus, cleanSpouse ? 'MARRIED' : 'SINGLE')) as 'MARRIED' | 'SINGLE',
    spouseName: cleanSpouse,
    spouseNationality: cleanSpouse ? 'BGD' : '',
    grandparentsPakistanOrigin: Boolean(s3.grandparentsPakistanOrigin || root.grandparentsPakistanOrigin),
    occupation: rawOccupation,
    employerName: cleanConsularName(rawEmployer),
    designation: cleanConsularName(rawDesignation),
    employerAddress: getStr(s3.employerAddress, 'DHAKA').toUpperCase().trim(),
    employerPhone: getStr(s3.employerPhone, rawPhone).trim(),
    previousOrganizationMilitary: false,
  };

  // Step 4: Visa Sought & References
  const rawPort = (getStr(s4.portOfArrival || s3.portOfTravel || root.portOfTravel, 'BY AIR/ HARIDASPUR')) as PortOfTravel;
  const rawRefIndia = getStr(s4.referenceNameIndia || s8.hotelName || root.hotel || root.referenceNameIndia);
  const rawRefIndiaAddr = getStr(s4.referenceAddressIndia || s8.address || root.hotelAddress);
  const rawRefIndiaPhone = getStr(s4.referencePhoneIndia || s8.phone || root.hotelPhone);
  const rawRefBD = getStr(s4.referenceNameBangladesh || root.referenceNameBangladesh || root.emergencyContact);
  const rawRefBDPhone = getStr(s4.referencePhoneBangladesh || root.referencePhoneBangladesh || root.emergencyPhone);

  sanitized.step4_visa_references = {
    ...sanitized.step4_visa_references,
    placesToBeVisited1: getStr(s4.placesToBeVisited1, 'KOLKATA').toUpperCase().trim(),
    placesToBeVisited2: getStr(s4.placesToBeVisited2, 'DELHI').toUpperCase().trim(),
    durationMonths: (Number(s4.durationMonths || s3.durationMonths) || 12) as VisaDurationMonths,
    numberOfEntries: (getStr(s4.numberOfEntries || s3.numberOfEntries, '2')) as NumberOfEntriesCode,
    portOfArrival: rawPort,
    portOfExit: (getStr(s4.portOfExit, rawPort)) as PortOfTravel,
    everVisitedIndiaBefore: Boolean(s4.everVisitedIndiaBefore),
    countriesVisitedLast10Years: getStr(s4.countriesVisitedLast10Years, 'NONE'),
    visitedSaarcCountriesLast3Years: Boolean(s4.visitedSaarcCountriesLast3Years),
    referenceNameIndia: cleanConsularName(rawRefIndia),
    referenceAddressIndia: getStr(rawRefIndiaAddr, 'KOLKATA').toUpperCase().trim(),
    referenceAddressIndiaLine1: getStr(s4.referenceAddressIndiaLine1 || rawRefIndiaAddr, 'HOTEL HINDUSTAN INTERNATIONAL').toUpperCase().trim(),
    referenceAddressIndiaLine2: getStr(s4.referenceAddressIndiaLine2, '').toUpperCase().trim(),
    referenceStateIndia: getStr(s4.referenceStateIndia || s8.state, 'WEST BENGAL').toUpperCase().trim(),
    referenceDistrictIndia: getStr(s4.referenceDistrictIndia || s8.district, 'KOLKATA').toUpperCase().trim(),
    referencePhoneIndia: rawRefIndiaPhone.replace(/[^0-9+]/g, '').trim(),
    referenceNameBangladesh: cleanConsularName(rawRefBD),
    referenceAddressBangladesh: getStr(s4.referenceAddressBangladesh || root.referenceAddressBangladesh, 'DHAKA').toUpperCase().trim(),
    referenceAddressBangladeshLine1: getStr(s4.referenceAddressBangladeshLine1 || s4.referenceAddressBangladesh || root.referenceAddressBangladesh, 'DHAKA').toUpperCase().trim().slice(0, 35),
    referenceAddressBangladeshLine2: getStr(s4.referenceAddressBangladeshLine2, '').toUpperCase().trim().slice(0, 35),
    referencePhoneBangladesh: rawRefBDPhone.replace(/[^0-9+]/g, '').trim(),
  };

  // Step 8: Stay Details (Hotel in India)
  const hotelName = getStr(s8.hotelName || s4.referenceNameIndia || root.hotelName || root.hotel);
  const hotelAddr = getStr(s8.address || s4.referenceAddressIndia || root.hotelAddress);
  const hotelPhone = getStr(s8.phone || s4.referencePhoneIndia || root.hotelPhone);

  sanitized.step8_stay_details = {
    hotelName: cleanConsularName(hotelName || sanitized.step4_visa_references?.referenceNameIndia || ''),
    address: getStr(hotelAddr || sanitized.step4_visa_references?.referenceAddressIndia, 'KOLKATA').toUpperCase().trim(),
    state: getStr(s8.state || sanitized.step4_visa_references?.referenceStateIndia, 'WEST BENGAL').toUpperCase().trim(),
    district: getStr(s8.district || sanitized.step4_visa_references?.referenceDistrictIndia, 'KOLKATA').toUpperCase().trim(),
    email: getStr(s8.email).trim(),
    phone: getStr(hotelPhone || sanitized.step4_visa_references?.referencePhoneIndia).replace(/[^0-9+]/g, '').trim(),
  };

  return sanitized;
}

/**
 * Counts non-empty key values in the profile to report fields populated.
 */
export function countPopulatedFields(profile: VisaApplicantProfile): number {
  let count = 0;
  const inspect = (obj: unknown) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        inspect(v);
      } else if (v !== '' && v !== null && v !== undefined && v !== 'NA') {
        count++;
      }
    }
  };
  inspect(profile);
  return count;
}

/**
 * Rule-based heuristic & regex parser for Excel TSV/CSV and WhatsApp unstructured text.
 */
export function extractWithHeuristics(rawText: string): {
  profile: VisaApplicantProfile;
  detectedFormat: 'excel' | 'whatsapp' | 'biodata' | 'unstructured';
  notices: string[];
} {
  const notices: string[] = [];
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let isExcel = false;
  let isWhatsApp = false;

  if (rawText.includes('\t') || (lines.length > 2 && lines.some((l) => l.split(',').length >= 3))) {
    isExcel = true;
  } else if (/(\[?\d{1,2}:\d{2}|whatsapp|client|vai|bhai|phone|father)/i.test(rawText)) {
    isWhatsApp = true;
  }

  const rawExtracted: Record<string, Record<string, unknown>> = {
    step1_registration: {},
    step2_applicant_details: {},
    step3_family_address: {},
    step4_visa_references: {},
    step8_stay_details: {},
  };

  const kv: Record<string, string> = {};

  for (const line of lines) {
    if (line.includes('\t')) {
      const parts = line.split('\t').map((p) => p.trim());
      if (parts.length >= 2) {
        kv[parts[0].toLowerCase()] = parts.slice(1).join(' ');
      }
    } else if (line.includes(':')) {
      const idx = line.indexOf(':');
      const key = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();
      kv[key] = val;
    } else if (line.includes('=')) {
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();
      kv[key] = val;
    }
  }

  // Regex extractors across the whole text
  const passportMatch = rawText.match(/\b([A-PR-WY][0-9]{7,8})\b/i);
  if (passportMatch) {
    rawExtracted.step2_applicant_details.passportNumber = passportMatch[1].toUpperCase();
  }

  const emailMatch = rawText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (emailMatch) {
    rawExtracted.step1_registration.email = emailMatch[1];
    rawExtracted.step1_registration.reEnterEmail = emailMatch[1];
  }

  const phoneMatches = Array.from(rawText.matchAll(/(?:\+?880|0)?(1[3-9]\d{8})\b/g));
  if (phoneMatches.length > 0) {
    rawExtracted.step3_family_address.mobile = phoneMatches[0][1];
    rawExtracted.step3_family_address.phone = phoneMatches[0][1];
    if (phoneMatches.length > 1) {
      rawExtracted.step4_visa_references.referencePhoneBangladesh = phoneMatches[1][1];
    }
  }

  for (const [k, v] of Object.entries(kv)) {
    if (/passport\s*(no|number)?$/i.test(k)) {
      rawExtracted.step2_applicant_details.passportNumber = v;
    } else if (/^(client|applicant|full\s*name|name)$/i.test(k)) {
      const clean = cleanConsularName(v);
      const parts = clean.split(' ');
      if (parts.length > 1) {
        rawExtracted.step2_applicant_details.surname = parts.pop();
        rawExtracted.step2_applicant_details.givenName = parts.join(' ');
      } else {
        rawExtracted.step2_applicant_details.givenName = clean;
        rawExtracted.step2_applicant_details.surname = clean;
      }
    } else if (/surname|last\s*name/i.test(k)) {
      rawExtracted.step2_applicant_details.surname = cleanConsularName(v);
    } else if (/given\s*name|first\s*name/i.test(k)) {
      rawExtracted.step2_applicant_details.givenName = cleanConsularName(v);
    } else if (/dob|birth\s*date|date\s*of\s*birth/i.test(k)) {
      rawExtracted.step1_registration.dateOfBirth = normalizeDateToDDMMYYYY(v);
    } else if (/issue\s*date|passport\s*issue/i.test(k)) {
      rawExtracted.step2_applicant_details.passportDateOfIssue = normalizeDateToDDMMYYYY(v);
    } else if (/expir(y|e)\s*date|passport\s*exp/i.test(k)) {
      rawExtracted.step2_applicant_details.passportDateOfExpiry = normalizeDateToDDMMYYYY(v);
    } else if (/father/i.test(k)) {
      rawExtracted.step3_family_address.fatherName = cleanConsularName(v);
    } else if (/mother/i.test(k)) {
      rawExtracted.step3_family_address.motherName = cleanConsularName(v);
    } else if (/spouse|wife|husband/i.test(k)) {
      rawExtracted.step3_family_address.spouseName = cleanConsularName(v);
      rawExtracted.step3_family_address.maritalStatus = 'MARRIED';
    } else if (/address|present\s*address|living\s*at/i.test(k)) {
      rawExtracted.step3_family_address.presentAddressLine1 = v;
    } else if (/city/i.test(k)) {
      rawExtracted.step3_family_address.presentCity = v.toUpperCase();
    } else if (/district/i.test(k)) {
      rawExtracted.step3_family_address.presentStateDistrict = v.toUpperCase();
    } else if (/nid|national\s*id/i.test(k)) {
      rawExtracted.step2_applicant_details.nationalIdNumber = v;
    } else if (/job|occupation|profession/i.test(k)) {
      if (/business/i.test(v)) rawExtracted.step3_family_address.occupation = 'BUSINESS PERSON';
      else if (/doctor/i.test(v)) rawExtracted.step3_family_address.occupation = 'DOCTOR';
      else if (/engineer|software/i.test(v)) rawExtracted.step3_family_address.occupation = 'ENGINEER';
      else if (/student/i.test(v)) rawExtracted.step3_family_address.occupation = 'STUDENT';
      else if (/house\s*wife/i.test(v)) rawExtracted.step3_family_address.occupation = 'HOUSE WIFE';
      else rawExtracted.step3_family_address.occupation = 'PRIVATE SERVICE';
      rawExtracted.step3_family_address.designation = v.toUpperCase();
    } else if (/employer|company|organization|office/i.test(k)) {
      rawExtracted.step3_family_address.employerName = v.toUpperCase();
    } else if (/hotel|india\s*stay|india\s*address/i.test(k)) {
      rawExtracted.step4_visa_references.referenceNameIndia = v.toUpperCase();
      rawExtracted.step8_stay_details.hotelName = v.toUpperCase();
      rawExtracted.step8_stay_details.address = v.toUpperCase();
    } else if (/bd\s*contact|relative|brother|emergency/i.test(k)) {
      rawExtracted.step4_visa_references.referenceNameBangladesh = v.toUpperCase();
    }
  }

  // Determine Mission from text
  if (/sylhet|moulvibazar|habiganj/i.test(rawText)) {
    rawExtracted.step1_registration.indianMission = 'BGDS';
  } else if (/chittagong|ctg|cox|comilla/i.test(rawText)) {
    rawExtracted.step1_registration.indianMission = 'BGDC';
  } else if (/rajshahi|bogra|rangpur|dinajpur/i.test(rawText)) {
    rawExtracted.step1_registration.indianMission = 'BGDR';
  } else if (/khulna|jessore|kushtia/i.test(rawText)) {
    rawExtracted.step1_registration.indianMission = 'BGDK';
  } else {
    rawExtracted.step1_registration.indianMission = 'BGDD';
  }

  // Determine Port
  if (/gede|darsana/i.test(rawText)) {
    rawExtracted.step4_visa_references.portOfArrival = 'BY ROAD GEDE';
  } else if (/air|flight/i.test(rawText) && !/haridaspur/i.test(rawText)) {
    rawExtracted.step4_visa_references.portOfArrival = 'BY AIR';
  } else {
    rawExtracted.step4_visa_references.portOfArrival = 'BY AIR/ HARIDASPUR';
  }

  const detectedFormat = isExcel ? 'excel' : isWhatsApp ? 'whatsapp' : 'unstructured';
  const profile = postSanitizeProfile(rawExtracted, notices);

  return {
    profile,
    detectedFormat,
    notices,
  };
}

/**
 * Main AI Profile Extractor with user-configurable model, base URL, temperature 1.0, and 3500 max tokens.
 */
export async function extractProfileFromText(rawText: string): Promise<ExtractionResult> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('No input text provided for extraction');
  }

  const sanitizationNotices: string[] = [];

  // Active high-speed provider configuration (api.hcnsec.cn)
  const activeBaseUrl = (
    process.env.AI_EXTRACTOR_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    'https://api.hcnsec.cn/v1'
  ).replace(/\/+$/, '');

  const activeApiKey =
    process.env.AI_EXTRACTOR_API_KEY ||
    process.env.MODEL_API_KEY ||
    process.env.OPENAI_API_KEY ||
    'sk-doC3kKWtUU44fFvsFJVQBN349PpYGUzvm6q8QlT6MnSizwKo';

  const activeModel = process.env.AI_EXTRACTOR_MODEL || process.env.MODEL_NAME || 'auto';
  const temperature = parseFloat(process.env.AI_TEMPERATURE || '1.0');
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '3500');

  // 1. Try Primary High-Speed Endpoint (api.hcnsec.cn / OpenAI compatible)
  if (activeApiKey) {
    try {
      const res = await fetch(`${activeBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeApiKey}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: 'system', content: CONSULAR_SYSTEM_PROMPT },
            { role: 'user', content: trimmed },
          ],
          response_format: { type: 'json_object' },
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          // Parse JSON (clean code fences if any)
          const cleanJsonStr = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          const parsed = JSON.parse(cleanJsonStr);
          const sanitized = postSanitizeProfile(parsed, sanitizationNotices);
          const fieldsCount = countPopulatedFields(sanitized);
          const actualModel = data.model || activeModel;

          return {
            success: true,
            profile: sanitized,
            fieldsCount,
            detectedFormat: rawText.includes('\t') ? 'excel' : 'unstructured',
            sanitizationNotices,
            providerUsed: `Consular AI (${actualModel} @ ${new URL(activeBaseUrl).hostname})`,
          };
        }
      } else {
        const errText = await res.text();
        console.warn(`Primary AI endpoint returned ${res.status}: ${errText.slice(0, 150)}`);
      }
    } catch (err: unknown) {
      console.warn('Primary AI API call failed, attempting fallback...', err instanceof Error ? err.message : String(err));
    }
  }

  // 2. Try Google Gemini Flash if configured
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (googleKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: trimmed }] }],
            systemInstruction: { parts: [{ text: CONSULAR_SYSTEM_PROMPT }] },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 1.0,
              maxOutputTokens: 3500,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const parsed = JSON.parse(content);
          const sanitized = postSanitizeProfile(parsed, sanitizationNotices);
          const fieldsCount = countPopulatedFields(sanitized);
          return {
            success: true,
            profile: sanitized,
            fieldsCount,
            detectedFormat: rawText.includes('\t') ? 'excel' : 'unstructured',
            sanitizationNotices,
            providerUsed: 'Google Gemini 2.0 Flash',
          };
        }
      }
    } catch (err) {
      console.warn('Google Gemini API failed...', err);
    }
  }

  // 3. Fallback to High-Precision Heuristics Engine
  const fallbackResult = extractWithHeuristics(trimmed);
  sanitizationNotices.push(...fallbackResult.notices);
  const fieldsCount = countPopulatedFields(fallbackResult.profile);

  return {
    success: true,
    profile: fallbackResult.profile,
    fieldsCount,
    detectedFormat: fallbackResult.detectedFormat,
    sanitizationNotices,
    providerUsed: 'PothikVisa Consular Heuristic Engine (Local Fallback)',
  };
}
