import type { StackClientUser } from '@stackframe/stack';

export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  isAuthenticated: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

function toAppUser(stackUser: StackClientUser): User {
  return {
    id: stackUser.id,
    email: stackUser.primaryEmail || '',
    isPremium: true,
    isAuthenticated: true,
  };
}

// Version client-only (sans STACK_SECRET_SERVER_KEY)
export async function getCurrentUser(): Promise<User | null> {
  // Cette fonction sera remplacée par useUser() hook côté client
  // Elle n'est plus nécessaire en mode client-only
  return null;
}

export async function signOut(): Promise<AuthResult> {
  return { success: true };
}

export { useUser, useStackApp } from '@stackframe/stack';
