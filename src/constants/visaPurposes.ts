export interface VisaPurposeOption {
  code: string;
  category: 'Tourist' | 'Medical' | 'Business' | 'Student' | 'Transit' | 'Employment' | 'Entry / Misc' | 'Conference';
  labelEn: string;
  labelBn: string;
  description: string;
  descriptionBn: string;
}

export const ALL_VISA_PURPOSES: VisaPurposeOption[] = [
  // Tourist
  {
    code: '544',
    category: 'Tourist',
    labelEn: 'TOURIST VISA (T1) — Tourism, Recreation & Sightseeing',
    labelBn: 'ট্যুরিস্ট ভিসা (T1) — ভ্রমণ ও দর্শনীয় স্থান পরিদর্শন',
    description: 'For tourism recreation, sightseeing, casual visit to friends or relatives.',
    descriptionBn: 'ভ্রমণ, দর্শনীয় স্থান পরিদর্শন এবং আত্মীয়-স্বজন বা বন্ধুদের সাথে সাক্ষাতের জন্য।',
  },
  {
    code: '508',
    category: 'Tourist',
    labelEn: 'TOURIST VISA (T2) — Mountaineering Expeditions',
    labelBn: 'ট্যুরিস্ট ভিসা (T2) — পর্বতারোহণ অভিযান',
    description: 'For foreign nationals coming for mountaineering expeditions.',
    descriptionBn: 'ভারতের অনুমোদিত অঞ্চলে ট্রেকিং বা পর্বতারোহণ অভিযানের জন্য।',
  },

  // Medical
  {
    code: '515',
    category: 'Medical',
    labelEn: 'MEDICAL VISA (MED1) — Medical Treatment for Patient',
    labelBn: 'মেডিকেল ভিসা (MED1) — রোগীর চিকিৎসা সেবা',
    description: 'For patients seeking medical treatment in recognized Indian hospitals.',
    descriptionBn: 'ভারতের স্বীকৃত হাসপাতাল বা স্বাস্থ্যকেন্দ্রে চিকিৎসার জন্য রোগীর আবেদন।',
  },
  {
    code: '516',
    category: 'Medical',
    labelEn: 'MEDICAL ATTENDANT VISA (MED2) — Medical Escort / Attendant',
    labelBn: 'মেডিকেল অ্যাটেনডেন্ট ভিসা (MED2) — রোগীর সহযাত্রী',
    description: 'For spouse/children/blood relatives accompanying a patient under Medical Visa.',
    descriptionBn: 'মেডিকেল ভিসাপ্রাপ্ত রোগীর সাথে সফরকারী পরিবার বা রক্তসম্পর্কের সহযাত্রীদের জন্য।',
  },

  // Business
  {
    code: '537',
    category: 'Business',
    labelEn: 'BUSINESS VISA (B1) — Commercial & Business Activities',
    labelBn: 'বিজনেস ভিসা (B1) — বাণিজ্যিক ও ব্যবসায়িক কাজ',
    description: 'For meetings, trade, sales, exhibitions, purchasing, and business partnerships.',
    descriptionBn: 'ব্যবসায়িক বৈঠক, বাণিজ্য মেলা, পণ্য ক্রয়-বিক্রয় ও ব্যবসায়িক চুক্তির জন্য।',
  },
  {
    code: '502',
    category: 'Business',
    labelEn: 'BUSINESS VISA (B5) — Conference & Seminars',
    labelBn: 'বিজনেস ভিসা (B5) — আন্তর্জাতিক কনফারেন্স ও সেমিনার',
    description: 'For attending international conferences, seminars, or workshops.',
    descriptionBn: 'আন্তর্জাতিক সেমিনার, কর্মশালা ও একাডেমিক কনফারেন্সে অংশগ্রহণের জন্য।',
  },
  {
    code: '538',
    category: 'Business',
    labelEn: 'BUSINESS VISA (B2) — Sports Persons & Coaches',
    labelBn: 'বিজনেস ভিসা (B2) — খেলোয়াড় ও প্রশিক্ষক',
    description: 'For commercial sports events and contracts.',
    descriptionBn: 'পেশাদার খেলাধুলা ও কোচিং চুক্তির আওতায় সফরকারী ক্রীড়াবিদদের জন্য।',
  },

  // Student
  {
    code: '540',
    category: 'Student',
    labelEn: 'STUDENT VISA (S1) — Higher Education & University',
    labelBn: 'স্টুডেন্ট ভিসা (S1) — উচ্চশিক্ষা ও বিশ্ববিদ্যালয়',
    description: 'For higher education, South Asian University, Nalanda, and exchange programs.',
    descriptionBn: 'স্বীকৃত ভারতীয় বিশ্ববিদ্যালয় ও প্রতিষ্ঠানে স্নাতক, স্নাতকোত্তর বা উচ্চশিক্ষার জন্য।',
  },
  {
    code: '243',
    category: 'Student',
    labelEn: 'STUDENT VISA (S2) — School Education',
    labelBn: 'স্টুডেন্ট ভিসা (S2) — বিদ্যালয় শিক্ষা',
    description: 'For school education in recognized Indian institutions.',
    descriptionBn: 'ভারতের স্বীকৃত স্কুল ও বোর্ডিং প্রতিষ্ঠানে প্রাতিষ্ঠানিক শিক্ষার জন্য।',
  },
  {
    code: '542',
    category: 'Student',
    labelEn: 'STUDENT VISA (S4) — Research Scholar',
    labelBn: 'স্টুডেন্ট ভিসা (S4) — গবেষণা ও ফেলোশিপ',
    description: 'For research faculty and bilateral academic exchange.',
    descriptionBn: 'পিএইচডি, পোস্ট-ডক্টরাল গবেষণা বা প্রাতিষ্ঠানিক ফেলোশিপের জন্য।',
  },

  // Transit
  {
    code: '233',
    category: 'Transit',
    labelEn: 'TRANSIT VISA (TR) — Travel Through India',
    labelBn: 'ট্রানজিট ভিসা (TR) — ভারতের মাধ্যমে তৃতীয় দেশে যাত্রা',
    description: 'For traveling through India to a destination outside India.',
    descriptionBn: 'ভারতের কোনো বিমানবন্দর বা বন্দর হয়ে তৃতীয় কোনো দেশে যাওয়ার জন্য ট্রানজিট।',
  },

  // Entry & Miscellaneous
  {
    code: '532',
    category: 'Entry / Misc',
    labelEn: 'MISCELLANEOUS VISA (X3) — Double Entry (Bangladeshi Nationals)',
    labelBn: 'বিবিধ ভিসা (X3) — ডাবল এন্ট্রি (বাংলাদেশি নাগরিক)',
    description: 'Double entry visa for Bangladeshi nationals visiting third-country embassies.',
    descriptionBn: 'ভারতে অবস্থিত অন্যান্য দেশের দূতাবাসে ভিসা সাক্ষাত্কারের জন্য ডাবল এন্ট্রি ভিসা।',
  },
  {
    code: '509',
    category: 'Entry / Misc',
    labelEn: 'MISCELLANEOUS VISA (X1) — Person of Indian Origin / Spouse',
    labelBn: 'বিবিধ ভিসা (X1) — ভারতীয় বংশোদ্ভূত বা স্পাউস',
    description: 'For spouse/children of Indian citizens or PIO.',
    descriptionBn: 'ভারতীয় নাগরিকের স্বামী/স্ত্রী ও সন্তানদের পারিবারিক ভিজিটের জন্য।',
  },
  {
    code: '511',
    category: 'Entry / Misc',
    labelEn: 'MISCELLANEOUS VISA (X-Misc) — General Miscellaneous',
    labelBn: 'বিবিধ ভিসা (X-Misc) — অন্যান্য বিশেষ প্রয়োজন',
    description: 'For legitimate purposes not covered under standard categories.',
    descriptionBn: 'অন্যান্য বিশেষ যৌক্তিক কারণের জন্য সংরক্ষিত সাধারণ এন্ট্রি ভিসা।',
  },

  // Employment
  {
    code: '533',
    category: 'Employment',
    labelEn: 'WORK VISA (E1) — Employment & Corporate Transfer',
    labelBn: 'কর্মসংস্থান ভিসা (E1) — চাকরি ও করপোরেট বদলি',
    description: 'For employment in India and intra-company transfers.',
    descriptionBn: 'ভারতে নিবন্ধিত প্রতিষ্ঠানে বৈধ নিয়োগপত্র বা করপোরেট ট্রান্সফারের আওতায় চাকরির জন্য।',
  },
];

export const VISA_CATEGORIES = [
  'All',
  'Tourist',
  'Medical',
  'Business',
  'Student',
  'Transit',
  'Entry / Misc',
  'Employment',
] as const;

export const VISA_CATEGORY_NAMES_BN: Record<string, string> = {
  'All': 'সকল',
  'Tourist': 'ট্যুরিস্ট',
  'Medical': 'মেডিকেল',
  'Business': 'বিজনেস',
  'Student': 'স্টুডেন্ট',
  'Transit': 'ট্রানজিট',
  'Entry / Misc': 'এন্ট্রি ও অন্যান্য',
  'Employment': 'কর্মসংস্থান',
  'Conference': 'কনফারেন্স',
};
