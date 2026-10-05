export type AccountStatus = 'pending' | 'approved' | 'suspended';
export type AccessTier = 'free' | 'paid';

export type Permission =
  | 'dashboard.view'
  | 'profiles.read'
  | 'profiles.write'
  | 'applications.read'
  | 'applications.write'
  | 'applications.run'
  | 'applications.batch'
  | 'passport.extract'
  | 'ai.extract'
  | 'pdf.preview'
  | 'captcha.solve';

export interface TierPolicy {
  label: string;
  priceBdt: number;
  durationDays: number | null;
  quotaLimit: number | null;
  quotaPeriod: 'day' | null;
  maxProfiles: number;
  permissions: readonly Permission[];
}

const FREE_PERMISSIONS: readonly Permission[] = [
  'dashboard.view',
  'profiles.read',
  'profiles.write',
  'applications.read',
  'applications.write',
  'applications.run',
  'captcha.solve',
];

const PAID_PERMISSIONS: readonly Permission[] = [
  ...FREE_PERMISSIONS,
  'applications.batch',
  'passport.extract',
  'ai.extract',
  'pdf.preview',
];

export const ACCESS_POLICY: Readonly<Record<AccessTier, TierPolicy>> = {
  free: {
    label: 'Free',
    priceBdt: 0,
    durationDays: null,
    quotaLimit: 3,
    quotaPeriod: 'day',
    maxProfiles: 1,
    permissions: FREE_PERMISSIONS,
  },
  paid: {
    label: 'Paid',
    priceBdt: 500,
    durationDays: 30,
    quotaLimit: null,
    quotaPeriod: null,
    maxProfiles: 50,
    permissions: PAID_PERMISSIONS,
  },
};

export function hasTierPermission(tier: AccessTier, permission: Permission): boolean {
  return ACCESS_POLICY[tier].permissions.includes(permission);
}
