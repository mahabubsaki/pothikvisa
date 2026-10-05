import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'pothikvisa-documents';

let s3ClientInstance: S3Client | null = null;
const LOCAL_STORAGE_ROOT = path.resolve(
  process.env.POTHIKVISA_STORAGE_ROOT?.trim() || path.join(process.cwd(), 'data', 'uploads')
);

function normalizeStorageKey(key: string): string {
  const normalized = key.replace(/\\/g, '/').trim();
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.split('/').includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9/_.-]*$/.test(normalized)
  ) {
    throw new Error('INVALID_STORAGE_KEY');
  }
  return normalized;
}

function getLocalStoragePath(key: string): string {
  const target = path.resolve(LOCAL_STORAGE_ROOT, normalizeStorageKey(key));
  if (!target.startsWith(`${LOCAL_STORAGE_ROOT}${path.sep}`)) {
    throw new Error('INVALID_STORAGE_KEY');
  }
  return target;
}

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
  const { buffer, contentType } = params;
  const key = normalizeStorageKey(params.key);

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

      console.log(`☁️ [R2] Uploaded object: ${key} (${buffer.length} bytes)`);
      return {
        key,
        url: `storage:${key}`,
        storage: 'r2',
        size: buffer.length,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ [R2] Failed to upload to Cloudflare R2, falling back to local storage:`, errMsg);
    }
  }

  // 2. Local disk fallback
  const targetPath = getLocalStoragePath(key);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, buffer);

  console.log(`💾 [Local Storage] Saved file to ${targetPath}`);
  return {
    key,
    url: `storage:${key}`,
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
  const safeKey = normalizeStorageKey(key);
  if (!isR2Configured()) {
    return `storage:${safeKey}`;
  }

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: safeKey,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Downloads an R2 object into a Buffer.
 */
export async function downloadR2Buffer(key: string): Promise<Buffer> {
  const safeKey = normalizeStorageKey(key);
  const localPath = getLocalStoragePath(safeKey);
  if (!isR2Configured()) {
    if (!fs.existsSync(localPath)) throw new Error(`Local file not found: ${localPath}`);
    return fs.readFileSync(localPath);
  }

  try {
    const client = getR2Client();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: safeKey,
      })
    );
    const stream = response.Body as AsyncIterable<Uint8Array>;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  } catch (error) {
    // Files written during an R2 outage live on local disk. Keep them readable
    // after R2 recovers instead of treating one backend as the only source.
    if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
    throw error;
  }
}

/**
 * Deletes an object from Cloudflare R2.
 */
export async function deleteR2Object(key: string): Promise<boolean> {
  const safeKey = normalizeStorageKey(key);
  const localPath = getLocalStoragePath(safeKey);
  if (!isR2Configured()) {
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      return true;
    }
    return false;
  }

  let deleted = false;
  try {
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: safeKey,
      })
    );
    deleted = true;
  } catch {
    // A local fallback copy may still exist even if the R2 delete failed.
  }
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
    deleted = true;
  }
  return deleted;
}
