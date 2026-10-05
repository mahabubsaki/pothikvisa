import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { VisaApplicantProfile } from '@/types/profile';
import { encodeCode128B } from '@/lib/code128';

export interface GeneratePdfDraftOptions {
  profile: VisaApplicantProfile;
  photoBuffer?: Buffer | Uint8Array;
  photoBase64?: string;
  photoFilePath?: string;
  applicationId?: string;
  registrationDate?: string;
}

/**
 * Formats dates like "15/09/2000" or "2000-09-15" into official consular "15-SEP-2000"
 */
export function formatOfficialDate(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (clean.includes('-') && clean.length > 8 && /[A-Za-z]/.test(clean)) {
    return clean.toUpperCase();
  }

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Handle DD/MM/YYYY
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const mIdx = parseInt(parts[1], 10) - 1;
      const y = parts[2];
      if (mIdx >= 0 && mIdx < 12) {
        return `${d}-${months[mIdx]}-${y}`;
      }
    }
  }

  // Handle YYYY-MM-DD
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parts[2].padStart(2, '0');
      if (mIdx >= 0 && mIdx < 12) {
        return `${d}-${months[mIdx]}-${y}`;
      }
    }
  }

  return clean.toUpperCase();
}

/**
 * Returns Indian Mission title and subtitle based on mission code.
 */
export function getMissionInfo(missionCode?: string): { title: string; subtitle: string; city: string } {
  switch (missionCode) {
    case 'BGDC':
      return { title: 'ASSISTANT HIGH COMMISSION OF INDIA', subtitle: 'CHITTAGONG ( BANGLADESH )', city: 'CHITTAGONG' };
    case 'BGDR':
      return { title: 'ASSISTANT HIGH COMMISSION OF INDIA', subtitle: 'RAJSHAHI ( BANGLADESH )', city: 'RAJSHAHI' };
    case 'BGDS':
      return { title: 'ASSISTANT HIGH COMMISSION OF INDIA', subtitle: 'SYLHET ( BANGLADESH )', city: 'SYLHET' };
    case 'BGDK':
      return { title: 'ASSISTANT HIGH COMMISSION OF INDIA', subtitle: 'KHULNA ( BANGLADESH )', city: 'KHULNA' };
    case 'BGDD':
    default:
      return { title: 'HIGH COMMISSION OF INDIA', subtitle: 'DHAKA ( BANGLADESH )', city: 'DHAKA' };
  }
}

/**
 * Returns official consular purpose statement.
 */
export function getPurposeOfVisitText(purposeCode?: string): string {
  if (purposeCode === '543' || purposeCode === '515') {
    return 'PURPOSE OF VISIT : FOR MEDICAL TREATMENT UNDER RECOGNIZED SPECIALIZED HOSPITALS/HEALTHCARE CENTERS IN INDIA AND ACCOMPANIED BY ATTENDANT IF NECESSARY.';
  }
  if (purposeCode === '537' || purposeCode === '542') {
    return 'PURPOSE OF VISIT : COMMERCIAL TRANSACTIONS, BUSINESS DISCUSSIONS, ESTABLISHING VENTURES OR TRADE MEETINGS WITH INDIAN ENTITIES.';
  }
  return 'PURPOSE OF VISIT : FOR TOURISM RECREATION, SIGHTSEEING CASUAL VISIT TO MEET FRIENDS OR RELATIVES, ATTENDING A SHORT TERM YOGA PROGRAMME, SHORT DURATION MEDICAL TREATMENT (INCLUDING TREATMENT UNDER AYUSH SYSTEMS), SHORT TERM COURSES ON LOCAL LANGUAGES, MUSIC, DANCE , ARTS AND CRAFTS, COOKING, MEDICINE ETC. WHICH SHOULD NOT BE A FORMAL OR STRUCTURED COURSE/PROGRAMME (COURSE NOT EXCEEDING 6 MONTHS DURATION AND NOT ISSUED WITH A QUALIFYING CERTIFICATE/DIPLOMA ETC.) AND VOLUNTARY WORK OF SHORT DURATION( FOR A MAXIMUM PERIOD OF ONE MONTH, WHICH DO NOT INVOLVE ANY MONETARY PAYMENT OR CONSIDERATION OF ANY KIND IN RETURN ETC. AND NO OTHER PURPOSE/ACTIVITY.';
}

/**
 * Generates an authentic 2-page Indian Visa Application Form PDF matching BGDDW1EF0826MD000915-2.pdf
 */
export async function generateOfficialPdfDraft(options: GeneratePdfDraftOptions): Promise<Uint8Array> {
  const { profile } = options;
  const s1 = profile.step1_registration;
  const s2 = profile.step2_applicant_details;
  const s3 = profile.step3_family_address;
  const s4 = profile.step4_visa_references;
  const s8 = profile.step8_stay_details;

  const missionInfo = getMissionInfo(s1?.indianMission);
  const missionPrefix = s1?.indianMission || 'BGDD';

  // Generate or use existing Application ID
  let appId = options.applicationId || profile.temporaryApplicationId;
  if (!appId || !appId.startsWith(missionPrefix)) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    appId = `${missionPrefix}W${randomSuffix}`;
  }

  const todayStr = options.registrationDate || new Date().toISOString();
  const regDateFormatted = formatOfficialDate(todayStr);

  const fullName = `${s2?.givenName || ''} ${s2?.surname || ''}`.trim().toUpperCase();

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN_LEFT = 38.75;
  const TABLE_W = 517.5;
  const BORDER_COLOR = rgb(0.85, 0.85, 0.85);
  const HEADER_BG = rgb(0.91, 0.91, 0.91);
  const TEXT_COLOR = rgb(0, 0, 0);
  const MUTED_COLOR = rgb(0.39, 0.39, 0.39);

  // Load National India Emblem
  let emblemImage: any = null;
  const emblemPath = path.resolve(process.cwd(), 'public', 'assets', 'india_emblem.png');
  if (fs.existsSync(emblemPath)) {
    try {
      const emblemBytes = fs.readFileSync(emblemPath);
      emblemImage = await doc.embedPng(emblemBytes);
    } catch {
      // fallback
    }
  }

  // Load 2D Barcode Image
  let barcode2DImage: any = null;
  const barcode2DPath = path.resolve(process.cwd(), 'public', 'assets', 'india_visa_2d_barcode.png');
  if (fs.existsSync(barcode2DPath)) {
    try {
      const barcode2DBytes = fs.readFileSync(barcode2DPath);
      barcode2DImage = await doc.embedPng(barcode2DBytes);
    } catch {
      // fallback
    }
  }

  // Load Applicant Photo from Buffer, Base64, or FilePath
  let applicantPhoto: any = null;
  let rawPhotoBytes: Buffer | Uint8Array | null = null;
  if (options.photoBuffer && options.photoBuffer.length > 0) {
    rawPhotoBytes = options.photoBuffer;
  } else if (options.photoBase64) {
    const cleanB64 = options.photoBase64.replace(/^data:image\/\w+;base64,/, '');
    rawPhotoBytes = Buffer.from(cleanB64, 'base64');
  } else if (options.photoFilePath && fs.existsSync(options.photoFilePath)) {
    rawPhotoBytes = fs.readFileSync(options.photoFilePath);
  } else if (profile.photoFilePath && fs.existsSync(profile.photoFilePath)) {
    rawPhotoBytes = fs.readFileSync(profile.photoFilePath);
  }

  if (rawPhotoBytes && rawPhotoBytes.length > 0) {
    try {
      const normalizedJpg = await sharp(rawPhotoBytes).jpeg({ quality: 92 }).toBuffer();
      applicantPhoto = await doc.embedJpg(normalizedJpg);
    } catch (e: any) {
      console.warn('Failed to embed applicant photo:', e.message);
    }
  }

  // Helper to draw Code128 barcode
  function drawBarcode(page: any, text: string, x: number, y: number, height: number, scale: number = 0.8) {
    const { modules } = encodeCode128B(text);
    for (const mod of modules) {
      if (mod.isBar) {
        page.drawRectangle({
          x: x + mod.x * scale,
          y,
          width: mod.width * scale,
          height,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  // Helper to draw dense 2D barcode representation (like img3 in section D)
  function draw2DBarcodePattern(page: any, x: number, y: number, w: number, h: number) {
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: rgb(0, 0, 0),
    });
    const cols = 28;
    const colW = w / cols;
    for (let c = 0; c < cols; c++) {
      if (c % 2 === 1) {
        page.drawRectangle({
          x: x + c * colW,
          y: y + (c % 3) * (h / 3),
          width: colW * 0.65,
          height: h / 2.3,
          color: rgb(1, 1, 1),
        });
      }
    }
  }

  // Helper to draw table section headers
  function drawSectionHeader(page: any, title: string, yTop: number, h: number = 13.2) {
    page.drawRectangle({
      x: MARGIN_LEFT,
      y: yTop - h,
      width: TABLE_W,
      height: h,
      color: HEADER_BG,
      borderColor: BORDER_COLOR,
      borderWidth: 0.5,
    });
    page.drawText(title, {
      x: MARGIN_LEFT + 2,
      y: yTop - h + 3.2,
      size: 7.5,
      font: fontBold,
      color: TEXT_COLOR,
    });
    return yTop - h;
  }

  // Helper to draw a table row with column divisions
  function drawTableRow(
    page: any,
    yTop: number,
    h: number,
    cols: {
      label?: string;
      labelLines?: string[];
      value?: string;
      width: number;
      isBold?: boolean;
      valAlignBottom?: boolean;
      labelAlignTop?: boolean;
    }[]
  ) {
    let curX = MARGIN_LEFT;
    for (const col of cols) {
      page.drawRectangle({
        x: curX,
        y: yTop - h,
        width: col.width,
        height: h,
        borderColor: BORDER_COLOR,
        borderWidth: 0.5,
      });

      const label = col.label || '';
      const labelLines = col.labelLines || (label ? [label] : []);
      const value = col.value || '';
      const textX = curX + 2;

      if (labelLines.length > 1) {
        // Multi-line label (e.g. Nationality by Birth/ \n Naturalization)
        let lineY = yTop - 10.2;
        for (const line of labelLines) {
          page.drawText(line, { x: textX, y: lineY, size: 7.2, font: fontRegular, color: MUTED_COLOR });
          lineY -= 8.2;
        }
      } else if (labelLines.length === 1 && !value) {
        const textY = col.labelAlignTop ? yTop - 10.2 : yTop - h + h / 2 - 2.5;
        page.drawText(labelLines[0], {
          x: textX,
          y: textY,
          size: 7.2,
          font: col.isBold ? fontBold : fontRegular,
          color: col.isBold ? TEXT_COLOR : MUTED_COLOR,
        });
      }

      if (value) {
        if (labelLines.length === 1) {
          const textY = yTop - h + h / 2 - 2.5;
          page.drawText(labelLines[0], { x: textX, y: textY, size: 7.2, font: fontRegular, color: MUTED_COLOR });
          const labelW = fontRegular.widthOfTextAtSize(labelLines[0] + ' ', 7.2);
          page.drawText(value, {
            x: textX + labelW,
            y: textY,
            size: 7.2,
            font: col.isBold ? fontBold : fontRegular,
            color: TEXT_COLOR,
          });
        } else {
          // Standalone value or value alongside multi-line label
          const textY = col.valAlignBottom ? yTop - 18.4 : yTop - h + h / 2 - 2.5;
          page.drawText(value, {
            x: textX,
            y: textY,
            size: 7.2,
            font: col.isBold !== false ? fontBold : fontRegular,
            color: TEXT_COLOR,
          });
        }
      }

      curX += col.width;
    }
    return yTop - h;
  }

  // =========================================================================
  // PAGE 1: Header, Photos, Personal Particulars, Passport, Contact, Family
  // =========================================================================
  const page1 = doc.addPage([PAGE_W, PAGE_H]);

  // Rotated left margin text
  page1.drawText(`Web Registration Date : ${regDateFormatted}     Application Id : ${appId}`, {
    x: 30,
    y: 172,
    size: 10,
    font: fontRegular,
    color: TEXT_COLOR,
    rotate: degrees(90),
  });

  // Top Ashoka Emblem
  if (emblemImage) {
    page1.drawImage(emblemImage, {
      x: 37,
      y: 745,
      width: 54.89,
      height: 85,
    });
  }

  // Top Centered Mission Header
  const titleW = fontBold.widthOfTextAtSize(missionInfo.title, 14.5);
  page1.drawText(missionInfo.title, {
    x: (PAGE_W - titleW) / 2,
    y: 768,
    size: 14.5,
    font: fontBold,
    color: TEXT_COLOR,
  });

  const subtitleW = fontRegular.widthOfTextAtSize(missionInfo.subtitle, 10);
  page1.drawText(missionInfo.subtitle, {
    x: (PAGE_W - subtitleW) / 2,
    y: 747.5,
    size: 10,
    font: fontRegular,
    color: TEXT_COLOR,
  });

  const formTitle = 'Visa Application Form';
  const formTitleW = fontBold.widthOfTextAtSize(formTitle, 15);
  page1.drawText(formTitle, {
    x: (PAGE_W - formTitleW) / 2,
    y: 687.5,
    size: 15,
    font: fontBold,
    color: TEXT_COLOR,
  });

  // Photo box on right: Paste your unsigned recent color photograph Size 2" X 2"
  page1.drawRectangle({
    x: 408,
    y: 645,
    width: 150,
    height: 150,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });
  page1.drawText('Paste your unsigned', { x: 439.67, y: 751.8, size: 8.2, font: fontRegular, color: MUTED_COLOR });
  page1.drawText('recent color photograph.', { x: 431.48, y: 743.6, size: 8.2, font: fontRegular, color: MUTED_COLOR });
  page1.drawText('Size: 2" X 2"', { x: 455.83, y: 735.4, size: 8.2, font: fontRegular, color: MUTED_COLOR });

  // Signature box on right
  page1.drawRectangle({
    x: 408,
    y: 603,
    width: 150,
    height: 40,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
  });
  page1.drawText('Signature', { x: 366.09, y: 619.8, size: 8.2, font: fontRegular, color: MUTED_COLOR });

  // Applicant Photo on left (90x90 at x=53, y=643)
  if (applicantPhoto) {
    page1.drawImage(applicantPhoto, {
      x: 53,
      y: 643,
      width: 90,
      height: 90,
    });
  } else {
    page1.drawRectangle({
      x: 53,
      y: 643,
      width: 90,
      height: 90,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: BORDER_COLOR,
      borderWidth: 0.5,
    });
    page1.drawText('2x2 PHOTO', { x: 74, y: 685, size: 8, font: fontBold, color: MUTED_COLOR });
  }

  // Barcode under photo
  drawBarcode(page1, appId, 42, 612, 18, 0.72);
  page1.drawText(appId, { x: 58, y: 600, size: 7.5, font: fontBold, color: TEXT_COLOR });

  // SECTION A: Personal Particulars (As in Passport)
  let curY = 590.0;
  curY = drawSectionHeader(page1, 'A. Personal Particulars (As in Passport)', curY);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Surname (As in Passport)', width: 136.99 },
    { value: s2?.surname?.toUpperCase() || '', width: TABLE_W - 136.99 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Given Name (As in Passport)', width: 136.99 },
    { value: s2?.givenName?.toUpperCase() || '', width: TABLE_W - 136.99 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Previous/other Name if any', width: 136.99 },
    { value: s2?.hasChangedName ? `${s2.previousSurname || ''} ${s2.previousGivenName || ''}`.trim() : 'Not Applicable', width: TABLE_W - 136.99 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Gender', width: 70 },
    { value: s2?.gender === 'M' ? 'MALE' : s2?.gender === 'F' ? 'FEMALE' : 'OTHER', width: 193.82 },
    { label: 'Marital Status', width: 100 },
    { value: (s3?.maritalStatus || 'SINGLE').toUpperCase(), width: TABLE_W - 363.82 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Date of Birth', width: 70 },
    { value: formatOfficialDate(s1?.dateOfBirth), width: 193.82 },
    { label: 'Religion', width: 100 },
    { value: (s2?.religion || 'ISLAM').toUpperCase(), width: TABLE_W - 363.82 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Place of Birth Town/City', width: 136.99 },
    { value: s2?.birthCity?.toUpperCase() || '', width: 126.83 },
    { label: 'Country of Birth', width: 100 },
    { value: 'BANGLADESH', width: TABLE_W - 363.82 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Citizenship /National ID No', width: 136.99 },
    { value: s2?.nationalIdNumber || 'NA', width: 126.83 },
    { label: 'Educational Qualification', width: 126.84 },
    { value: s2?.educationalQualification || 'GRADUATE', width: TABLE_W - 390.66 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Visible identification marks', width: 136.99 },
    { value: s2?.visibleIdentificationMarks || 'NA', width: TABLE_W - 136.99 },
  ]);

  // Row 9: Current Nationality (height 21.4 pt matching official PDF)
  curY = drawTableRow(page1, curY, 21.4, [
    { label: 'Current Nationality', width: 136.99, labelAlignTop: true },
    { value: 'BANGLADESH', width: 126.83, valAlignBottom: true },
    { labelLines: ['Nationality by Birth/', 'Naturalization'], width: 126.84 },
    { value: s2?.nationalityAcquiredBy || 'BY BIRTH', width: TABLE_W - 390.66, valAlignBottom: true },
  ]);

  // Row 10: Any Other Previous/Past Nationality (height 13.2 pt matching official PDF)
  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Any Other Previous/Past Nationality', width: 263.82 },
    { value: 'Not Applicable', width: TABLE_W - 263.82, isBold: false },
  ]);

  // SECTION B: Passport Details (Starts cleanly at curY = 437.3)
  curY = drawSectionHeader(page1, 'B. Passport Details', curY);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Passport No.', width: 92.16 },
    { value: s2?.passportNumber?.toUpperCase() || '', width: 141.78 },
    { label: 'Date of Issue ( dd/mm/yyyy )', width: 141.78 },
    { value: formatOfficialDate(s2?.passportDateOfIssue), width: TABLE_W - 375.72 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Place of Issue', width: 92.16 },
    { value: s2?.passportPlaceOfIssue?.toUpperCase() || 'DHAKA', width: 141.78 },
    { label: 'Date of Expiry ( dd/mm/yyyy )', width: 141.78 },
    { value: formatOfficialDate(s2?.passportDateOfExpiry), width: TABLE_W - 375.72 },
  ]);

  curY = drawTableRow(page1, curY, 13.0, [
    { label: 'Any other Passport/Identity Certificate held (if yes ,please fill in the following)', width: 375.72 },
    { value: s2?.hasOtherPassport ? 'YES' : 'NO', width: TABLE_W - 375.72 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Country of Issue', width: 136.99 },
    { value: s2?.otherPassportCountry || '', width: 126.83 },
    { label: 'Place of Issue', width: 126.84 },
    { value: s2?.otherPassportPlaceOfIssue || '', width: TABLE_W - 390.66 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Passport/IC No.', width: 136.99 },
    { value: s2?.otherPassportNumber || '', width: 126.83 },
    { label: 'Date of issue (dd/mm/yyyy)', width: 126.84 },
    { value: formatOfficialDate(s2?.otherPassportDateOfIssue), width: TABLE_W - 390.66 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Nationality/Status', width: 136.99 },
    { value: s2?.otherPassportNationality || '', width: TABLE_W - 136.99 },
  ]);

  // SECTION C: Applicant's Contact Details (Starts cleanly at curY = 345.8)
  curY = drawSectionHeader(page1, "C. Applicant's Contact Details", curY);

  const presentLine1 = s3?.presentAddressLine1?.toUpperCase() || '';
  const presentLine2 = `${s3?.presentCity || ''} ${s3?.presentStateDistrict || ''}`.trim().toUpperCase();
  const presentLine3 = `BANGLADESH ${s3?.postalCode || ''}`.trim();

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Present', width: 60 },
    { value: presentLine1, width: 214.69 },
    { label: 'Phone No', width: 99.24 },
    { value: s3?.phone || '', width: TABLE_W - 373.93 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Address', width: 60 },
    { value: presentLine2, width: 214.69 },
    { label: 'Mobile /Cell No', width: 99.24 },
    { value: s3?.mobile ? `880${s3.mobile.replace(/^880|^0/, '')}` : '', width: TABLE_W - 373.93 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: '', width: 60 },
    { value: presentLine3, width: 214.69 },
    { label: 'Email address', width: 99.24 },
    { value: s1?.email?.toUpperCase() || '', width: TABLE_W - 373.93 },
  ]);

  curY -= 5.0; // 5pt gap before Permanent Address

  const permLine1 = (s3?.sameAddress ? s3?.presentAddressLine1 : s3?.permanentAddressLine1)?.toUpperCase() || '';
  const permLine2 = (s3?.sameAddress ? s3?.presentCity : s3?.permanentCity)?.toUpperCase() || '';
  const permLine3 = (s3?.sameAddress ? s3?.presentStateDistrict : s3?.permanentStateDistrict)?.toUpperCase() || '';

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Permanent', width: 60 },
    { value: permLine1, width: TABLE_W - 60 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Address', width: 60 },
    { value: permLine2, width: TABLE_W - 60 },
  ]);

  curY = drawTableRow(page1, curY, 13.0, [
    { label: '', width: 60 },
    { value: permLine3, width: TABLE_W - 60 },
  ]);

  curY -= 5.0; // 5pt gap before Section D

  // SECTION D: Family Details (Starts cleanly at curY = 244.3)
  curY = drawSectionHeader(page1, 'D. Family Details', curY);

  curY = drawTableRow(page1, curY, 12.5, [
    { label: 'Relation', width: 63.61, isBold: true },
    { label: 'Name', width: 172.5, isBold: true },
    { label: 'Nationality', width: 80.09, isBold: true },
    { label: 'Prev. Nationality', width: 80.09, isBold: true },
    { label: 'Place/Country of Birth', width: TABLE_W - 396.29, isBold: true },
  ]);

  curY = drawTableRow(page1, curY, 21.0, [
    { label: "Father's", width: 63.61 },
    { value: s3?.fatherName?.toUpperCase() || '', width: 172.5 },
    { value: 'BANGLADESH', width: 80.09 },
    { value: 'BANGLADESH', width: 80.09 },
    { value: `${s3?.fatherBirthPlace || 'DHAKA'} BANGLADESH`, width: TABLE_W - 396.29 },
  ]);

  curY = drawTableRow(page1, curY, 21.0, [
    { label: "Mother's", width: 63.61 },
    { value: s3?.motherName?.toUpperCase() || '', width: 172.5 },
    { value: 'BANGLADESH', width: 80.09 },
    { value: 'BANGLADESH', width: 80.09 },
    { value: `${s3?.motherBirthPlace || 'DHAKA'} BANGLADESH`, width: TABLE_W - 396.29 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    { label: 'Marital Status', width: 63.61 },
    { value: (s3?.maritalStatus || 'Single').toUpperCase(), width: TABLE_W - 63.61 },
  ]);

  curY = drawTableRow(page1, curY, 13.2, [
    {
      label: 'Were your Grandfather/Grandmother(Paternal/Maternal) Pakistan Nationals Or belong to Pakistan held area : NO',
      width: TABLE_W,
      isBold: true,
    },
  ]);

  // Draw authentic 2D barcode in section D (exact official location: x = 282, y = 219.4, width = 205.2, height = 33.6)
  if (barcode2DImage) {
    page1.drawImage(barcode2DImage, {
      x: 282,
      y: 219.4,
      width: 205.2,
      height: 33.6,
    });
  }

  // Bottom of Page 1: Barcode of Full Name & Name text
  drawBarcode(page1, fullName, 40, 16, 12, 0.7);
  page1.drawText(fullName, { x: 120, y: 6, size: 7.5, font: fontRegular, color: TEXT_COLOR });

  // =========================================================================
  // PAGE 2: Visa Sought, Previous Visits, Profession, Stay, References, Declaration
  // =========================================================================
  const page2 = doc.addPage([PAGE_W, PAGE_H]);

  // Rotated right margin text
  page2.drawText(`Application Id : ${appId}`, {
    x: 575,
    y: 350,
    size: 10,
    font: fontRegular,
    color: TEXT_COLOR,
    rotate: degrees(90),
  });

  // SECTION E: Details of Visa Sought
  let p2Y = 815.0;
  p2Y = drawSectionHeader(page2, 'E. Details of Visa Sought  (Visa shall be valid from the Date of Issue and not from the Date of Journey)', p2Y);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Type Of Visa Required', width: 120 },
    { value: 'TOURIST VISA', width: 150 },
    { label: 'No of Entries', width: 100 },
    { value: s4?.numberOfEntries === '1' ? 'SINGLE' : s4?.numberOfEntries === '3' ? 'DOUBLE' : s4?.numberOfEntries === '4' ? 'TRIPLE' : 'MULTIPLE', width: TABLE_W - 370 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Period of Visa ( Month)', width: 120 },
    { value: `${s4?.durationMonths || 12} Month`, width: 150 },
    { label: 'Expected Date of Journey', width: 130 },
    { value: formatOfficialDate(s1?.expectedDateOfArrival), width: TABLE_W - 400 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Port Of Arrival', width: 120 },
    { value: s4?.portOfArrival?.replace(/_/g, ' ') || 'BY AIR', width: 150 },
    { label: 'Port of Exit', width: 100 },
    { value: s4?.portOfExit?.replace(/_/g, ' ') || 'BY AIR', width: TABLE_W - 370 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Required Detail of', width: 120 },
    { value: 'TOURIST VISA', width: TABLE_W - 120 },
  ]);

  const places = [s4?.placesToBeVisited1, s4?.placesToBeVisited2].filter(Boolean).join(', ') || 'KOLKATA';
  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Places to be Visited', width: 120 },
    { value: places.toUpperCase(), width: TABLE_W - 120 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: '""', width: 120 },
    { value: 'NA', width: TABLE_W - 120 },
  ]);

  // Purpose of visit box (y=741.2 to 705)
  const purposeText = getPurposeOfVisitText(s1?.visaPurpose);
  page2.drawRectangle({
    x: MARGIN_LEFT,
    y: p2Y - 36,
    width: TABLE_W,
    height: 36,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5,
  });
  page2.drawText(purposeText, {
    x: MARGIN_LEFT + 3.5,
    y: p2Y - 9,
    size: 5.4,
    font: fontRegular,
    color: TEXT_COLOR,
    maxWidth: TABLE_W - 8,
    lineHeight: 7.0,
  });

  // SECTION F: Previous Visit Details
  p2Y = 653.1;
  p2Y = drawSectionHeader(page2, 'F. Previous Visit Details', p2Y);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Have You Ever visited India ?', width: 150 },
    { value: s4?.everVisitedIndiaBefore ? 'YES' : 'NO', width: TABLE_W - 150 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Address where You stayed in India', width: 180 },
    { value: s4?.previousAddressLine1 || ', ', width: TABLE_W - 180 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Cities in India Visited', width: 150 },
    { value: s4?.previousVisitCity || '', width: TABLE_W - 150 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Type of Visa', width: 120 },
    { value: s4?.previousVisaType || '', width: 140 },
    { label: 'Visa Number', width: 90 },
    { value: s4?.previousVisaNumber || '', width: TABLE_W - 350 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Visa Issued Place', width: 120 },
    { value: s4?.previousVisaIssuePlace || '', width: 140 },
    { label: 'Date of Issue', width: 90 },
    { value: formatOfficialDate(s4?.previousVisaIssueDate), width: TABLE_W - 350 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Countries visited in last 10 years', width: 180 },
    { value: s4?.countriesVisitedLast10Years?.toUpperCase() || 'NONE', width: TABLE_W - 180 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Have you been refused an Indian Visa or extension of the same previously or deported from India ? NO', width: TABLE_W, isBold: true },
  ]);

  // SECTION G: Profession/Occupation Details :
  p2Y = 543.0;
  p2Y = drawSectionHeader(page2, 'G. Profession/Occupation Details :', p2Y);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Present Occupation', width: 120 },
    { value: s3?.occupation?.toUpperCase() || 'PRIVATE SERVICE', width: 140 },
    { label: 'Designation/Rank', width: 100 },
    { value: s3?.designation?.toUpperCase() || 'EXECUTIVE', width: TABLE_W - 360 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Employer name/business', width: 140 },
    { value: s3?.employerName?.toUpperCase() || '', width: TABLE_W - 140 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Employer Address', width: 110 },
    { value: s3?.employerAddress?.toUpperCase() || '', width: 220 },
    { label: 'Phone Number', width: 80 },
    { value: s3?.employerPhone || '', width: TABLE_W - 410 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Past occupation if any', width: 140 },
    { value: 'STUDENT', width: TABLE_W - 140 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Are/have you worked with Armed forces/ Police/ Para Military forces ?', width: 360 },
    { value: s3?.previousOrganizationMilitary ? 'YES' : 'NO', width: TABLE_W - 360 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Organization', width: 120 },
    { value: s3?.previousOrganizationName || '', width: 140 },
    { label: 'Designation', width: 90 },
    { value: s3?.previousDesignation || '', width: TABLE_W - 350 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Place of Posting', width: 120 },
    { value: s3?.previousPosting || '', width: 140 },
    { label: 'Rank', width: 90 },
    { value: s3?.previousRank || '', width: TABLE_W - 350 },
  ]);

  // SECTION H: Address of Place of Stay / Hotel
  p2Y = 430.1;
  p2Y = drawSectionHeader(page2, 'H. Address of Place of Stay / Hotel', p2Y);

  p2Y = drawTableRow(page2, p2Y, 13, [
    { label: 'Place/Hotel Name', width: 150, isBold: true },
    { label: 'Address of Place / Hotel', width: 200, isBold: true },
    { label: 'State', width: 80, isBold: true },
    { label: 'Phone No', width: TABLE_W - 430, isBold: true },
  ]);

  const hotelName = s8?.hotelName || s4?.referenceNameIndia || 'HOTEL THE PARK';
  const hotelAddr = s8?.address || s4?.referenceAddressIndia || s4?.referenceAddressIndiaLine1 || 'KOLKATA';
  const hotelState = s8?.state || s4?.referenceStateIndia || 'WEST BENGAL';
  const hotelPhone = s8?.phone || s4?.referencePhoneIndia || '';

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { value: `1 ${hotelName.toUpperCase()}`, width: 150 },
    { value: hotelAddr.toUpperCase(), width: 200 },
    { value: hotelState.toUpperCase(), width: 80 },
    { value: hotelPhone, width: TABLE_W - 430 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 12, [
    { value: '2 . ,', width: 150 },
    { value: '', width: 200 },
    { value: '', width: 80 },
    { value: '', width: TABLE_W - 430 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 12, [
    { value: '3 . ,', width: 150 },
    { value: '', width: 200 },
    { value: '', width: 80 },
    { value: '', width: TABLE_W - 430 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 12, [
    { value: '4 . ,', width: 150 },
    { value: '', width: 200 },
    { value: '', width: 80 },
    { value: '', width: TABLE_W - 430 },
  ]);

  // SECTION I: Details of Two Reference
  p2Y = 349.4;
  p2Y = drawSectionHeader(page2, 'I. Details of Two Reference', p2Y);

  p2Y = drawTableRow(page2, p2Y, 13, [
    { label: '', width: 60 },
    { label: 'In India', width: 220, isBold: true },
    { label: 'In BANGLADESH', width: TABLE_W - 280, isBold: true },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Name', width: 60 },
    { value: (s4?.referenceNameIndia || '').toUpperCase(), width: 220 },
    { value: (s4?.referenceNameBangladesh || '').toUpperCase(), width: TABLE_W - 280 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Address', width: 60 },
    { value: (s4?.referenceAddressIndiaLine1 || s4?.referenceAddressIndia || '').toUpperCase(), width: 220 },
    { value: (s4?.referenceAddressBangladeshLine1 || s4?.referenceAddressBangladesh || '').toUpperCase(), width: TABLE_W - 280 },
  ]);

  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { label: 'Phone Number', width: 75 },
    { value: s4?.referencePhoneIndia || '', width: 205 },
    { value: s4?.referencePhoneBangladesh || '', width: TABLE_W - 280 },
  ]);

  // SECTION DOCUMENTS UPLOADED
  p2Y = 271.8;
  p2Y = drawSectionHeader(page2, 'I. DOCUMENTS UPLOADED', p2Y);
  p2Y = drawTableRow(page2, p2Y, 13.5, [
    { value: '1) Copy of Passport page containing personal particulars', width: TABLE_W },
  ]);

  // SECTION K: DECLARATION
  drawSectionHeader(page2, 'K. DECLARATION', 245.0, 12.5);

  page2.drawRectangle({
    x: MARGIN_LEFT,
    y: 140.0,
    width: TABLE_W,
    height: 245.0 - 12.5 - 140.0,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5,
  });

  page2.drawText('a. I do not hold any other passport(s) other than those detailed above.', {
    x: 40.75,
    y: 221.0,
    size: 6.8,
    font: fontRegular,
    color: TEXT_COLOR,
  });

  page2.drawText('b. I have read and understood all the conditions for the visit to India and I am willing and able to abide fully by them.', {
    x: 40.75,
    y: 208.0,
    size: 6.8,
    font: fontRegular,
    color: TEXT_COLOR,
  });

  page2.drawText('c. I declare that the information given in the form is complete and correct and the visit to India will be undertaken for the purpose indicated in the', {
    x: 40.75,
    y: 195.0,
    size: 6.8,
    font: fontRegular,
    color: TEXT_COLOR,
  });
  page2.drawText('application.', {
    x: 40.75,
    y: 187.0,
    size: 6.8,
    font: fontRegular,
    color: TEXT_COLOR,
  });

  page2.drawText('d. I understand that in case the information provided in the form is found to be incorrect, I will be liable for denial of visit/ entry or deportation and/', {
    x: 40.75,
    y: 174.0,
    size: 6.8,
    font: fontRegular,
    color: TEXT_COLOR,
  });
  page2.drawText('or other penalties during the visit as provided by Indian law.', {
    x: 40.75,
    y: 166.0,
    size: 6.8,
    font: fontRegular,
    color: TEXT_COLOR,
  });

  page2.drawText('e. I will also submit hard-copy all the uploaded documents along with the print of application to submit to the concerning Indian Mission or', {
    x: 40.75,
    y: 154.0,
    size: 6.8,
    font: fontRegular,
    color: TEXT_COLOR,
  });
  page2.drawText('Agency for processing of visa application.', {
    x: 40.75,
    y: 146.0,
    size: 6.8,
    font: fontRegular,
    color: TEXT_COLOR,
  });

  // Footer: Date & Signatures (exact coordinates from official PDF: BGDDW1EF0826MD000915-2.pdf)
  page2.drawText(regDateFormatted, {
    x: 72.3,
    y: 117.6,
    size: 7.5,
    font: fontBold,
    color: TEXT_COLOR,
  });

  page2.drawText('................................', {
    x: 440.0,
    y: 117.6,
    size: 7.5,
    font: fontBold,
    color: TEXT_COLOR,
  });

  page2.drawText('Date :', {
    x: 40.75,
    y: 105.1,
    size: 7.5,
    font: fontBold,
    color: TEXT_COLOR,
  });

  page2.drawText('......................', {
    x: 72.3,
    y: 105.1,
    size: 7.5,
    font: fontBold,
    color: TEXT_COLOR,
  });

  page2.drawText("Applicant's signature (as in Passport)", {
    x: 410.0,
    y: 105.1,
    size: 7.5,
    font: fontBold,
    color: TEXT_COLOR,
  });

  // Biometric enrollment text
  const bioDate = new Date();
  bioDate.setFullYear(bioDate.getFullYear() + 2);
  const bioDateStr = `${String(bioDate.getDate()).padStart(2, '0')}/${String(bioDate.getMonth() + 1).padStart(2, '0')}/${bioDate.getFullYear()}`;
  const bioNotice = `Biometric Enrollment is not required till ${bioDateStr}.`;
  const bioW = fontBold.widthOfTextAtSize(bioNotice, 7.5);
  page2.drawText(bioNotice, {
    x: (PAGE_W - bioW) / 2,
    y: 88.0,
    size: 7.5,
    font: fontBold,
    color: TEXT_COLOR,
  });

  return await doc.save();
}
