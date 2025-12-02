import { stackServerApp } from '@/stack/server';
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

export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return null;
    return toAppUser(user);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return null;
  }
}

export async function signOut(): Promise<AuthResult> {
  return { success: true };
}

export { useUser, useStackApp } from '@stackframe/stack';
