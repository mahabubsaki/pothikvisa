import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'cbbf25b9adfdabd7b6b2a000d043c6d4';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'pothikvisa-documents';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

let s3ClientInstance: S3Client | null = null;

/**
 * Checks whether Cloudflare R2 credentials are fully configured.
 */
export function isR2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME
  );
}

/**
 * Returns an authenticated S3Client connected to Cloudflare R2.
 */
export function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    if (!isR2Configured()) {
      throw new Error(
        'Cloudflare R2 is not fully configured. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in your environment.'
      );
    }
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3ClientInstance;
}

export interface R2UploadResult {
  key: string;
  url: string;
  storage: 'r2' | 'local';
  size: number;
}

/**
 * Uploads a file buffer to Cloudflare R2 (or local disk fallback if R2 is not yet configured).
 */
export async function uploadBufferToStorage(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<R2UploadResult> {
  const { key, buffer, contentType } = params;

  // 1. If R2 is configured, upload to Cloudflare R2
  if (isR2Configured()) {
    try {
      const client = getR2Client();
      await client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const url = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
        : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

      console.log(`☁️ [R2] Uploaded object: ${key} (${buffer.length} bytes)`);
      return {
        key,
        url,
        storage: 'r2',
        size: buffer.length,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ [R2] Failed to upload to Cloudflare R2, falling back to local storage:`, errMsg);
    }
  }

  // 2. Local disk fallback
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  const targetPath = path.join(uploadsDir, key);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, buffer);

  console.log(`💾 [Local Storage] Saved file to ${targetPath}`);
  return {
    key,
    url: `/uploads/${key.replace(/\\/g, '/')}`,
    storage: 'local',
    size: buffer.length,
  };
}

/**
 * Uploads an existing file from disk to Cloudflare R2.
 */
export async function uploadLocalFileToStorage(
  filePath: string,
  key: string,
  contentType = 'application/octet-stream'
): Promise<R2UploadResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  const buffer = fs.readFileSync(filePath);
  return uploadBufferToStorage({ key, buffer, contentType });
}

/**
 * Generates a presigned URL to securely download an R2 object.
 */
export async function getPresignedR2Url(key: string, expiresInSeconds = 3600): Promise<string> {
  if (!isR2Configured()) {
    return `/uploads/${key.replace(/\\/g, '/')}`;
  }

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Downloads an R2 object into a Buffer.
 */
export async function downloadR2Buffer(key: string): Promise<Buffer> {
  if (!isR2Configured()) {
    const localPath = path.resolve(process.cwd(), 'public', 'uploads', key);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`);
    }
    return fs.readFileSync(localPath);
  }

  const client = getR2Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );

  const stream = response.Body as AsyncIterable<Uint8Array>;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Deletes an object from Cloudflare R2.
 */
export async function deleteR2Object(key: string): Promise<boolean> {
  if (!isR2Configured()) {
    const localPath = path.resolve(process.cwd(), 'public', 'uploads', key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      return true;
    }
    return false;
  }

  try {
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}
