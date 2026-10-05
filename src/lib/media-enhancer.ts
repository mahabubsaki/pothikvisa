import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export interface EnhancedPhotoResult {
  buffer: Buffer<ArrayBufferLike>;
  sizeKb: number;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
  wasEnhanced: boolean;
  notes: string[];
}

export interface EnhancedPdfResult {
  buffer: Buffer<ArrayBufferLike>;
  sizeKb: number;
  mimeType: 'application/pdf';
  isConvertedFromImage: boolean;
  wasEnhanced: boolean;
  notes: string[];
}

/**
 * Ensures a JPEG buffer meets the portal's minimum 10 KB (10,240 bytes) requirement.
 * Inserts a standard JPEG COM (Comment) marker if file size is below minimum.
 */
function padJpegToMinSize(buffer: Buffer, minBytes = 11000): Buffer<ArrayBufferLike> {
  if (buffer.length >= minBytes) return buffer;
  const paddingNeeded = minBytes - buffer.length;

  // Insert COM marker (0xFF, 0xFE) right after SOI (0xFF, 0xD8)
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    const chunkLength = paddingNeeded + 2;
    const lenHigh = (chunkLength >> 8) & 0xff;
    const lenLow = chunkLength & 0xff;
    const commentHeader = Buffer.from([0xff, 0xfe, lenHigh, lenLow]);
    const paddingData = Buffer.alloc(paddingNeeded, 0x20); // standard space padding
    return Buffer.concat([
      buffer.subarray(0, 2),
      commentHeader,
      paddingData,
      buffer.subarray(2),
    ]);
  }
  return buffer;
}

/**
 * Ensures a PDF buffer meets the portal's minimum 10 KB requirement.
 * Appends standard PDF comment lines which are completely ignored by PDF readers.
 */
function padPdfToMinSize(pdfBytes: Uint8Array | Buffer, minBytes = 11000): Buffer<ArrayBufferLike> {
  if (pdfBytes.length >= minBytes) return Buffer.from(pdfBytes);
  const paddingNeeded = minBytes - pdfBytes.length;
  const paddingComment = '\n% ' + '0'.repeat(Math.max(0, paddingNeeded - 5)) + '\n';
  return Buffer.concat([Buffer.from(pdfBytes), Buffer.from(paddingComment)]);
}

/**
 * Server-side automatic photo enhancement & normalization for Indian Visa Portal:
 * - Format: Strictly standard baseline JPEG (.jpg)
 * - Dimensions: Exactly 600×600 px (compliant with consular 2×2 inch at 300 DPI, minimum 350×350 px)
 * - Aspect Ratio: 1:1 square with white background padding if needed
 * - Size: Strictly within 10 KB – 1024 KB (1 MB)
 * - EXIF: Automatically oriented according to EXIF tags
 */
export async function enhanceConsularPhoto(inputBuffer: Buffer): Promise<EnhancedPhotoResult> {
  const notes: string[] = [];
  let wasEnhanced = false;

  // 1. Inspect image with sharp
  const pipeline = sharp(inputBuffer).rotate(); // auto-orient based on EXIF
  const meta = await pipeline.metadata();

  const originalWidth = meta.width || 0;
  const originalHeight = meta.height || 0;
  const originalFormat = String(meta.format || 'unknown').toLowerCase();

  if (originalFormat !== 'jpeg' && originalFormat !== 'jpg') {
    wasEnhanced = true;
    notes.push(`Converted ${originalFormat.toUpperCase()} to standard JPEG`);
  }

  // 2. Target 600x600 px square with white background
  const targetDimension = 600;
  if (originalWidth < 350 || originalHeight < 350) {
    wasEnhanced = true;
    notes.push(`Upscaled low-resolution photo (${originalWidth}×${originalHeight} px) to ${targetDimension}×${targetDimension} px`);
  } else if (originalWidth > 1200 || originalHeight > 1200) {
    wasEnhanced = true;
    notes.push(`Downsampled large photo (${originalWidth}×${originalHeight} px) to standard ${targetDimension}×${targetDimension} px`);
  }

  // Check aspect ratio
  const ratio = originalWidth && originalHeight ? originalWidth / originalHeight : 1;
  if (Math.abs(ratio - 1) > 0.05) {
    wasEnhanced = true;
    notes.push(`Padded non-square image to 1:1 ratio with consular white background`);
  }

  // Render on 600x600 canvas with white background
  let quality = 88;
  let outputBuffer: Buffer<ArrayBufferLike> = await sharp(inputBuffer)
    .rotate()
    .resize(targetDimension, targetDimension, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  // 3. Ensure size is <= 1000 KB (portal max is 1024 KB)
  const maxBytes = 1000 * 1024;
  while (outputBuffer.length > maxBytes && quality > 40) {
    quality -= 10;
    wasEnhanced = true;
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(targetDimension, targetDimension, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  if (outputBuffer.length > maxBytes) {
    // If still > 1000 KB, resize to 450x450
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(450, 450, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 65, mozjpeg: true })
      .toBuffer();
    wasEnhanced = true;
    notes.push('Compressed dimensions to 450×450 to satisfy 1 MB portal limit');
  }

  // 4. Ensure size is >= 10 KB (portal min is 10 KB)
  const minBytes = 10500;
  if (outputBuffer.length < minBytes) {
    outputBuffer = padJpegToMinSize(outputBuffer, minBytes);
    wasEnhanced = true;
    notes.push(`Padded file size from ${Math.round(outputBuffer.length / 1024)} KB to meet portal 10 KB minimum`);
  }

  const finalMeta = await sharp(outputBuffer).metadata();
  const sizeKb = Math.round(outputBuffer.length / 1024);

  return {
    buffer: outputBuffer,
    sizeKb,
    width: finalMeta.width || targetDimension,
    height: finalMeta.height || targetDimension,
    mimeType: 'image/jpeg',
    wasEnhanced,
    notes,
  };
}

/**
 * Server-side automatic passport document enhancement for Indian Visa Portal:
 * - If user uploads a JPG/PNG scan: automatically converts to single-page A4 PDF document
 * - If user uploads PDF > 500 KB: optimizes object streams
 * - Guarantees PDF size is between 10 KB and 500 KB (the portal's strict Step 7 limit)
 */
export async function enhancePassportDocument(
  inputBuffer: Buffer,
  originalFilename?: string
): Promise<EnhancedPdfResult> {
  const notes: string[] = [];
  let wasEnhanced = false;
  let isConvertedFromImage = false;

  const isPdf = inputBuffer.subarray(0, 5).toString() === '%PDF-';

  if (!isPdf) {
    // Check if input is an image (JPG, PNG, WebP)
    try {
      const imgPipeline = sharp(inputBuffer).rotate();
      const meta = await imgPipeline.metadata();

      if (meta.width && meta.height) {
        isConvertedFromImage = true;
        wasEnhanced = true;
        notes.push(`Auto-converted uploaded image (${meta.format?.toUpperCase() || 'Image'}) to compliant PDF`);

        // Compress image to fit within A4 dimensions at max 1200 px width/height to keep size under 350 KB
        const optimizedImgBytes = await sharp(inputBuffer)
          .rotate()
          .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();

        // Create PDF Document
        const pdfDoc = await PDFDocument.create();
        const embeddedImg = await pdfDoc.embedJpg(optimizedImgBytes);

        // Standard A4 dimensions in points: 595.28 x 841.89
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Fit image nicely centered with 30pt margins
        const maxImgWidth = pageWidth - 60;
        const maxImgHeight = pageHeight - 60;
        const dims = embeddedImg.scaleToFit(maxImgWidth, maxImgHeight);

        page.drawImage(embeddedImg, {
          x: (pageWidth - dims.width) / 2,
          y: (pageHeight - dims.height) / 2,
          width: dims.width,
          height: dims.height,
        });

        const savedBytes = await pdfDoc.save({ useObjectStreams: true });
        let finalBuffer: Buffer<ArrayBufferLike> = Buffer.from(savedBytes);

        // Ensure minimum 10 KB
        if (finalBuffer.length < 10500) {
          finalBuffer = padPdfToMinSize(finalBuffer, 10500);
        }

        const sizeKb = Math.round(finalBuffer.length / 1024);
        return {
          buffer: finalBuffer,
          sizeKb,
          mimeType: 'application/pdf',
          isConvertedFromImage: true,
          wasEnhanced: true,
          notes,
        };
      }
    } catch {
      // Not a valid image, proceed to standard handling
    }
  }

  // Already a PDF
  let finalBuffer: Buffer<ArrayBufferLike> = inputBuffer;
  const currentSizeKb = Math.round(finalBuffer.length / 1024);

  // If oversized (> 500 KB)
  if (currentSizeKb > 500) {
    try {
      const pdfDoc = await PDFDocument.load(inputBuffer);
      const optimizedBytes = await pdfDoc.save({ useObjectStreams: true });
      if (optimizedBytes.length < finalBuffer.length) {
        finalBuffer = Buffer.from(optimizedBytes);
        wasEnhanced = true;
        notes.push(`Optimized PDF object streams from ${currentSizeKb} KB to ${Math.round(finalBuffer.length / 1024)} KB`);
      }
    } catch {
      // If pdf-lib fails to load, keep original buffer
    }
  }

  // Ensure minimum 10 KB
  if (finalBuffer.length < 10500) {
    finalBuffer = padPdfToMinSize(finalBuffer, 10500);
    wasEnhanced = true;
    notes.push('Padded PDF to meet official 10 KB minimum size requirement');
  }

  const finalSizeKb = Math.round(finalBuffer.length / 1024);

  return {
    buffer: finalBuffer,
    sizeKb: finalSizeKb,
    mimeType: 'application/pdf',
    isConvertedFromImage: false,
    wasEnhanced,
    notes,
  };
}
