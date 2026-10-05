export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: 'user' | 'admin';
      plan?: 'free' | 'paid';
    };
  }

  interface UserPublicMetadata {
    role?: 'user' | 'admin';
    plan?: 'free' | 'paid';
    quotaTotal?: number;
    quotaUsed?: number;
  }
}

declare module '@clerk/types' {
  interface UserPublicMetadata {
    role?: 'user' | 'admin';
    plan?: 'free' | 'paid';
    quotaTotal?: number;
    quotaUsed?: number;
  }
}
