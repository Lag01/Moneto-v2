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

export async function signOut(): Promise<AuthResult> {
  try {
    const { stackClientApp } = await import('@/stack/client');
    await stackClientApp.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erreur déconnexion' };
  }
}

export { useUser, useStackApp } from '@stackframe/stack';
