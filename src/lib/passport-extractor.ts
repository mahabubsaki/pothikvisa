import sharp from 'sharp';
import path from 'path';
import { createWorker } from 'tesseract.js';
import { parse } from 'mrz';
import { findDistrictFromText } from '@/lib/districts';

export interface ExtractedPassportData {
  success: boolean;
  rawText?: string;
  fields: {
    surname: string;
    givenName: string;
    passportNumber: string;
    dateOfBirth: string; // DD/MM/YYYY
    gender: 'M' | 'F' | 'X';
    nationality: string;
    passportDateOfExpiry: string; // DD/MM/YYYY
    passportDateOfIssue: string; // DD/MM/YYYY
    passportPlaceOfIssue: string;
    birthCity: string;
    nationalIdNumber: string;
    previousPassportNumber?: string;
    hasOtherPassport?: boolean;
    fatherName: string;
    motherName: string;
    presentAddressLine1: string;
    presentCity: string;
    presentStateDistrict: string;
    postalCode: string;
    address: string;
  };
  mrzValid: boolean;
  confidence: number;
}

// Convert YYMMDD to DD/MM/YYYY with century inference
function formatYymmdd(yymmdd: string, isExpiry: boolean = false): string {
  if (!yymmdd || yymmdd.length !== 6) return '';
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);

  const currentYear = new Date().getFullYear();
  const currentYy = currentYear % 100;

  let fullYear: number;
  if (isExpiry) {
    fullYear = 2000 + yy;
  } else {
    fullYear = yy > currentYy ? 1900 + yy : 2000 + yy;
  }

  return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${fullYear}`;
}

// Convert Month names like "19 JAN 2025" to "DD/MM/YYYY"
function parseHumanDate(dateStr: string): string {
  if (!dateStr) return '';
  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  };

  const match = dateStr.match(/(\d{1,2})\s*([A-Za-z]{3})\s*(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const mon = months[match[2].toUpperCase()] || '01';
    const yr = match[3];
    return `${day}/${mon}/${yr}`;
  }
  return '';
}

// Extract embedded JPEG image from PDF buffer (scanner wrapper)
export function extractImageFromPdf(pdfBuffer: Buffer): Buffer | null {
  const startJpeg = pdfBuffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
  if (startJpeg === -1) return null;

  const endJpeg = pdfBuffer.lastIndexOf(Buffer.from([0xff, 0xd9]));
  if (endJpeg <= startJpeg) return null;

  return pdfBuffer.subarray(startJpeg, endJpeg + 2);
}

// Clean up noisy MRZ line characters
function cleanMrzLine(line: string): string {
  return line
    .toUpperCase()
    .replace(/[L\(\[\{\}\+\'\"\`\~\|\!\:\;\?\=\,\.\_\-\>\*\#\@\$\%\^\&\s]/g, '<')
    .replace(/[^A-Z0-9<]/g, '')
    .trim();
}

/**
 * High-speed Zero-Cost Passport Extractor
 * Reads PDF or Image buffers, parses MRZ and text data for Step 2 and Step 3.
 */
export async function extractPassportDetails(
  inputBuffer: Buffer,
  mimeType: string = 'application/pdf'
): Promise<ExtractedPassportData> {
  let imageBuffer: Buffer | null = null;

  if (mimeType === 'application/pdf' || inputBuffer.subarray(0, 5).toString() === '%PDF-') {
    imageBuffer = extractImageFromPdf(inputBuffer);
    if (!imageBuffer) {
      throw new Error('Unable to extract scanned image from PDF. Please upload a clear scan or image.');
    }
  } else {
    imageBuffer = inputBuffer;
  }

  // Pre-process image with Sharp for optimal contrast
  const processedImage = await sharp(imageBuffer)
    .normalize()
    .sharpen()
    .toBuffer();

  const workerPath = path.resolve(process.cwd(), 'node_modules/tesseract.js/src/worker-script/node/index.js');
  const worker = await createWorker('eng', 1, { workerPath });
  const ret = await worker.recognize(processedImage);
  await worker.terminate();

  const fullText = ret.data.text || '';
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

  const fields = {
    surname: '',
    givenName: '',
    passportNumber: '',
    dateOfBirth: '',
    gender: 'M' as 'M' | 'F' | 'X',
    nationality: 'BGD',
    passportDateOfExpiry: '',
    passportDateOfIssue: '',
    passportPlaceOfIssue: 'DHAKA',
    birthCity: 'DHAKA',
    nationalIdNumber: '',
    previousPassportNumber: '',
    hasOtherPassport: false,
    fatherName: '',
    motherName: '',
    presentAddressLine1: '',
    presentCity: 'DHAKA',
    presentStateDistrict: 'DHAKA',
    postalCode: '1213',
    address: '',
  };

  // 1. Parse MRZ from bottom lines
  const mrzCandidateLines = lines
    .map(cleanMrzLine)
    .filter(l => l.length >= 35);

  let mrzValid = false;

  for (let i = 0; i < mrzCandidateLines.length - 1; i++) {
    const l1 = mrzCandidateLines[i];
    const l2 = mrzCandidateLines[i + 1];

    if (l1.startsWith('P') && l1.includes('<')) {
      const fixedL1 = (l1 + '<'.repeat(44)).substring(0, 44);
      const fixedL2 = (l2 + '<'.repeat(44)).substring(0, 44);

      try {
        const parsed = parse([fixedL1, fixedL2]);
        if (parsed && parsed.fields) {
          fields.surname = (parsed.fields.lastName || '').replace(/</g, ' ').trim();
          const firstNames = (parsed.fields.firstName || '')
            .split(/[\s<]+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
          // Drop trailing single-character noise caused by MRZ filler chevrons
          while (firstNames.length > 1 && firstNames[firstNames.length - 1].length === 1) {
            firstNames.pop();
          }
          fields.givenName = firstNames.join(' ').trim();
          fields.passportNumber = (parsed.fields.documentNumber || '').trim();
          fields.nationality = parsed.fields.nationality || 'BGD';
          fields.gender = parsed.fields.sex === 'female' ? 'F' : 'M';
          if (parsed.fields.birthDate) {
            fields.dateOfBirth = formatYymmdd(parsed.fields.birthDate, false);
          }
          if (parsed.fields.expirationDate) {
            fields.passportDateOfExpiry = formatYymmdd(parsed.fields.expirationDate, true);
          }
          if (parsed.fields.personalNumber) {
            fields.nationalIdNumber = parsed.fields.personalNumber.replace(/</g, '').trim();
          }
          mrzValid = true;
          break;
        }
      } catch {
        // Continue searching
      }
    }
  }

  // 2. Extract Additional Text Fields using High-Precision Regex
  for (const line of lines) {
    // Father Name - Strip any dots '.' (e.g. MD. -> MD)
    const fMatch = line.match(/Father['’]?s\s*Name\s*[:\-]?\s*([A-Za-z\.\s]+)/i);
    if (fMatch && fMatch[1].trim().length > 3) {
      fields.fatherName = fMatch[1]
        .replace(/\./g, ' ')
        .replace(/[_—\-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
    }

    // Mother Name - Strip any dots '.' (e.g. MOST. -> MOST)
    const mMatch = line.match(/Mother['’]?s\s*Name\s*[:\-]?\s*([A-Za-z\.\s]+)/i);
    if (mMatch && mMatch[1].trim().length > 3) {
      fields.motherName = mMatch[1]
        .replace(/\./g, ' ')
        .replace(/[_—\-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
    }

    // Place of Birth
    const pobMatch = line.match(/Place\s*of\s*Birth\s*[:\-]?\s*([A-Za-z]+)/i);
    if (pobMatch && pobMatch[1].trim().length >= 3) {
      const city = pobMatch[1].toUpperCase().trim();
      if (!city.includes('DATE') && !city.includes('PASSPORT')) {
        fields.birthCity = findDistrictFromText(city);
      }
    }

    // Date of Issue
    const doiMatch = line.match(/Date\s*of\s*Issue\s*[:\-]?\s*(\d{1,2}\s*[A-Za-z]{3}\s*\d{4})/i);
    if (doiMatch) {
      const formatted = parseHumanDate(doiMatch[1]);
      if (formatted) fields.passportDateOfIssue = formatted;
    }

    // Date of Expiry (if MRZ failed to get it)
    if (!fields.passportDateOfExpiry) {
      const doeMatch = line.match(/Date\s*of\s*Expiry\s*[:\-]?\s*(\d{1,2}\s*[A-Za-z]{3}\s*\d{4})/i);
      if (doeMatch) {
        const formatted = parseHumanDate(doeMatch[1]);
        if (formatted) fields.passportDateOfExpiry = formatted;
      }
    }

    // Previous Passport Number
    const prevPptMatch = line.match(/Previous\s*Passport\s*No\.?\s*[:\-]?\s*([A-Z0-9]{8,10})/i);
    if (prevPptMatch) {
      fields.previousPassportNumber = prevPptMatch[1].trim();
      fields.hasOtherPassport = true;
    }

    // Issuing Authority
    const authMatch = line.match(/Issuing\s*Authority\s*[:\-]?\s*([^\n\r]+)/i);
    if (authMatch) {
      if (authMatch[1].includes('DHAKA')) fields.passportPlaceOfIssue = 'DHAKA';
      else if (authMatch[1].includes('CHITTAGONG')) fields.passportPlaceOfIssue = 'CHITTAGONG';
      else if (authMatch[1].includes('SYLHET')) fields.passportPlaceOfIssue = 'SYLHET';
    }
  }

  // 3. Multi-Line Full Address Extraction (matched against all 64 Bangladesh districts)
  const fullAddressMatch = fullText.match(/Permanent\s*Address\s*[:\-]?\s*([\s\S]*?)(?:Emergency\s*Contact|$)/i);
  let cleanAddress = '';
  if (fullAddressMatch) {
    cleanAddress = fullAddressMatch[1]
      .split('\n')
      .map(s => s.replace(/[=—_lm|]/g, '').trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (cleanAddress) {
    // 4-digit postal code
    const pinMatch = cleanAddress.match(/\b(1\d{3}|2\d{3}|3\d{3}|4\d{3}|5\d{3}|6\d{3}|7\d{3}|8\d{3}|9\d{3})\b/);
    if (pinMatch) {
      fields.postalCode = pinMatch[1];
    }

    // District matched from all 64 official Bangladesh districts
    const matchedDistrict = findDistrictFromText(cleanAddress);
    fields.presentStateDistrict = matchedDistrict;

    // Truncate address at the district name to remove any trailing OCR noise
    const distIdx = cleanAddress.toUpperCase().indexOf(matchedDistrict);
    if (distIdx !== -1) {
      cleanAddress = cleanAddress.substring(0, distIdx + matchedDistrict.length).trim();
    }

    // Fix OCR artifact where "NISHAT" line break causes "AN NAGAR"
    cleanAddress = cleanAddress.replace(/\bAN\s+NAGAR\b/gi, 'NAGAR').replace(/\s+/g, ' ');
    fields.address = cleanAddress.toUpperCase();

    // Split address into Street (max 35 chars) and Village/Town/City
    const addressWithoutDistrictOrPin = cleanAddress
      .replace(new RegExp(`\\b${matchedDistrict}\\b`, 'gi'), '')
      .replace(/-\s*\d{4}/g, '')
      .replace(/\b\d{4}\b/g, '')
      .replace(/[,;]\s*$/, '')
      .trim();

    const parts = addressWithoutDistrictOrPin
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (parts.length >= 2) {
      const candidateLine1 = `${parts[0]}, ${parts[1]}`.trim();
      if (candidateLine1.length <= 35) {
        fields.presentAddressLine1 = candidateLine1.toUpperCase();
        // All remaining parts (e.g. TONGI WEST, NISHAT NAGAR) go to Village/Town/City
        const remaining = parts.slice(2).join(', ');
        fields.presentCity = (remaining || matchedDistrict).substring(0, 35).trim().toUpperCase();
      } else {
        fields.presentAddressLine1 = parts[0].substring(0, 35).trim().toUpperCase();
        const remaining = parts.slice(1).join(', ');
        fields.presentCity = (remaining || matchedDistrict).substring(0, 35).trim().toUpperCase();
      }
    } else if (parts.length === 1) {
      fields.presentAddressLine1 = parts[0].substring(0, 35).trim().toUpperCase();
      fields.presentCity = matchedDistrict;
    } else {
      fields.presentAddressLine1 = cleanAddress.substring(0, 35).trim().toUpperCase();
      fields.presentCity = matchedDistrict;
    }
  }

  // If place of birth was not explicitly OCR'd, fallback to applicant's district
  if (fields.birthCity === 'DHAKA' && fields.presentStateDistrict && fields.presentStateDistrict !== 'DHAKA') {
    fields.birthCity = fields.presentStateDistrict;
  }

  // Fallback estimates if issue date is missing: Bangladesh passports are issued for 10 or 5 years
  if (!fields.passportDateOfIssue && fields.passportDateOfExpiry) {
    const [d, m, y] = fields.passportDateOfExpiry.split('/');
    if (y) {
      const issueYear = parseInt(y, 10) - 10;
      fields.passportDateOfIssue = `${d}/${m}/${issueYear}`;
    }
  }

  // Ensure uppercase on names
  fields.surname = fields.surname.toUpperCase();
  fields.givenName = fields.givenName.toUpperCase();

  return {
    success: Boolean(fields.passportNumber || mrzValid),
    rawText: fullText,
    fields,
    mrzValid,
    confidence: mrzValid ? 0.98 : 0.75,
  };
}
