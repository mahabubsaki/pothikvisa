import { Area } from 'react-easy-crop';

/**
 * Creates an image element from a source URL
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export interface CroppedImageResult {
  blob: Blob;
  file: File;
  url: string;
  width: number;
  height: number;
  sizeKb: number;
}

/**
 * Crops and exports high-quality 2x2 inch consular JPEG
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  targetSize = 600
): Promise<CroppedImageResult> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // fill white background (Indian visa requirement: pure white/light background)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, bBoxWidth, bBoxHeight);

  // translate canvas center to draw rotated image
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // cropped canvas at target dimensions (e.g. 600x600 px)
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Cropped canvas 2D context not available');
  }

  croppedCanvas.width = targetSize;
  croppedCanvas.height = targetSize;

  croppedCtx.fillStyle = '#FFFFFF';
  croppedCtx.fillRect(0, 0, targetSize, targetSize);

  croppedCtx.imageSmoothingEnabled = true;
  croppedCtx.imageSmoothingQuality = 'high';

  // Draw cropped image into the final 600x600 canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  // Convert to high-quality JPEG (< 300 KB, > 10 KB)
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }

        const sizeKb = Math.round(blob.size / 1024);
        const file = new File([blob], 'consular_photo_2x2.jpg', {
          type: 'image/jpeg',
        });
        const url = URL.createObjectURL(blob);

        resolve({
          blob,
          file,
          url,
          width: targetSize,
          height: targetSize,
          sizeKb,
        });
      },
      'image/jpeg',
      0.92
    );
  });
}
