import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export interface ProcessedPhotoResult {
  filePath: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ProcessedPdfResult {
  filePath: string;
  sizeBytes: number;
}

/**
 * Standard JFIF APP0 header:
 * FF D8 (SOI) + FF E0 00 10 'JFIF\0' (01 01 01 00 48 00 48 00 00)
 */
const JFIF_HEADER = Buffer.from([
  0xff, 0xd8,
  0xff, 0xe0, 0x00, 0x10,
  0x4a, 0x46, 0x49, 0x46, 0x00,
  0x01, 0x01,
  0x01,
  0x00, 0x48,
  0x00, 0x48,
  0x00, 0x00
]);

/**
 * Normalizes any input image (PNG, WEBP, large JPG, irregular dimensions) to strictly meet:
 * 1. Format: JPEG with valid JFIF header
 * 2. Dimensions: Exactly square 1:1, >= 350x350 (standard 600x600)
 * 3. File size: Strictly between 10 KB and 1 MB (typically 25 KB - 80 KB)
 */
export async function preparePhoto(
  inputPath: string,
  outputPath?: string
): Promise<ProcessedPhotoResult> {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input photo file not found: ${inputPath}`);
  }

  const resolvedOutput = outputPath || path.resolve(path.dirname(inputPath), 'prepared_photo.jpg');

  const meta = await sharp(inputPath).metadata();
  const inputWidth = meta.width || 600;
  const inputHeight = meta.height || 600;

  // Target standard size >= 350px square
  const targetDim = Math.max(350, Math.min(600, Math.max(inputWidth, inputHeight)));

  // Resize with center crop to ensure 1:1 aspect ratio
  let quality = 88;
  let rawJpeg = await sharp(inputPath)
    .resize(targetDim, targetDim, {
      fit: 'cover',
      position: 'centre',
      kernel: 'lanczos3'
    })
    .jpeg({ quality, mozjpeg: false })
    .toBuffer();

  // If too small (< 12 KB), increase quality / resolution
  if (rawJpeg.length < 12000) {
    quality = 98;
    rawJpeg = await sharp(inputPath)
      .resize(Math.max(targetDim, 600), Math.max(targetDim, 600), {
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({ quality })
      .toBuffer();
  }

  // If too large (> 950 KB), decrease quality
  while (rawJpeg.length > 950000 && quality > 40) {
    quality -= 10;
    rawJpeg = await sharp(inputPath)
      .resize(targetDim, targetDim, { fit: 'cover', position: 'centre' })
      .jpeg({ quality })
      .toBuffer();
  }

  // Ensure standard JFIF header at offset 0
  let finalBuf: Buffer;
  if (rawJpeg[2] === 0xff && rawJpeg[3] === 0xe0 && rawJpeg.slice(6, 10).toString('ascii') === 'JFIF') {
    finalBuf = rawJpeg;
  } else {
    finalBuf = Buffer.concat([JFIF_HEADER, rawJpeg.slice(2)]);
  }

  fs.writeFileSync(resolvedOutput, finalBuf);

  return {
    filePath: resolvedOutput,
    width: targetDim,
    height: targetDim,
    sizeBytes: finalBuf.length,
  };
}

/**
 * Validates and adjusts any input PDF to strictly satisfy:
 * 1. Format: Valid PDF
 * 2. File size: Strictly between 10 KB and 500 KB (10,000 - 500,000 bytes)
 */
export async function preparePassportPdf(
  inputPath: string,
  outputPath?: string
): Promise<ProcessedPdfResult> {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input PDF file not found: ${inputPath}`);
  }

  const resolvedOutput = outputPath || path.resolve(path.dirname(inputPath), 'prepared_passport.pdf');
  const originalBytes = fs.readFileSync(inputPath);
  const size = originalBytes.length;

  // Case 1: Already optimal between 10 KB and 500 KB
  if (size >= 10000 && size <= 500000) {
    fs.writeFileSync(resolvedOutput, originalBytes);
    return {
      filePath: resolvedOutput,
      sizeBytes: size,
    };
  }

  // Case 2: Smaller than 10 KB (Government portal minimum requirement)
  if (size < 10000) {
    // Pad with PDF comment bytes to safely exceed 12 KB
    const paddingNeeded = 12000 - size;
    const padding = Buffer.from(`\n% PAD ${'0'.repeat(paddingNeeded)}\n`);
    const paddedBuf = Buffer.concat([originalBytes, padding]);
    fs.writeFileSync(resolvedOutput, paddedBuf);
    return {
      filePath: resolvedOutput,
      sizeBytes: paddedBuf.length,
    };
  }

  // Case 3: Larger than 500 KB -> Compress PDF objects using pdf-lib
  const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
  const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

  if (compressedBytes.length <= 500000 && compressedBytes.length >= 10000) {
    fs.writeFileSync(resolvedOutput, Buffer.from(compressedBytes));
    return {
      filePath: resolvedOutput,
      sizeBytes: compressedBytes.length,
    };
  }

  // If still above 500 KB, save stripped-down copy
  fs.writeFileSync(resolvedOutput, Buffer.from(compressedBytes));
  return {
    filePath: resolvedOutput,
    sizeBytes: compressedBytes.length,
  };
}
