import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { preparePhoto, preparePassportPdf } from './mediaProcessor';

export async function generateMockPhoto(outputPath: string): Promise<void> {
  // SVG of a stylized, realistic specimen passport portrait on off-white background
  const svg = `
  <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient>
      <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#d4a373"/>
        <stop offset="100%" stop-color="#bc8a5f"/>
      </linearGradient>
      <linearGradient id="suit" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>

    <!-- Clean neutral background -->
    <rect width="600" height="600" fill="url(#bg)"/>

    <!-- Shoulders & Suit -->
    <path d="M 80 600 C 100 450, 200 420, 260 410 L 260 460 L 300 480 L 340 460 L 340 410 C 400 420, 500 450, 520 600 Z" fill="url(#suit)"/>

    <!-- White Shirt Collar & Tie -->
    <polygon points="260,410 300,470 340,410 320,410 300,440 280,410" fill="#ffffff"/>
    <polygon points="295,445 305,445 312,580 288,580" fill="#991b1b"/>

    <!-- Neck -->
    <path d="M 260 330 L 260 420 C 280 435, 320 435, 340 420 L 340 330 Z" fill="#bc8a5f"/>

    <!-- Head / Face -->
    <ellipse cx="300" cy="270" rx="105" ry="135" fill="url(#skin)"/>

    <!-- Hair -->
    <path d="M 185 240 C 180 140, 240 120, 300 120 C 360 120, 420 140, 415 240 C 400 170, 350 150, 300 150 C 250 150, 200 170, 185 240 Z" fill="#1c1917"/>

    <!-- Eyebrows -->
    <path d="M 230 220 Q 255 212 275 220" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 325 220 Q 345 212 370 220" stroke="#1c1917" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- Eyes -->
    <ellipse cx="255" cy="240" rx="14" ry="8" fill="#ffffff"/>
    <circle cx="255" cy="240" r="5" fill="#292524"/>
    <ellipse cx="345" cy="240" rx="14" ry="8" fill="#ffffff"/>
    <circle cx="345" cy="240" r="5" fill="#292524"/>

    <!-- Nose -->
    <path d="M 296 240 L 292 280 L 308 280" stroke="#a27448" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <!-- Mouth -->
    <path d="M 275 315 Q 300 325 325 315" stroke="#8c5836" stroke-width="3.5" stroke-linecap="round" fill="none"/>

    <!-- Specimen Label watermark at bottom -->
    <rect x="180" y="555" width="240" height="30" rx="6" fill="#000000" opacity="0.6"/>
    <text x="300" y="575" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="3">SPECIMEN PHOTO</text>
  </svg>
  `;

  const tempJpg = path.resolve(path.dirname(outputPath), 'temp_mock_photo.jpg');
  await sharp(Buffer.from(svg))
    .resize(600, 600)
    .jpeg({ quality: 92 })
    .toFile(tempJpg);

  // Guarantee valid JFIF header and 10KB - 1MB constraints
  await preparePhoto(tempJpg, outputPath);
  if (fs.existsSync(tempJpg)) fs.unlinkSync(tempJpg);
}

export interface MockPassportData {
  surname?: string;
  givenName?: string;
  passportNumber?: string;
  nid?: string;
  dob?: string;
  gender?: string;
  birthPlace?: string;
  issueDate?: string;
  expiryDate?: string;
}

export async function generateMockPassportPdf(
  photoPath: string,
  outputPath: string,
  data?: MockPassportData
): Promise<void> {
  // If no data provided, try to read from applicant.json
  let profileData: MockPassportData = {};
  try {
    const applicantFile = path.resolve(process.cwd(), 'applicant.json');
    if (fs.existsSync(applicantFile)) {
      const parsed = JSON.parse(fs.readFileSync(applicantFile, 'utf8'));
      const s2 = parsed.step2_applicant_details || {};
      const s1 = parsed.step1_registration || {};
      profileData = {
        surname: s2.surname,
        givenName: s2.givenName,
        passportNumber: s2.passportNumber,
        nid: s2.nationalIdNumber,
        dob: s1.dateOfBirth,
        gender: s2.gender,
        birthPlace: s2.birthCity,
        issueDate: s2.passportDateOfIssue,
        expiryDate: s2.passportDateOfExpiry,
      };
    }
  } catch {
    // ignore
  }

  const merged = { ...profileData, ...data };
  const surname = (merged.surname || 'CHOWDHURY').toUpperCase();
  const givenName = (merged.givenName || 'TAREK HASAN').toUpperCase();
  const passportNumber = (merged.passportNumber || 'B09871234').toUpperCase();
  const nid = (merged.nid || '19982691234567891').toUpperCase();
  const dob = (merged.dob || '12/09/1998').toUpperCase();
  const gender = (merged.gender || 'M').toUpperCase();
  const birthPlace = (merged.birthPlace || 'DHAKA').toUpperCase();
  const issueDate = (merged.issueDate || '15/03/2022').toUpperCase();
  const expiryDate = (merged.expiryDate || '14/03/2032').toUpperCase();

  const pdfDoc = await PDFDocument.create();
  // Standard passport biodata page (Landscape roughly 540 x 360)
  const page = pdfDoc.addPage([540, 360]);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Background tint
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 540,
    height: 360,
    color: rgb(0.97, 0.98, 0.96),
  });

  // Security Border
  page.drawRectangle({
    x: 10,
    y: 10,
    width: 520,
    height: 340,
    borderColor: rgb(0.15, 0.35, 0.25),
    borderWidth: 2,
  });

  // Header banner
  page.drawRectangle({
    x: 12,
    y: 310,
    width: 516,
    height: 38,
    color: rgb(0.08, 0.35, 0.2),
  });

  page.drawText("PEOPLE'S REPUBLIC OF BANGLADESH", {
    x: 140,
    y: 332,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("PASSPORT / PASSEPORT", {
    x: 195,
    y: 318,
    size: 9,
    font: fontRegular,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Embed Photo
  if (fs.existsSync(photoPath)) {
    const photoBytes = fs.readFileSync(photoPath);
    const photoImage = await pdfDoc.embedJpg(photoBytes);
    page.drawImage(photoImage, {
      x: 25,
      y: 130,
      width: 120,
      height: 150,
    });
    // Photo border
    page.drawRectangle({
      x: 24,
      y: 129,
      width: 122,
      height: 152,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
  }

  // Biodata fields on right
  const startX = 165;
  let curY = 285;

  const drawField = (label: string, value: string, xOffset = startX, yOffset = curY) => {
    page.drawText(label.toUpperCase(), {
      x: xOffset,
      y: yOffset,
      size: 7,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(value.toUpperCase(), {
      x: xOffset,
      y: yOffset - 9,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
  };

  drawField('Type / Code', 'P / BGD', startX, 285);
  drawField('Passport No.', passportNumber, startX + 180, 285);

  drawField('Surname', surname, startX, 255);
  drawField('Given Name', givenName, startX, 225);

  drawField('Nationality', 'BANGLADESHI', startX, 195);
  drawField('Personal No. (NID)', nid, startX + 180, 195);

  drawField('Date of Birth', dob, startX, 165);
  drawField('Sex', gender, startX + 110, 165);
  drawField('Place of Birth', `${birthPlace}, BGD`, startX + 180, 165);

  drawField('Date of Issue', issueDate, startX, 135);
  drawField('Date of Expiry', expiryDate, startX + 110, 135);
  drawField('Authority', 'DIP / DHAKA', startX + 220, 135);

  // Watermark "SPECIMEN"
  page.drawText('SPECIMEN - FOR TESTING ONLY', {
    x: 100,
    y: 190,
    size: 24,
    font: fontBold,
    color: rgb(0.85, 0.2, 0.2),
    rotate: degrees(25),
    opacity: 0.35,
  });

  // MRZ Machine Readable Zone
  page.drawRectangle({
    x: 15,
    y: 18,
    width: 510,
    height: 70,
    color: rgb(0.92, 0.93, 0.94),
  });

  const cleanSurname = surname.replace(/[^A-Z]/g, '');
  const cleanGiven = givenName.replace(/\s+/g, '<').replace(/[^A-Z<]/g, '');
  const mrz1 = `P<BGD${cleanSurname}<<${cleanGiven}`.padEnd(44, '<').substring(0, 44);
  const cleanPpt = passportNumber.replace(/[^A-Z0-9]/g, '');
  const mrz2 = `${cleanPpt}7BGD9809121${gender}3203141<<<<<<<<<<<<<<06`.padEnd(44, '<').substring(0, 44);

  page.drawText(mrz1, {
    x: 25,
    y: 55,
    size: 13,
    font: fontCourier,
    color: rgb(0, 0, 0),
  });

  page.drawText(mrz2, {
    x: 25,
    y: 32,
    size: 13,
    font: fontCourier,
    color: rgb(0, 0, 0),
  });

  const tempPdf = path.resolve(path.dirname(outputPath), 'temp_mock_passport.pdf');
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(tempPdf, pdfBytes);

  // Guarantee valid 10KB - 500KB constraints
  await preparePassportPdf(tempPdf, outputPath);
  if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
}

// Direct execution
async function main() {
  const assetsDir = path.resolve(process.cwd(), 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const photoTarget = path.join(assetsDir, 'photo.jpg');
  const pdfTarget = path.join(assetsDir, 'passport.pdf');

  console.log('🎨 Generating Mock Passport Photo...');
  await generateMockPhoto(photoTarget);
  const photoStat = fs.statSync(photoTarget);
  console.log(`✅ Generated ${photoTarget} (${photoStat.size} bytes)`);

  console.log('📄 Generating Mock Passport PDF...');
  await generateMockPassportPdf(photoTarget, pdfTarget);
  const pdfStat = fs.statSync(pdfTarget);
  console.log(`✅ Generated ${pdfTarget} (${pdfStat.size} bytes)`);
}

if (process.argv[1]?.includes('generateMockAssets')) {
  main().catch(console.error);
}
