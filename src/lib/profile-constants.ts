import { SearchableOption } from '@/components/ui/searchable-select';
import { VisaPurposeCode, IndianMissionCode, PreviousVisaTypeCode, SaarcCountryCode, IndianStateName } from '@/types/profile';
import indiaStatesDistrictsData from './india-states-districts.json';

export const INDIAN_MISSION_OPTIONS: SearchableOption[] = [
  {
    value: 'BGDD',
    label: 'Dhaka (BGDD) - High Commission of India',
    description: 'ঢাকা - ভারতীয় হাই কমিশন',
    group: 'Mission',
  },
  {
    value: 'BGDC',
    label: 'Chittagong (BGDC) - Assistant High Commission',
    description: 'চট্টগ্রাম - সহকারী হাই কমিশন',
    group: 'Mission',
  },
  {
    value: 'BGDR',
    label: 'Rajshahi (BGDR) - Assistant High Commission',
    description: 'রাজশাহী - সহকারী হাই কমিশন',
    group: 'Mission',
  },
  {
    value: 'BGDS',
    label: 'Sylhet (BGDS) - Assistant High Commission',
    description: 'সিলেট - সহকারী হাই কমিশন',
    group: 'Mission',
  },
  {
    value: 'BGDK',
    label: 'Khulna (BGDK) - Assistant High Commission',
    description: 'খুলনা - সহকারী হাই কমিশন',
    group: 'Mission',
  },
];

export const VISA_PURPOSE_OPTIONS: SearchableOption[] = [
  {
    value: '544',
    label: 'Tourist Visa (T1) - Recreation & Sightseeing (Code 544)',
    description: 'ট্যুরিস্ট ভিসা - ভ্রমণ ও বিনোদন',
  },
  {
    value: '515',
    label: 'Medical Visa (MED1) - Treatment for Patient (Code 515)',
    description: 'মেডিকেল ভিসা - রোগীর চিকিৎসার জন্য',
  },
  {
    value: '516',
    label: 'Medical Attendant Visa (MED2) - Patient Escort (Code 516)',
    description: 'মেডিকেল সহযোগী ভিসা - রোগীর সঙ্গী/পরিচর্যাকারী',
  },
  {
    value: '537',
    label: 'Business Visa (B1) - Commercial Activities (Code 537)',
    description: 'বিজনেস ভিসা - বাণিজ্যিক ও ব্যবসায়িক কার্যক্রম',
  },
  {
    value: '502',
    label: 'Business Visa (B5) - International Conference & Seminar (Code 502)',
    description: 'কনফারেন্স ও সেমিনার ভিসা',
  },
  {
    value: '540',
    label: 'Student Visa (S1) - University & Higher Education (Code 540)',
    description: 'স্টুডেন্ট ভিসা - উচ্চশিক্ষা ও বিশ্ববিদ্যালয়',
  },
  {
    value: '243',
    label: 'Student Visa (S2) - Primary & School Education (Code 243)',
    description: 'স্কুল শিক্ষা ভিসা',
  },
  {
    value: '542',
    label: 'Student Visa (S4) - Research Scholars (Code 542)',
    description: 'গবেষণা ফেলোশিপ ও রিসার্চ ভিসা',
  },
  {
    value: '233',
    label: 'Transit Visa (TR) - Direct Travel Through India (Code 233)',
    description: 'ট্রানজিট ভিসা - ভারতের মাধ্যমে অন্য দেশে গমন',
  },
  {
    value: '532',
    label: 'Double Entry Visa (X3) - Bangladeshi Nationals (Code 532)',
    description: 'ডাবল এন্ট্রি ভিসা - বাংলাদেশি নাগরিকদের জন্য বিশেষ ব্যবস্থা',
  },
  {
    value: '508',
    label: 'Tourist Visa (T2) - Mountaineering & Trekking (Code 508)',
    description: 'পর্বতারোহণ ও ট্র্যাকিং ভিসা',
  },
  {
    value: '509',
    label: 'Entry Visa (X1) - Person of Indian Origin / Spouse (Code 509)',
    description: 'ভারতীয় বংশোদ্ভূত বা ভারতীয় নাগরিকের স্বামী/স্ত্রী',
  },
  {
    value: '533',
    label: 'Employment Visa (E1) - Corporate & Work Transfer (Code 533)',
    description: 'এমপ্লয়মেন্ট / চাকরি ভিসা',
  },
  {
    value: '534',
    label: 'Employment Visa (E2) - Registered NGOs (Code 534)',
    description: 'এনজিও চাকরি ভিসা',
  },
  {
    value: '538',
    label: 'Sports Visa (B2) - Sports Tournaments & Coaches (Code 538)',
    description: 'ক্রীড়া প্রতিযোগিতা ও কোচিং ভিসা',
  },
  {
    value: '539',
    label: 'Artist Visa (B3) - Cultural & Commercial Shows (Code 539)',
    description: 'সাংস্কৃতিক অনুষ্ঠান ও শিল্পী ভিসা',
  },
  {
    value: '511',
    label: 'General Entry Visa (X-Misc) (Code 511)',
    description: 'সাধারণ বিবিধ এন্ট্রি ভিসা',
  },
];

export const GENDER_OPTIONS: SearchableOption[] = [
  { value: 'M', label: 'Male (M) / পুরুষ', description: 'পুরুষ আবেদনকারী' },
  { value: 'F', label: 'Female (F) / নারী', description: 'নারী আবেদনকারী' },
  { value: 'X', label: 'Transgender / Other (X) / অন্যান্য', description: 'অন্যান্য লিঙ্গ' },
];

export const RELIGION_OPTIONS: SearchableOption[] = [
  { value: 'ISLAM', label: 'Islam / ইসলাম', description: 'মুসলিম ধর্মাবলম্বী' },
  { value: 'HINDU', label: 'Hinduism / হিন্দু', description: 'সনাতন ধর্মাবলম্বী' },
  { value: 'BUDDHISM', label: 'Buddhism / বৌদ্ধ', description: 'বৌদ্ধ ধর্মাবলম্বী' },
  { value: 'CHRISTIAN', label: 'Christianity / খ্রিষ্টান', description: 'খ্রিষ্টধর্মাবলম্বী' },
  { value: 'SIKH', label: 'Sikhism / শিখ', description: 'শিখ ধর্মাবলম্বী' },
  { value: 'JAINISM', label: 'Jainism / জৈন', description: 'জৈন ধর্মাবলম্বী' },
  { value: 'BAHAI', label: 'Bahai / বাহাই', description: 'বাহাই ধর্মাবলম্বী' },
  { value: 'JUDAISM', label: 'Judaism / ইহুদি', description: 'ইহুদি ধর্মাবলম্বী' },
  { value: 'PARSI', label: 'Parsi / পারসি', description: 'জরথুস্ত্রীয় / পারসি' },
  { value: 'OTHERS', label: 'Others / অন্যান্য', description: 'অন্যান্য ধর্ম' },
];

export const EDUCATION_OPTIONS: SearchableOption[] = [
  { value: 'GRADUATE', label: 'Graduate / স্নাতক (Degree / Honours)', description: 'ডিগ্রি বা অনার্স পাস' },
  { value: 'POST GRADUATE', label: 'Post Graduate / স্নাতকোত্তর (Masters)', description: 'মাস্টার্স সম্পন্ন' },
  { value: 'HIGHER SECONDARY', label: 'Higher Secondary / উচ্চ মাধ্যমিক (HSC / 12th)', description: 'এইচএসসি বা সমমান' },
  { value: 'MATRICULATION', label: 'Matriculation / মাধ্যমিক (SSC / 10th)', description: 'এসএসসি বা সমমান' },
  { value: 'PROFESSIONAL', label: 'Professional / পেশাগত ডিগ্রি (CA / Engineering / Medical)', description: 'পেশাদারি সনদ' },
  { value: 'BELOW MATRICULATION', label: 'Below Matriculation / প্রাথমিক ও নিম্ন মাধ্যমিক', description: '৮ম শ্রেণি বা সমমান' },
  { value: 'NA BEING MINOR', label: 'NA Being Minor / অপ্রাপ্তবয়স্ক', description: 'শিশু বা নাবালক' },
  { value: 'ILLITERATE', label: 'Illiterate / অনানুষ্ঠানিক', description: 'প্রাতিষ্ঠানিক শিক্ষাহীন' },
  { value: 'OTHERS', label: 'Others / অন্যান্য', description: 'অন্যান্য শিক্ষাগত যোগ্যতা' },
];

export const MARITAL_STATUS_OPTIONS: SearchableOption[] = [
  { value: 'SINGLE', label: 'Single / Unmarried / অবিবাহিত', description: 'অবিবাহিত ব্যক্তি' },
  { value: 'MARRIED', label: 'Married / বিবাহিত', description: 'বিবাহিত ব্যক্তি' },
];

export const NATIONALITY_ACQUISITION_OPTIONS: SearchableOption[] = [
  { value: 'BY BIRTH', label: 'By Birth / জন্মসূত্রে', description: 'জন্মসূত্রে বাংলাদেশি' },
  { value: 'NATURALIZATION', label: 'Naturalization / নাগরিকত্ব প্রাপ্ত', description: 'আবেদনের মাধ্যমে নাগরিকত্ব' },
];

export const COUNTRY_OPTIONS: SearchableOption[] = [
  { value: 'BGD', label: 'BANGLADESH (BGD) / বাংলাদেশ', description: 'বাংলাদেশ' },
  { value: 'IND', label: 'INDIA (IND) / ভারত', description: 'ভারত' },
  { value: 'PAK', label: 'PAKISTAN (PAK) / পাকিস্তান' },
  { value: 'USA', label: 'UNITED STATES (USA) / যুক্তরাষ্ট্র' },
  { value: 'GBR', label: 'UNITED KINGDOM (GBR) / যুক্তরাজ্য' },
  { value: 'CAN', label: 'CANADA (CAN) / কানাডা' },
  { value: 'AUS', label: 'AUSTRALIA (AUS) / অস্ট্রেলিয়া' },
  { value: 'MYS', label: 'MALAYSIA (MYS) / মালয়েশিয়া' },
  { value: 'SGP', label: 'SINGAPORE (SGP) / সিঙ্গাপুর' },
  { value: 'ARE', label: 'UNITED ARAB EMIRATES (ARE) / সংযুক্ত আরব আমিরাত' },
  { value: 'SAU', label: 'SAUDI ARABIA (SAU) / সৌদি আরব' },
  { value: 'NPL', label: 'NEPAL (NPL) / নেপাল' },
  { value: 'BTN', label: 'BHUTAN (BTN) / ভুটান' },
  { value: 'LKA', label: 'SRI LANKA (LKA) / শ্রীলঙ্কা' },
  { value: 'MDV', label: 'MALDIVES (MDV) / মালদ্বীপ' },
  { value: 'AFG', label: 'AFGHANISTAN (AFG) / আফগানিস্তান' },
  { value: 'MMR', label: 'MYANMAR (MMR) / মিয়ানমার' },
  { value: 'CHN', label: 'CHINA (CHN) / চীন' },
  { value: 'JPN', label: 'JAPAN (JPN) / জাপান' },
  { value: 'DEU', label: 'GERMANY (DEU) / জার্মানি' },
  { value: 'FRA', label: 'FRANCE (FRA) / ফ্রান্স' },
  { value: 'ITA', label: 'ITALY (ITA) / ইতালি' },
];

export const PORT_OPTIONS: SearchableOption[] = [
  { value: 'BY AIR', label: 'BY AIR (All International Airports) / আকাশপথ', description: 'ঢাকা, চট্টগ্রাম, সিলেট বা যেকোনো আন্তর্জাতিক বিমানবন্দর' },
  { value: 'BY AIR/ HARIDASPUR', label: 'BY AIR/ HARIDASPUR / বিমান অথবা হরিদাসপুর সড়কপথ', description: 'উভয় পথ উন্মুক্ত (আকাশপথ বা বেনাপোল-পেট্রাপোল)' },
  { value: 'BY RAIL CHITPUR', label: 'BY RAIL CHITPUR (Maitree Express) / চিৎপুর রেলওয়ে স্টেশন (কলকাতা)', description: 'মৈত্রী এক্সপ্রেস (ঢাকা ক্যান্টনমেন্ট - কলকাতা)' },
  { value: 'BY RAIL GEDE', label: 'BY RAIL GEDE (Darshana - Gede) / গেদে রেলপথ', description: 'দর্শনা-গেদে রেলওয়ে সীমান্ত' },
  { value: 'BY RAIL GEDE/BY AIR', label: 'BY RAIL GEDE/BY AIR / গেদে রেল অথবা আকাশপথ', description: 'গেদে রেলপথ বা আকাশপথ' },
  { value: 'BY RAIL GEDE/BYROAD HARIDASPUR', label: 'BY RAIL GEDE/BYROAD HARIDASPUR / গেদে রেল অথবা হরিদাসপুর সড়ক', description: 'গেদে রেলপথ বা পেট্রাপোল সড়কপথ' },
  { value: 'BY RAIL NEW JALPAIGURI', label: 'BY RAIL NEW JALPAIGURI (Mitali Express) / নিউ জলপাইগুড়ি রেলপথ', description: 'মিতালী এক্সপ্রেস (ঢাকা - চিলাহাটি - এনজেপি)' },
  { value: 'BY RAIL NISCHINTPUR', label: 'BY RAIL NISCHINTPUR (Agartala - Gangasagar) / নিশ্চিন্তপুর রেলপথ', description: 'আগরতলা-গঙ্গাসাগর রেল সংযোগ' },
  { value: 'BY RAIL PETRAPOLE', label: 'BY RAIL PETRAPOLE (Bandhan Express) / পেট্রাপোল রেলপথ', description: 'বন্ধন এক্সপ্রেস (খুলনা - বেনাপোল - পেট্রাপোল - কলকাতা)' },
  { value: 'BY ROAD AGARTALA', label: 'BY ROAD AGARTALA (Akhaura - Agartala) / আগরতলা সড়কপথ', description: 'আখাউড়া-আগরতলা চেকপোস্ট (ব্রাহ্মণবাড়িয়া/ত্রিপুরা)' },
  { value: 'BY ROAD BAGHMARA', label: 'BY ROAD BAGHMARA (Bijoypur - Baghmara) / বাঘমারা সড়কপথ', description: 'বিজয়পুর নেত্রকোনা - বাঘমারা মেঘালয়' },
  { value: 'BY ROAD BELONIA', label: 'BY ROAD BELONIA (Majumdarhat - Belonia) / বিলোনিয়া সড়কপথ', description: 'মজুমদারহাট ফেনী - বিলোনিয়া দক্ষিণ ত্রিপুরা' },
  { value: 'BY ROAD BHOLAGONJ', label: 'BY ROAD BHOLAGONJ (Bholaganj - Majai) / ভোলাগঞ্জ সড়কপথ', description: 'কোম্পানীগঞ্জ সিলেট - ভোলাগঞ্জ মেঘালয়' },
  { value: 'BY ROAD CHANGRABANDHA', label: 'BY ROAD CHANGRABANDHA (Burimari - Changrabandha) / চ্যাংড়াবান্দা সড়কপথ', description: 'বুড়িমারী লালমনিরহাট - চ্যাংড়াবান্দা কোচবিহার' },
  { value: 'BY ROAD CHANGRABANDHA/JAYGAON', label: 'BY ROAD CHANGRABANDHA/JAYGAON / চ্যাংড়াবান্দা অথবা জয়গাঁও', description: 'বুড়িমারী / চ্যাংড়াবান্দা বা ভুটান সীমান্ত জয়গাঁও' },
  { value: 'BY ROAD CHANGRABANDHA/RANIGANJ', label: 'BY ROAD CHANGRABANDHA/RANIGANJ / চ্যাংড়াবান্দা অথবা রানীগঞ্জ', description: 'চ্যাংড়াবান্দা বা রানীগঞ্জ সীমান্ত' },
  { value: 'BY ROAD DALU', label: 'BY ROAD DALU (Nakugaon - Dalu) / ডালু সড়কপথ', description: 'নাকুগাঁও শেরপুর - ডালু মেঘালয়' },
  { value: 'BY ROAD DAWKI', label: 'BY ROAD DAWKI (Tamabil - Dawki) / ডাউকি সড়কপথ', description: 'তামাবিল সিলেট - ডাউকি মেঘালয় চেকপোস্ট' },
  { value: 'BY ROAD DHALIGHAT', label: 'BY ROAD DHALIGHAT (Chatlapur - Dhalighat) / ধলইঘাট সড়কপথ', description: 'চাতলাপুর মৌলভীবাজার - ধলইঘাট কৈলাশহর' },
  { value: 'BY ROAD DHUBRI', label: 'BY ROAD DHUBRI (Rowmari - Dhubri) / ধুবড়ী নদী/সড়কপথ', description: 'রৌমারী কুড়িগ্রাম - ধুবড়ী আসাম' },
  { value: 'BY ROAD GEDE', label: 'BY ROAD GEDE (Darshana - Gede Road) / গেদে সড়কপথ', description: 'দর্শনা চুয়াডাঙ্গা - গেদে নদীয়া চেকপোস্ট' },
  { value: 'BY ROAD GHOJADANGA', label: 'BY ROAD GHOJADANGA (Bhomra - Ghojadanga) / ঘোজাডাঙ্গা সড়কপথ', description: 'ভোমরা সাতক্ষীরা - ঘোজাডাঙ্গা উত্তর ২৪ পরগণা' },
  { value: 'BY ROAD GOLAKGANJ', label: 'BY ROAD GOLAKGANJ (Sonahat - Golakganj) / গোলকগঞ্জ সড়কপথ', description: 'সোনাহাট কুড়িগ্রাম - গোলকগঞ্জ আসাম' },
  { value: 'BY ROAD HALDIBARI', label: 'BY ROAD HALDIBARI (Chilahati - Haldibari) / হলদিবাড়ী সড়কপথ', description: 'চিলাহাটি নীলফামারী - হলদিবাড়ী কোচবিহার' },
  { value: 'BY ROAD HARIDASPUR', label: 'BY ROAD HARIDASPUR (Benapole - Petrapole) / হরিদাসপুর সড়কপথ', description: 'বেনাপোল যশোর - পেট্রাপোল/হরিদাসপুর চেকপোস্ট' },
  { value: 'BY ROAD HILI', label: 'BY ROAD HILI (Hili - Hili) / হিলি সড়কপথ', description: 'হিলি হাকিমপুর দিনাজপুর - হিলি দক্ষিণ দিনাজপুর' },
  { value: 'BY ROAD JAIGAON', label: 'BY ROAD JAIGAON / জয়গাঁও সড়কপথ', description: 'আলিপুরদুয়ার / ভুটান সংযোগ জয়গাঁও চেকপোস্ট' },
  { value: 'BY ROAD JAIGAON/PHULBARI', label: 'BY ROAD JAIGAON/PHULBARI / জয়গাঁও অথবা ফুলবাড়ী', description: 'জয়গাঁও বা ফুলবাড়ী সীমান্ত' },
  { value: 'BY ROAD KAILASHAHAR', label: 'BY ROAD KAILASHAHAR (Chatlapur - Kailashahar) / কৈলাশহর সড়কপথ', description: 'চাতলাপুর মৌলভীবাজার - কৈলাশহর ঊনকোটি ত্রিপুরা' },
  { value: 'BY ROAD KARIMGANJ', label: 'BY ROAD KARIMGANJ (Zakiganj - Karimganj Steamer Ghat) / করিমগঞ্জ জল/সড়কপথ', description: 'জকিগঞ্জ সিলেট - করিমগঞ্জ আসাম কুশিয়ারা ঘাট' },
  { value: 'BY ROAD KHOWAI', label: 'BY ROAD KHOWAI (Balla - Khowai) / খোয়াই সড়কপথ', description: 'বাল্লা চুনারুঘাট হবিগঞ্জ - খোয়াই ত্রিপুরা' },
  { value: 'BY ROAD LALGOLAGHAT', label: 'BY ROAD LALGOLAGHAT (Godagari - Lalgolaghat) / লালগোলাঘাট নদী/সড়কপথ', description: 'গোদাগাড়ী রাজশাহী - লালগোলা মুর্শিদাবাদ' },
  { value: 'BY ROAD MAHADIPUR', label: 'BY ROAD MAHADIPUR (Sonamasjid - Mahadipur) / মহদীপুর সড়কপথ', description: 'সোনামসজিদ চাঁপাইনবাবগঞ্জ - মহদীপুর মালদা চেকপোস্ট' },
  { value: 'BY ROAD MANKARCHAR', label: 'BY ROAD MANKARCHAR (Rowmari - Mankachar) / মানকারচর সড়কপথ', description: 'রৌমারী কুড়িগ্রাম - মানকাচর আসাম' },
  { value: 'BY ROAD MUHURIGHAT', label: 'BY ROAD MUHURIGHAT (Belonia - Muhurighat) / মুহুরীঘাট সড়কপথ', description: 'বিলোনিয়া পরশুরাম ফেনী - মুহুরীঘাট ত্রিপুরা' },
  { value: 'BY ROAD PHULBARI', label: 'BY ROAD PHULBARI (Banglabandha - Phulbari) / ফুলবাড়ী সড়কপথ', description: 'বাংলাবান্ধা তেঁতুলিয়া পঞ্চগড় - ফুলবাড়ী জলপাইগুড়ি' },
  { value: 'BY ROAD PHULBARI/JAIGAON', label: 'BY ROAD PHULBARI/JAIGAON / ফুলবাড়ী অথবা জয়গাঁও', description: 'বাংলাবান্ধা ফুলবাড়ী বা জয়গাঁও' },
  { value: 'BY ROAD PHULBARI/RANIGANJ', label: 'BY ROAD PHULBARI/RANIGANJ / ফুলবাড়ী অথবা রানীগঞ্জ', description: 'ফুলবাড়ী বা রানীগঞ্জ চেকপোস্ট' },
  { value: 'BY ROAD RADHIKAPUR', label: 'BY ROAD RADHIKAPUR (Birol - Radhikapur) / রাধিকাপুর সড়কপথ', description: 'বিরল দিনাজপুর - রাধিকাপুর উত্তর দিনাজপুর' },
  { value: 'BY ROAD RANIGANJ', label: 'BY ROAD RANIGANJ / রানীগঞ্জ সড়কপথ', description: 'রানীগঞ্জ চেকপোস্ট' },
  { value: 'BY ROAD RANIGANJ/PHULBARI', label: 'BY ROAD RANIGANJ/PHULBARI / রানীগঞ্জ অথবা ফুলবাড়ী', description: 'রানীগঞ্জ বা ফুলবাড়ী সীমান্ত' },
  { value: 'BY ROAD SABROOM', label: 'BY ROAD SABROOM (Ramgarh - Sabroom) / সাব্রুম সড়কপথ', description: 'রামগড় খাগড়াছড়ি - সাব্রুম দক্ষিণ ত্রিপুরা মৈত্রী সেতু' },
  { value: 'BY ROAD SONAHAT', label: 'BY ROAD SONAHAT (Sonahat - Sonahat) / সোনাহাট সড়কপথ', description: 'সোনাহাট ভূরুঙ্গামারী কুড়িগ্রাম - সোনাহাট আসাম' },
  { value: 'BY ROAD SRIMANTPUR', label: 'BY ROAD SRIMANTPUR (Bibirbazar - Srimantpur) / শ্রীমন্তপুর সড়কপথ', description: 'বিবিরবাজার কুমিল্লা - শ্রীমন্তপুর সোনামুড়া ত্রিপুরা' },
  { value: 'BY ROAD SUTERKANDI', label: 'BY ROAD SUTERKANDI (Sheola - Sutarkandi) / সুতারকান্দি সড়কপথ', description: 'শেওলা বিয়ানীবাজার সিলেট - সুতারকান্দি আসাম চেকপোস্ট' },
];

export const OCCUPATION_OPTIONS: SearchableOption[] = [
  { value: 'AIR FORCE', label: 'Air Force / বিমানবাহিনী' },
  { value: 'BUSINESS PERSON', label: 'Business Person / ব্যবসায়ী' },
  { value: 'CAMERAMAN', label: 'Cameraman / ক্যামেরাম্যান' },
  { value: 'CHARITY/SOCIAL WORKER', label: 'Charity / Social Worker / সমাজকর্মী' },
  { value: 'CHARTERED ACCOUNTANT', label: 'Chartered Accountant / চার্টার্ড অ্যাকাউন্ট্যান্ট' },
  { value: 'COLLEGE/UNIVERSITY TEACHER', label: 'College / University Teacher / শিক্ষক' },
  { value: 'DIPLOMAT', label: 'Diplomat / কূটনীতিক' },
  { value: 'DOCTOR', label: 'Doctor / চিকিৎসক' },
  { value: 'ENGINEER', label: 'Engineer / প্রকৌশলী' },
  { value: 'FILM PRODUCER', label: 'Film Producer / চলচ্চিত্র প্রযোজক' },
  { value: 'GOVERNMENT SERVICE', label: 'Government Service / সরকারি চাকরি' },
  { value: 'HOUSE WIFE', label: 'House Wife / গৃহিণী' },
  { value: 'JOURNALIST', label: 'Journalist / সাংবাদিক' },
  { value: 'LABOUR', label: 'Labour / শ্রমিক' },
  { value: 'LAWYER', label: 'Lawyer / আইনজীবী' },
  { value: 'MEDIA', label: 'Media / গণমাধ্যমকর্মী' },
  { value: 'MILITARY', label: 'Military / সামরিক বাহিনী' },
  { value: 'MISSIONARY', label: 'Missionary / ধর্মপ্রচারক' },
  { value: 'NAVY', label: 'Navy / নৌবাহিনী' },
  { value: 'NEWS BROADCASTER', label: 'News Broadcaster / সংবাদ পাঠক' },
  { value: 'OFFICIAL', label: 'Official / সরকারি কর্মকর্তা' },
  { value: 'POLICE', label: 'Police / পুলিশ' },
  { value: 'PRESS', label: 'Press / প্রেস' },
  { value: 'PRIVATE SERVICE', label: 'Private Service / বেসরকারি চাকরি' },
  { value: 'PUBLISHER', label: 'Publisher / প্রকাশক' },
  { value: 'REPORTER', label: 'Reporter / প্রতিবেদক' },
  { value: 'RESEARCHER', label: 'Researcher / গবেষক' },
  { value: 'RETIRED', label: 'Retired / অবসরপ্রাপ্ত' },
  { value: 'SEA MAN', label: 'Sea Man / নাবিক' },
  { value: 'SELF EMPLOYED/ FREELANCER', label: 'Self Employed / Freelancer / ফ্রিল্যান্সার' },
  { value: 'STUDENT', label: 'Student / শিক্ষার্থী' },
  { value: 'TRADER', label: 'Trader / ব্যবসায়ী ও ট্রেডার' },
  { value: 'TV PRODUCER', label: 'TV Producer / টিভি প্রযোজক' },
  { value: 'UN-EMPLOYED', label: 'Un-employed / বেকার' },
  { value: 'UN OFFICIAL', label: 'UN Official / জাতিসংঘ কর্মকর্তা' },
  { value: 'WORKER', label: 'Worker / কর্মী' },
  { value: 'WRITER', label: 'Writer / লেখক' },
  { value: 'OTHERS', label: 'Others / অন্যান্য' },
];

export const PAST_OCCUPATION_OPTIONS: SearchableOption[] = [
  { value: '', label: 'Select Occupation / প্রযোজ্য নয় (None)', description: 'পূর্বতন পেশা পরিবর্তন না করলে এটি রাখুন' },
  ...OCCUPATION_OPTIONS,
];

export const DURATION_MONTHS_OPTIONS: SearchableOption[] = [
  { value: '1', label: '1 Month / ১ মাস' },
  { value: '2', label: '2 Months / ২ মাস' },
  { value: '3', label: '3 Months / ৩ মাস' },
  { value: '4', label: '4 Months / ৪ মাস' },
  { value: '5', label: '5 Months / ৫ মাস' },
  { value: '6', label: '6 Months / ৬ মাস' },
  { value: '7', label: '7 Months / ৭ মাস' },
  { value: '8', label: '8 Months / ৮ মাস' },
  { value: '9', label: '9 Months / ৯ মাস' },
  { value: '10', label: '10 Months / ১০ মাস' },
  { value: '11', label: '11 Months / ১১ মাস' },
  { value: '12', label: '12 Months (1 Year) / ১২ মাস (১ বছর)' },
];

export const NUMBER_OF_ENTRIES_OPTIONS: SearchableOption[] = [
  { value: '1', label: 'Single Entry (1) / একবার প্রবেশ', description: 'Single entry permission' },
  { value: '2', label: 'Multiple Entry (2) / একাধিকবার প্রবেশ', description: 'Multiple entries permission' },
  { value: '3', label: 'Double Entry (3) / দুইবার প্রবেশ', description: 'Double entry permission' },
  { value: '4', label: 'Triple Entry (4) / তিনবার প্রবেশ', description: 'Triple entry permission' },
];

export const PREVIOUS_VISA_TYPE_OPTIONS: SearchableOption[] = [
  { value: '3', label: 'TOURIST VISA / ট্যুরিস্ট ভিসা', description: 'ভ্রমণ ও পর্যটন ভিসা (Tourist)' },
  { value: '16', label: 'MEDICAL VISA / মেডিকেল ভিসা', description: 'চিকিৎসা ভিসা (Medical)' },
  { value: '1', label: 'BUSINESS VISA / বিজনেস ভিসা', description: 'ব্যবসা ও বাণিজ্যিক ভিসা (Business)' },
  { value: '2', label: 'STUDENT VISA / স্টুডেন্ট ভিসা', description: 'শিক্ষা ও শিক্ষার্থী ভিসা (Student)' },
  { value: '87', label: 'DOUBLE ENTRY / ডাবল এন্ট্রি ভিসা', description: 'দুইবার প্রবেশের ভিসা (Double Entry)' },
  { value: '6', label: 'ENTRY VISA / এন্ট্রি ভিসা', description: 'সাধারন প্রবেশ ভিসা (Entry / X)' },
  { value: '9', label: 'EMPLOYMENT VISA / এমপ্লয়মেন্ট ভিসা', description: 'চাকরি ভিসা (Employment)' },
  { value: '5', label: 'TRANSIT VISA / ট্রানজিট ভিসা', description: 'যাত্রাপথ ট্রানজিট ভিসা (Transit)' },
  { value: '4', label: 'CONFERENCE VISA / কনফারেন্স ভিসা', description: 'সম্মেলন ও সেমিনার ভিসা (Conference)' },
  { value: '76', label: 'VISIT VISA / ভিজিট ভিসা', description: 'পরিদর্শন ভিসা (Visit)' },
  { value: '11', label: 'DIPLOMATIC VISA / কূটনৈতিক ভিসা', description: 'কূটনৈতিক ভিসা (Diplomatic)' },
  { value: '12', label: 'OFFICIAL VISA / অফিসিয়াল ভিসা', description: 'সরকারি কর্মকর্তা ভিসা (Official)' },
  { value: '8', label: 'JOURNALIST VISA / সাংবাদিক ভিসা', description: 'সাংবাদিক ভিসা (Journalist)' },
  { value: '84', label: 'FILM VISA / ফিল্ম ভিসা', description: 'চলচ্চিত্র নির্মাণ ভিসা (Film)' },
  { value: '7', label: 'MISSIONARY VISA / মিশনারি ভিসা', description: 'ধর্মপ্রচারক ভিসা (Missionary)' },
  { value: '63', label: 'MOUNTAINEERING VISA / পর্বতারোহণ ভিসা', description: 'পর্বতারোহণ ভিসা (Mountaineering)' },
  { value: '64', label: 'PILGRIMES VISA / তীর্থযাত্রা ভিসা', description: 'তীর্থযাত্রা ভিসা (Pilgrimes)' },
  { value: '86', label: 'UN DIPLOMAT / জাতিসংঘ কূটনীতিক', description: 'জাতিসংঘ কূটনৈতিক ভিসা (UN Diplomat)' },
  { value: '17', label: 'UN OFFICIAL / জাতিসংঘ কর্মকর্তা', description: 'জাতিসংঘ কর্মকর্তা ভিসা (UN Official)' },
];

export const SAARC_COUNTRY_OPTIONS: SearchableOption[] = [
  { value: 'NPL', label: 'NEPAL (NPL) / নেপাল', description: 'নেপাল' },
  { value: 'BTN', label: 'BHUTAN (BTN) / ভুটান', description: 'ভুটান' },
  { value: 'MDV', label: 'MALDIVES (MDV) / মালদ্বীপ', description: 'মালদ্বীপ' },
  { value: 'LKA', label: 'SRI LANKA (LKA) / শ্রীলঙ্কা', description: 'শ্রীলঙ্কা' },
  { value: 'PAK', label: 'PAKISTAN (PAK) / পাকিস্তান', description: 'পাকিস্তান' },
  { value: 'AFG', label: 'AFGHANISTAN (AFG) / আফগানিস্তান', description: 'আফগানিস্তান' },
  { value: 'BGD', label: 'BANGLADESH (BGD) / বাংলাদেশ', description: 'বাংলাদেশ' },
];

export const SAARC_YEAR_OPTIONS: SearchableOption[] = [
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
];

export const INDIA_STATES_OPTIONS: SearchableOption[] = Object.keys(indiaStatesDistrictsData).map((state) => ({
  value: state,
  label: state,
}));

export const INDIA_DISTRICTS_BY_STATE: Record<string, SearchableOption[]> = Object.entries(
  indiaStatesDistrictsData as Record<string, string[]>
).reduce((acc, [state, districts]) => {
  acc[state] = districts
    .filter((d) => Boolean(d))
    .map((dist) => ({
      value: dist,
      label: dist,
    }));
  return acc;
}, {} as Record<string, SearchableOption[]>);

export const DEFAULT_BLANK_PROFILE = {
  step1_registration: {
    countryApplyingFrom: 'BGD' as const,
    indianMission: '' as any,
    nationality: 'BGD',
    dateOfBirth: '',
    email: '',
    reEnterEmail: '',
    expectedDateOfArrival: '',
    visaPurpose: '' as VisaPurposeCode,
  },
  step2_applicant_details: {
    surname: '',
    givenName: '',
    hasChangedName: false,
    gender: '' as any,
    birthCity: '',
    birthCountry: 'BGD',
    nationalIdNumber: '',
    religion: '' as any,
    visibleIdentificationMarks: '',
    educationalQualification: '' as any,
    nationalityAcquiredBy: 'BY BIRTH' as const,
    passportNumber: '',
    passportPlaceOfIssue: 'DHAKA',
    passportDateOfIssue: '',
    passportDateOfExpiry: '',
    hasOtherPassport: false,
  },
  step3_family_address: {
    presentAddressLine1: '',
    presentCity: '',
    presentCountry: 'BGD',
    presentStateDistrict: '',
    postalCode: '',
    phone: '',
    mobileIsdCode: '880',
    mobile: '',
    sameAddress: true,
    fatherName: '',
    fatherNationality: 'BGD',
    fatherBirthPlace: '',
    fatherCountryOfBirth: 'BGD',
    motherName: '',
    motherNationality: 'BGD',
    motherBirthPlace: '',
    motherCountryOfBirth: 'BGD',
    maritalStatus: '' as any,
    grandparentsPakistanOrigin: false,
    occupation: '' as any,
    pastOccupation: null,
    employerName: '',
    designation: '',
    employerAddress: '',
    employerPhone: '',
    previousOrganizationMilitary: false,
  },
  step4_visa_references: {
    placesToBeVisited1: '',
    placesToBeVisited2: '',
    durationMonths: '' as any,
    numberOfEntries: '' as any,
    portOfArrival: '',
    portOfExit: '',
    everVisitedIndiaBefore: false,
    previousAddressLine1: '',
    previousAddressLine2: '',
    previousAddressLine3: '',
    previousVisitAddress1: '',
    previousVisitCity: '',
    previousVisaNumber: '',
    previousVisaType: '3' as PreviousVisaTypeCode,
    previousVisaIssuePlace: 'DHAKA',
    previousVisaIssueDate: '',
    permissionRefused: false,
    permissionRefusedDetails: '',
    countriesVisitedLast10Years: '',
    visitedSaarcCountriesLast3Years: false,
    saarcCountryVisits: [],
    referenceNameIndia: '',
    referenceAddressIndia: '',
    referenceAddressIndiaLine1: '',
    referenceAddressIndiaLine2: '',
    referenceStateIndia: '' as any,
    referenceDistrictIndia: '',
    referencePhoneIndia: '',
    referenceNameBangladesh: '',
    referenceAddressBangladesh: '',
    referenceAddressBangladeshLine1: '',
    referenceAddressBangladeshLine2: '',
    referencePhoneBangladesh: '',
  },
  step5_additional_questions: {
    arrestedOrConvicted: false,
    refusedEntryOrDeported: false,
    humanOrDrugTrafficking: false,
    cyberCrimeOrTerrorism: false,
    viewsJustifyingTerrorism: false,
    soughtAsylum: false,
  },
  photoFilePath: undefined,
  passportPdfPath: undefined,
  step8_stay_details: {
    hotelName: '',
    address: '',
    state: '',
    district: '',
    email: '',
    phone: '',
  },
  submitFinalApplication: false,
};

export function sanitizeProfileDefaults(profile: any): any {
  if (!profile) return profile;
  if (!profile.step1_registration) profile.step1_registration = {};
  if (!profile.step1_registration.countryApplyingFrom) profile.step1_registration.countryApplyingFrom = 'BGD';
  if (!profile.step1_registration.nationality) profile.step1_registration.nationality = 'BGD';

  if (!profile.step2_applicant_details) profile.step2_applicant_details = {};
  if (!profile.step2_applicant_details.birthCountry) profile.step2_applicant_details.birthCountry = 'BGD';
  if (!profile.step2_applicant_details.nationalityAcquiredBy) profile.step2_applicant_details.nationalityAcquiredBy = 'BY BIRTH';
  if (!profile.step2_applicant_details.passportPlaceOfIssue) profile.step2_applicant_details.passportPlaceOfIssue = 'DHAKA';

  if (!profile.step3_family_address) profile.step3_family_address = {};
  if (!profile.step3_family_address.presentCountry) profile.step3_family_address.presentCountry = 'BGD';
  if (!profile.step3_family_address.mobileIsdCode) profile.step3_family_address.mobileIsdCode = '880';
  if (profile.step3_family_address.sameAddress === undefined) profile.step3_family_address.sameAddress = true;
  if (!profile.step3_family_address.fatherNationality) profile.step3_family_address.fatherNationality = 'BGD';
  if (!profile.step3_family_address.fatherCountryOfBirth) profile.step3_family_address.fatherCountryOfBirth = 'BGD';
  if (!profile.step3_family_address.motherNationality) profile.step3_family_address.motherNationality = 'BGD';
  if (!profile.step3_family_address.motherCountryOfBirth) profile.step3_family_address.motherCountryOfBirth = 'BGD';

  return profile;
}
