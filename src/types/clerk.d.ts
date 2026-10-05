export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: 'user' | 'admin';
      plan?: 'free' | 'starter' | 'standard' | 'agency';
    };
  }

  interface UserPublicMetadata {
    role?: 'user' | 'admin';
    plan?: 'free' | 'starter' | 'standard' | 'agency';
    quotaTotal?: number;
    quotaUsed?: number;
  }
}

declare module '@clerk/types' {
  interface UserPublicMetadata {
    role?: 'user' | 'admin';
    plan?: 'free' | 'starter' | 'standard' | 'agency';
    quotaTotal?: number;
    quotaUsed?: number;
  }
}
