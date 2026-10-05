import QRCode from 'qrcode';
import { ApplicationRecord } from './db';
import { VisaApplicantProfile } from '@/types/profile';

export interface ChecklistItem {
  id: string;
  category: 'mandatory' | 'occupation' | 'visa_specific' | 'financial';
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  required: boolean;
  notesEn?: string;
  notesBn?: string;
}

export interface IvacCenterInfo {
  code: string;
  nameEn: string;
  nameBn: string;
  missionEn: string;
  missionBn: string;
  addressEn: string;
  addressBn: string;
  submissionHours: string;
  deliveryHours: string;
}

export interface IvacChecklistData {
  applicationId: string;
  webFileNumber: string;
  tempId: string | null;
  applicantName: string;
  passportNumber: string;
  dateOfBirth?: string;
  gender?: string;
  visaType: string;
  visaTypeLabelEn: string;
  visaTypeLabelBn: string;
  occupation: string;
  occupationLabelEn: string;
  occupationLabelBn: string;
  presentAddress: string;
  district: string;
  missionCode: string;
  centerInfo: IvacCenterInfo;
  verificationUrl: string;
  govtStatusUrl: string;
  qrCodeDataUrl: string;
  govtQrCodeDataUrl: string;
  generatedDate: string;
  items: ChecklistItem[];
}

export const IVAC_CENTERS: Record<string, IvacCenterInfo> = {
  DHAKA: {
    code: 'DHAKA',
    nameEn: 'IVAC Dhaka (Jamuna Future Park)',
    nameBn: 'আইভ্যাক ঢাকা (যমুনা ফিউচার পার্ক)',
    missionEn: 'High Commission of India, Dhaka',
    missionBn: 'ভারতীয় হাই কমিশন, ঢাকা',
    addressEn: 'Entry Gate-1, Floor B-2, South Court, Jamuna Future Park, Progoti Sharani, Dhaka-1229',
    addressBn: 'গেট-১, ফ্লোর বি-২, সাউথ কোর্ট, যমুনা ফিউচার পার্ক, প্রগতি সরণি, বারিধারা, ঢাকা-১২২৯',
    submissionHours: '09:00 AM – 01:00 PM (Sun–Thu)',
    deliveryHours: '02:00 PM – 06:00 PM (Sun–Thu)',
  },
  CHITTAGONG: {
    code: 'CHITTAGONG',
    nameEn: 'IVAC Chattogram',
    nameBn: 'আইভ্যাক চট্টগ্রাম',
    missionEn: 'Assistant High Commission of India, Chattogram',
    missionBn: 'সহকারী ভারতীয় হাই কমিশন, চট্টগ্রাম',
    addressEn: 'Habib Court, 564/701 Agrabad C/A, Chattogram',
    addressBn: 'হাবিব কোর্ট, ৫৬৪/৭০১ আগ্রাবাদ বাণিজ্যিক এলাকা, চট্টগ্রাম',
    submissionHours: '09:00 AM – 01:00 PM (Sun–Thu)',
    deliveryHours: '02:00 PM – 06:00 PM (Sun–Thu)',
  },
  SYLHET: {
    code: 'SYLHET',
    nameEn: 'IVAC Sylhet',
    nameBn: 'আইভ্যাক সিলেট',
    missionEn: 'Assistant High Commission of India, Sylhet',
    missionBn: 'সহকারী ভারতীয় হাই কমিশন, সিলেট',
    addressEn: 'Vidyaniketan School Campus, Subidbazar, Sylhet',
    addressBn: 'বিদ্যানিকেতন স্কুল ক্যাম্পাস, সুবিদবাজার, সিলেট',
    submissionHours: '09:00 AM – 01:00 PM (Sun–Thu)',
    deliveryHours: '02:00 PM – 06:00 PM (Sun–Thu)',
  },
  RAJSHAHI: {
    code: 'RAJSHAHI',
    nameEn: 'IVAC Rajshahi',
    nameBn: 'আইভ্যাক রাজশাহী',
    missionEn: 'Assistant High Commission of India, Rajshahi',
    missionBn: 'সহকারী ভারতীয় হাই কমিশন, রাজশাহী',
    addressEn: 'House 284/2, Housing Estate, Uposhohor, Rajshahi',
    addressBn: 'বাড়ি ২৮৪/২, হাউজিং এস্টেট, উপশহর, রাজশাহী',
    submissionHours: '09:00 AM – 01:00 PM (Sun–Thu)',
    deliveryHours: '02:00 PM – 06:00 PM (Sun–Thu)',
  },
  KHULNA: {
    code: 'KHULNA',
    nameEn: 'IVAC Khulna',
    nameBn: 'আইভ্যাক খুলনা',
    missionEn: 'Assistant High Commission of India, Khulna',
    missionBn: 'সহকারী ভারতীয় হাই কমিশন, খুলনা',
    addressEn: 'Dr. Mofizul Islam Building, Shib Bari More, Khulna',
    addressBn: 'ডা. মফিজুল ইসলাম বিল্ডিং, শিব বাড়ি মোড়, খুলনা',
    submissionHours: '09:00 AM – 01:00 PM (Sun–Thu)',
    deliveryHours: '02:00 PM – 06:00 PM (Sun–Thu)',
  },
};

/**
 * Maps mission selection code from form registration to center info.
 */
export function resolveCenterInfo(missionCode?: string): IvacCenterInfo {
  const code = (missionCode || '').toUpperCase();
  if (code.includes('CHITTAGONG')) return IVAC_CENTERS.CHITTAGONG;
  if (code.includes('SYLHET')) return IVAC_CENTERS.SYLHET;
  if (code.includes('RAJSHAHI')) return IVAC_CENTERS.RAJSHAHI;
  if (code.includes('KHULNA')) return IVAC_CENTERS.KHULNA;
  return IVAC_CENTERS.DHAKA;
}

/**
 * Generates high-resolution QR code data URL for any payload.
 */
export async function generateQrCode(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Generates QR code for direct counter scanner string.
 */
export async function generateApplicationQrCode(
  webFileNumber: string,
  passportNumber: string,
  applicantName: string
): Promise<string> {
  const payload = `IVAC-BD|FILE:${webFileNumber}|PASS:${passportNumber}|NAME:${applicantName}|VERIFIED:POTHIKVISA`;
  return generateQrCode(payload);
}

/**
 * Assembles dynamic checklist items tailored specifically to the applicant's visa type, occupation, and financial proof.
 */
export function buildChecklistItems(profile: Partial<VisaApplicantProfile>): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // ============================================================
  // 1. MANDATORY CORE DOCUMENTS
  // ============================================================
  items.push({
    id: 'm1_form',
    category: 'mandatory',
    titleEn: 'Printed & Signed Indian Visa Application Form',
    titleBn: 'মুদ্রিত ও স্বাক্ষরিত ইন্ডিয়ান ভিসা আবেদন ফর্ম',
    descEn: 'Original printed application with clear Web File Number at the top and barcode. Must be signed twice: under the photo on page 1, and at the bottom of page 2 matching passport signature.',
    descBn: 'ওয়েব ফাইল নম্বর ও বারকোড সম্বলিত মূল প্রিন্ট কপি। দুইটি স্বাক্ষর আবশ্যক: ১ম পাতায় ছবির নিচে এবং ২য় পাতার শেষে (পাসপোর্টের স্বাক্ষরের সাথে হুবহু মিল থাকতে হবে)।',
    required: true,
  });

  items.push({
    id: 'm2_passport',
    category: 'mandatory',
    titleEn: 'Original Current Passport + All Old Passports',
    titleBn: 'মূল বর্তমান পাসপোর্ট + সকল পুরাতন পাসপোর্ট',
    descEn: 'Original passport valid for at least 6 months with at least 2 blank pages. All previous original passports must be attached. If any old passport is lost, attach original Police GD and English translation.',
    descBn: 'ন্যূনতম ৬ মাস মেয়াদী মূল পাসপোর্ট (কমপক্ষে ২টি ফাঁকা পাতা থাকতে হবে)। সকল পুরাতন মূল পাসপোর্ট সাথে দিতে হবে। পুরাতন পাসপোর্ট হারিয়ে গেলে মূল পুলিশ জিডি ও ইংরেজি অনুবাদ কপি দিতে হবে।',
    required: true,
  });

  items.push({
    id: 'm3_photo',
    category: 'mandatory',
    titleEn: '1 Recent 2"×2" Color Photograph (White Background)',
    titleBn: '১ কপি সদ্য তোলা ২"×২" রঙিন ছবি (সাদা ব্যাকগ্রাউন্ড)',
    descEn: '51mm × 51mm square photo, matte/glossy finish, face covering 70-80%, ears fully visible, taken within the last 3 months. No white shirt, no spectacles or flash reflection.',
    descBn: '৫১ মিমি × ৫১ মিমি সাইজ, সাদা ব্যাকগ্রাউন্ড, মুখমণ্ডল ৭০-৮০% দৃশ্যমান এবং কান স্পষ্ট থাকতে হবে। সাদা জামা বা চশমা পরা ছবি গ্রহণযোগ্য নয় (ছবি ৩ মাসের পুরোনো হওয়া যাবে না)।',
    required: true,
  });

  items.push({
    id: 'm4_nid',
    category: 'mandatory',
    titleEn: 'National ID Card (NID) or Digital Birth Certificate',
    titleBn: 'জাতীয় পরিচয়পত্র (NID) অথবা অনলাইন জন্ম নিবন্ধন সনদ',
    descEn: 'Clear photocopy of applicant’s Smart NID / National ID card (front and back). For minors under 18 years, 17-digit English digital Birth Certificate copy.',
    descBn: 'আবেদনকারীর স্মার্ট কার্ড / জাতীয় পরিচয়পত্রের ফটোকপি। ১৮ বছরের কম বয়সীদের ক্ষেত্রে ১৭ ডিজিটের অনলাইন ডিজিটাল জন্ম নিবন্ধন সনদের ফটোকপি।',
    required: true,
  });

  items.push({
    id: 'm5_utility',
    category: 'mandatory',
    titleEn: 'Utility Bill Copy (Electricity / Gas / Water / Landline)',
    titleBn: 'বিদ্যুৎ / গ্যাস / পানি / ল্যান্ডলাইন বিলের কপি',
    descEn: 'Utility bill issued within the last 6 months. IMPORTANT: The address on the bill MUST match the Present Address entered in the visa application.',
    descBn: 'সর্বশেষ ৬ মাসের যেকোনো বিদ্যুৎ, গ্যাস বা পানির বিলের কপি। গুরুত্বপূর্ণ: বিলের ঠিকানার সাথে ভিসা ফর্মে প্রদত্ত বর্তমান ঠিকানার সম্পূর্ণ মিল থাকতে হবে।',
    required: true,
    notesEn: 'Address proof determines IVAC jurisdiction.',
    notesBn: 'ঠিকানা অনুযায়ী সঠিক আইভ্যাক সেন্টার নির্ধারিত হয়।',
  });

  // ============================================================
  // 2. FINANCIAL SOLVENCY PROOF
  // ============================================================
  items.push({
    id: 'f1_finance',
    category: 'financial',
    titleEn: 'Financial Solvency: Bank Statement or Dollar Endorsement',
    titleBn: 'আর্থিক স্বচ্ছলতার প্রমাণ: ব্যাংক স্টেটমেন্ট অথবা ডলার এনডোর্সমেন্ট',
    descEn: 'Original Bank Statement (last 6 months with minimum balance 20,000 BDT per applicant) with official bank seal and signature, OR international credit card with minimum $150 USD endorsed in current passport.',
    descBn: 'বিগত ৬ মাসের মূল ব্যাংক স্টেটমেন্ট (কমপক্ষে ২০,০০০ টাকা সমাপনী ব্যালেন্স) ব্যাংক সীল ও স্বাক্ষরসহ, অথবা আন্তর্জাতিক ক্রেডিট কার্ডে ন্যূনতম ১৫০ মার্কিন ডলার এনডোর্সমেন্ট কপি।',
    required: true,
  });

  // ============================================================
  // 3. OCCUPATION SPECIFIC DOCUMENTS
  // ============================================================
  const occ = (profile.step3_family_address?.occupation || '').toUpperCase();

  if (occ.includes('BUSINESS') || occ.includes('TRADE') || occ.includes('COMMERCE')) {
    items.push({
      id: 'o_business_trade',
      category: 'occupation',
      titleEn: 'Valid Trade License & Business Visiting Card',
      titleBn: 'হালনাগাদ ট্রেড লাইসেন্স ও বিজনেস ভিজিটিং কার্ড',
      descEn: 'Clear copy of latest renewed Trade License (with notarized English translation if in Bengali), applicant’s visiting card, and company letterhead.',
      descBn: 'সর্বশেষ নবায়নকৃত ট্রেড লাইসেন্সের ফটোকপি (বাংলায় থাকলে নোটারাইজড ইংরেজি অনুবাদসহ), ভিজিটিং কার্ড ও প্যাড।',
      required: true,
    });
  } else if (occ.includes('STUDENT')) {
    items.push({
      id: 'o_student_id',
      category: 'occupation',
      titleEn: 'Student ID Card & Leave Approval / NOC',
      titleBn: 'স্টুডেন্ট আইডি কার্ড ও ছুটির অনুমোদন / NOC',
      descEn: 'Clear copy of valid Student ID card, forwarded leave certificate/NOC from school/college/university, and parent’s financial guarantee statement.',
      descBn: 'শিক্ষা প্রতিষ্ঠানের বৈধ স্টুডেন্ট আইডি কার্ডের ফটোকপি, কর্তৃপক্ষের ছুটির ছাড়পত্র এবং পিতা-মাতার আর্থিক সহায়তার অঙ্গীকারনামা।',
      required: true,
    });
  } else if (occ.includes('HOUSEWIFE') || occ.includes('HOME MAKER')) {
    items.push({
      id: 'o_housewife_doc',
      category: 'occupation',
      titleEn: 'Husband / Sponsor Profession Proof & Marriage Certificate',
      titleBn: 'স্বামীর পেশাগত প্রমাণপত্র ও নিকাহনামা / বিবাহ সনদ',
      descEn: 'Copy of husband’s occupation proof (NOC / Trade license + Bank statement) and Marriage Certificate (Nikahnama) with English translation.',
      descBn: 'স্বামীর কর্মস্থল থেকে NOC অথবা ট্রেড লাইসেন্স, স্বামীর ব্যাংক স্টেটমেন্ট ও নিকাহনামা/বিবাহ সনদের কপি।',
      required: true,
    });
  } else if (occ.includes('RETIRED')) {
    items.push({
      id: 'o_retired_doc',
      category: 'occupation',
      titleEn: 'Retirement Order / Pension Book Copy',
      titleBn: 'অবসর গ্রহণের আদেশ / পেনশন বইয়ের কপি',
      descEn: 'Official retirement notification, pension book copy, or superannuation certificate.',
      descBn: 'সরকারি বা বেসরকারি প্রতিষ্ঠানের অবসর সংক্রান্ত আদেশের কপি বা পেনশন বইয়ের ফটোকপি।',
      required: true,
    });
  } else if (occ.includes('GOVERNMENT') || occ.includes('POLICE') || occ.includes('DEFENCE')) {
    items.push({
      id: 'o_gov_noc',
      category: 'occupation',
      titleEn: 'Government Order (GO) / Official No Objection Certificate (NOC)',
      titleBn: 'সরকারি আদেশ (GO) / বিভাগীয় অনাপত্তিপত্র (NOC)',
      descEn: 'Mandatory Government Order (GO) or ministry-issued NOC permitting foreign travel to India.',
      descBn: 'ভারত গমনের জন্য সংশ্লিষ্ট মন্ত্রণালয় বা বিভাগীয় কর্তৃপক্ষ কর্তৃক জারীকৃত মূল সরকারি আদেশ (GO) বা NOC।',
      required: true,
    });
  } else {
    // Default Private Service / Employed
    items.push({
      id: 'o_service_noc',
      category: 'occupation',
      titleEn: 'Employment No Objection Certificate (NOC) & Employee ID',
      titleBn: 'চাকরির অনাপত্তিপত্র (NOC) ও অফিস আইডি কার্ড',
      descEn: 'Original NOC on company letterhead pad with official seal, mentioning designation, joining date, leave period, and company contact details, plus employee ID card copy and visiting card.',
      descBn: 'কোম্পানির মূল লেটারহেড প্যাডে অফিসিয়াল সিলসহ NOC (পদবী, যোগদানের তারিখ ও ছুটির মেয়াদ উল্লেখ থাকতে হবে), অফিস আইডি কার্ড ও ভিজিটিং কার্ড।',
      required: true,
    });
  }

  // ============================================================
  // 4. VISA PURPOSE SPECIFIC DOCUMENTS
  // ============================================================
  const visaPurpose = (profile.step1_registration?.visaPurpose || '544').toString();

  if (visaPurpose === '543' || visaPurpose.includes('MED')) {
    // Medical Visa
    items.push({
      id: 'v_med_invitation',
      category: 'visa_specific',
      titleEn: 'Official Indian Hospital Invitation Letter (Original/Email)',
      titleBn: 'ভারতের হাসপাতালের অফিশিয়াল আমন্ত্রণপত্র (ইনভিটেশন লেটার)',
      descEn: 'Original invitation letter from a recognized hospital in India on hospital letterhead, clearly stating patient name, passport number, doctor name, and estimated appointment date.',
      descBn: 'ভারতের স্বীকৃত হাসপাতাল থেকে রোগীর নাম, পাসপোর্ট নম্বর, চিকিৎসকের নাম ও সম্ভাব্য তারিখ সম্বলিত মূল ইনভিটেশন লেটার।',
      required: true,
    });
    items.push({
      id: 'v_med_reports',
      category: 'visa_specific',
      titleEn: 'Bangladeshi Doctor’s Referral Letter & Medical Reports',
      titleBn: 'বাংলাদেশী চিকিৎসকের রেফারেন্স ও বিগত ৩-৬ মাসের মেডিকেল টেস্ট রিপোর্ট',
      descEn: 'Referral/recommendation letter from a registered Bangladeshi doctor/hospital, along with all recent diagnosis reports, prescriptions, and lab tests.',
      descBn: 'বিএমডিসি নিবন্ধিত বাংলাদেশী চিকিৎসকের রেফারেন্স লেটার এবং সাম্প্রতিক ৩-৬ মাসের সকল প্রেসক্রিপশন ও ডায়াগনস্টিক রিপোর্ট।',
      required: true,
    });
    items.push({
      id: 'v_med_attendant',
      category: 'visa_specific',
      titleEn: 'Medical Attendant Form & Relationship Proof (If Attendant travels)',
      titleBn: 'মেডিকেল এটেনডেন্ট ফর্ম ও সম্পর্ক প্রমাণের দলিল (যদি সহযোগী যায়)',
      descEn: 'Medical Attendant visa form with hospital letter mentioning attendant name and passport, plus relationship proof (NID / Birth certificate / Marriage certificate).',
      descBn: 'হাসপাতালের চিঠিতে সহযোগীর নাম ও পাসপোর্ট নম্বর উল্লেখ থাকতে হবে এবং রক্তের বা বৈবাহিক সম্পর্কের প্রামাণ্য দলিল সংযুক্ত করতে হবে।',
      required: false,
    });
  } else if (visaPurpose === '542' || visaPurpose.includes('BUS')) {
    // Business Visa
    items.push({
      id: 'v_bus_invitation',
      category: 'visa_specific',
      titleEn: 'Formal Invitation Letter from Indian Company',
      titleBn: 'ভারতীয় কোম্পানির অফিশিয়াল আমন্ত্রণপত্র (বিজনেস ইনভিটেশন)',
      descEn: 'Formal business invitation letter from Indian counterpart company on company letterhead mentioning CIN/GSTIN number, duration, and purpose of business meetings.',
      descBn: 'ভারতীয় পার্টনার কোম্পানির লেটারহেডে পাঠানো আমন্ত্রণপত্র (GSTIN/CIN নম্বর ও সফরের উদ্দেশ্য সুস্পষ্ট থাকতে হবে)।',
      required: true,
    });
    items.push({
      id: 'v_bus_chamber',
      category: 'visa_specific',
      titleEn: 'Chamber of Commerce Recommendation Letter / IRC / ERC',
      titleBn: 'চেম্বার অব কমার্স প্রত্যয়নপত্র / আমদানি-রপ্তানি সনদ (IRC/ERC)',
      descEn: 'Recommendation letter from recognized Trade Body (FBCCI, DCCI, BGMEA, etc.) or valid Import/Export registration certificates and LC copy.',
      descBn: 'স্বীকৃত ব্যবসায়ী সংগঠন (FBCCI, DCCI ইত্যাদি) থেকে সুপারিশপত্র অথবা হালনাগাদ IRC/ERC ও পূর্ববর্তী এলসি-র কপি।',
      required: true,
    });
  } else if (visaPurpose === '547' || visaPurpose.includes('TRAN')) {
    // Transit Visa
    items.push({
      id: 'v_trans_ticket',
      category: 'visa_specific',
      titleEn: 'Confirmed Onward Travel Ticket through India',
      titleBn: 'ভারত হয়ে তৃতীয় দেশে গমনের নিশ্চিত ভ্রমণ টিকিট',
      descEn: 'Confirmed air or train ticket departing India to the final destination within 72 hours.',
      descBn: '৭২ ঘণ্টার মধ্যে ভারত ত্যাগ করে গন্তব্য দেশে পৌঁছানোর নিশ্চিত বিমান বা ট্রেনের টিকিট।',
      required: true,
    });
    items.push({
      id: 'v_trans_visa',
      category: 'visa_specific',
      titleEn: 'Valid Entry Visa for Destination Country',
      titleBn: 'চূড়ান্ত গন্তব্য দেশের বৈধ ভিসা',
      descEn: 'Valid visa of the final destination country (or valid visa exemption / residence permit).',
      descBn: 'যে দেশে ভ্রমণ করবেন সেই দেশের কার্যকর বৈধ প্রবেশ ভিসা বা রেসিডেন্স পারমিট।',
      required: true,
    });
  } else {
    // Tourist Visa (544)
    items.push({
      id: 'v_tourist_booking',
      category: 'visa_specific',
      titleEn: 'Hotel Booking Confirmation / Tour Itinerary (Recommended)',
      titleBn: 'হোটেল বুকিং কনফার্মেশন অথবা ভ্রমণের পরিকল্পনা (সুপারিশকৃত)',
      descEn: 'Confirmed hotel reservation in India matching the city/dates mentioned in the application, or day-by-day travel plan.',
      descBn: 'আবেদনপত্রে উল্লেখিত ভারতের হোটেলের বুকিং রশিদ বা ভ্রমণসূচীর কপি (সংযুক্ত করলে ভিসা পাওয়ার সম্ভাবনা বৃদ্ধি পায়)।',
      required: false,
    });
  }

  return items;
}

/**
 * Builds the complete IVAC Checklist and Submission Data structure for an application.
 */
export async function getIvacChecklistData(
  application: ApplicationRecord,
  baseUrl?: string
): Promise<IvacChecklistData> {
  let profile: Partial<VisaApplicantProfile> = {};
  try {
    profile = JSON.parse(application.form_data_json || '{}') as Partial<VisaApplicantProfile>;
  } catch {}

  const webFileNumber = application.web_file_number || application.temp_id || `APP-${application.id.slice(0, 8).toUpperCase()}`;
  const passportNumber = application.passport_number || profile.step2_applicant_details?.passportNumber || 'N/A';
  const applicantName = application.applicant_name || `${profile.step2_applicant_details?.givenName || ''} ${profile.step2_applicant_details?.surname || ''}`.trim() || 'APPLICANT';

  const missionCode = profile.step1_registration?.indianMission || 'BANGLADESH-DHAKA';
  const centerInfo = resolveCenterInfo(missionCode);

  // Digital verification URL (Option 3): Scanning with phone camera opens digital checklist with 1-click PDF download
  const appBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${appBaseUrl.replace(/\/$/, '')}/applications/${application.id}/checklist`;
  const govtStatusUrl = 'https://indianvisa-bangladesh.nic.in/visa/StatusEnquiry';

  const qrCodeDataUrl = await generateQrCode(verificationUrl);
  const govtQrCodeDataUrl = await generateQrCode(govtStatusUrl);

  const visaType = application.visa_type || profile.step1_registration?.visaPurpose || '544';
  let visaTypeLabelEn = 'Tourist Visa (544)';
  let visaTypeLabelBn = 'ট্যুরিস্ট ভিসা (৫৪৪)';
  if (visaType === '543' || String(visaType).includes('MED')) {
    visaTypeLabelEn = 'Medical Visa (543)';
    visaTypeLabelBn = 'মেডিকেল ভিসা (৫৪৩)';
  } else if (visaType === '542' || String(visaType).includes('BUS')) {
    visaTypeLabelEn = 'Business Visa (542)';
    visaTypeLabelBn = 'বিজনেস ভিসা (৫৪২)';
  } else if (visaType === '547' || String(visaType).includes('TRAN')) {
    visaTypeLabelEn = 'Transit Visa (547)';
    visaTypeLabelBn = 'ট্রানজিট ভিসা (৫৪৭)';
  }

  const occupation = profile.step3_family_address?.occupation || 'PRIVATE SERVICE';
  let occupationLabelEn: string = occupation;
  let occupationLabelBn: string = occupation;
  const upperOcc = occupation.toUpperCase();
  if (upperOcc.includes('BUSINESS')) {
    occupationLabelEn = 'Business / Self-Employed';
    occupationLabelBn = 'ব্যবসা / স্ব-উদ্যোগ';
  } else if (upperOcc.includes('STUDENT')) {
    occupationLabelEn = 'Student';
    occupationLabelBn = 'শিক্ষার্থী';
  } else if (upperOcc.includes('HOUSE WIFE') || upperOcc.includes('HOUSEWIFE')) {
    occupationLabelEn = 'Housewife / Homemaker';
    occupationLabelBn = 'গৃহিণী';
  } else if (upperOcc.includes('RETIRED')) {
    occupationLabelEn = 'Retired';
    occupationLabelBn = 'অবসরপ্রাপ্ত';
  } else if (upperOcc.includes('GOV') || upperOcc.includes('POLICE') || upperOcc.includes('MILITARY')) {
    occupationLabelEn = 'Government Service';
    occupationLabelBn = 'সরকারি চাকরি';
  } else {
    occupationLabelEn = 'Private Service / Employed';
    occupationLabelBn = 'চাকরিজীবী';
  }

  const presentAddress = [
    profile.step3_family_address?.presentAddressLine1,
    profile.step3_family_address?.presentCity,
    profile.step3_family_address?.presentStateDistrict,
  ]
    .filter(Boolean)
    .join(', ') || 'N/A';

  const district = profile.step3_family_address?.presentStateDistrict || 'DHAKA';

  const items = buildChecklistItems(profile);

  return {
    applicationId: application.id,
    webFileNumber,
    tempId: application.temp_id || null,
    applicantName,
    passportNumber,
    dateOfBirth: profile.step1_registration?.dateOfBirth,
    gender: profile.step2_applicant_details?.gender,
    visaType: String(visaType),
    visaTypeLabelEn,
    visaTypeLabelBn,
    occupation,
    occupationLabelEn,
    occupationLabelBn,
    presentAddress,
    district,
    missionCode,
    centerInfo,
    verificationUrl,
    govtStatusUrl,
    qrCodeDataUrl,
    govtQrCodeDataUrl,
    generatedDate: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    items,
  };
}
