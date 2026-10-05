const MB = 1024 * 1024;

const LIMITS = {
  free: { photo: 1 * MB, passport: 500 * 1024 },
  paid: { photo: 20 * MB, passport: 10 * MB },
} as const;

export function validateMediaUpload(
  file: File | null,
  kind: 'photo' | 'passport',
  hasPaidLimits: boolean
): string | null {
  if (!file || file.size === 0) return null;
  const tier = hasPaidLimits ? 'paid' : 'free';
  if (file.size > LIMITS[tier][kind]) {
    return `${kind === 'photo' ? 'Photo' : 'Passport document'} exceeds the ${hasPaidLimits ? 'Paid' : 'Free'} upload limit.`;
  }
  const validType = kind === 'photo'
    ? ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    : file.type === 'application/pdf';
  return validType ? null : `Unsupported ${kind} file type.`;
}
