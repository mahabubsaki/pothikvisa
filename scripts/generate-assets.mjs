import sharp from 'sharp';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createAssets() {
  if (!fs.existsSync('assets')) fs.mkdirSync('assets', { recursive: true });

  const svg = `
    <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="600" fill="#ffffff"/>
      <!-- Head / Hair -->
      <circle cx="300" cy="230" r="120" fill="#1e293b"/>
      <!-- Face -->
      <ellipse cx="300" cy="240" rx="95" ry="115" fill="#d4a373"/>
      <!-- Eyes -->
      <ellipse cx="260" cy="230" rx="10" ry="6" fill="#1e293b"/>
      <ellipse cx="340" cy="230" rx="10" ry="6" fill="#1e293b"/>
      <!-- Nose -->
      <path d="M300 230 L295 270 L305 270 Z" fill="#bc8a5f"/>
      <!-- Mouth -->
      <path d="M275 295 Q300 310 325 295" stroke="#a26c48" stroke-width="4" fill="none"/>
      <!-- Shoulders / Formal Suit -->
      <path d="M120 600 C150 420 220 380 300 380 C380 380 450 420 480 600 Z" fill="#0f172a"/>
      <!-- Collar & Tie -->
      <polygon points="270,380 330,380 315,460 285,460" fill="#ffffff"/>
      <polygon points="290,390 310,390 315,500 300,520 285,500" fill="#991b1b"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 92, chromaSubsampling: '4:2:0' })
    .toFile('assets/photo.jpg');
  console.log('✅ assets/photo.jpg created:', fs.statSync('assets/photo.jpg').size, 'bytes');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("PEOPLE'S REPUBLIC OF BANGLADESH", { x: 150, y: 780, size: 16, font, color: rgb(0.05, 0.4, 0.2) });
  page.drawText('PASSPORT / PASSEPORT', { x: 220, y: 760, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
  page.drawRectangle({ x: 50, y: 350, width: 495, height: 380, borderColor: rgb(0.2, 0.2, 0.2), borderWidth: 1 });

  page.drawText('Type / Code: P / BGD', { x: 80, y: 690, size: 10, font: regular });
  page.drawText('Passport No: B09871234', { x: 300, y: 690, size: 11, font });
  page.drawText('Surname: CHOWDHURY', { x: 80, y: 660, size: 11, font });
  page.drawText('Given Name: TAREK HASAN', { x: 80, y: 630, size: 11, font });
  page.drawText('Nationality: BANGLADESHI', { x: 80, y: 600, size: 10, font: regular });
  page.drawText('Personal No / NID: 19982691234567891', { x: 80, y: 570, size: 10, font: regular });
  page.drawText('Date of Birth: 12/09/1998', { x: 80, y: 540, size: 10, font: regular });
  page.drawText('Place of Birth: DHAKA', { x: 300, y: 540, size: 10, font: regular });
  page.drawText('Date of Issue: 15/03/2022', { x: 80, y: 510, size: 10, font: regular });
  page.drawText('Date of Expiry: 14/03/2032', { x: 300, y: 510, size: 10, font: regular });
  page.drawText('Issuing Authority: DIP / DHAKA', { x: 80, y: 480, size: 10, font: regular });

  page.drawRectangle({ x: 60, y: 360, width: 475, height: 70, color: rgb(0.95, 0.95, 0.95) });
  const mono = await pdfDoc.embedFont(StandardFonts.CourierBold);
  page.drawText('P<BGDCHOWDHURY<<TAREK<HASAN<<<<<<<<<<<<<<<<<<', { x: 75, y: 405, size: 12, font: mono, color: rgb(0, 0, 0) });
  page.drawText('B098712348BGD9809127M32031421998269123456<28', { x: 75, y: 380, size: 12, font: mono, color: rgb(0, 0, 0) });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('assets/passport.pdf', pdfBytes);
  console.log('✅ assets/passport.pdf created:', fs.statSync('assets/passport.pdf').size, 'bytes');
}

createAssets().catch(console.error);
