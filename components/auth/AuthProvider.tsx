'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@stackframe/stack';
import { useAppStore } from '@/store';

/**
 * AuthProvider - Initialise l'authentification et charge les plans depuis le cloud
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const stackUser = useUser();
  const setUser = useAppStore((state) => state.setUser);
  const loadPlansFromCloud = useAppStore((state) => state.loadPlansFromCloud);
  const hasLoadedRef = useRef(false);

  // Synchroniser Stack Auth user avec Zustand store
  useEffect(() => {
    if (stackUser) {
      const appUser = {
        id: stackUser.id,
        email: stackUser.primaryEmail || '',
        isPremium: true,
        isAuthenticated: true,
      };
      setUser(appUser);
    } else {
      setUser(null);
    }
  }, [stackUser, setUser]);

  // Charger les plans depuis le cloud au login (une seule fois)
  useEffect(() => {
    if (stackUser && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPlansFromCloud().catch((error) => {
        console.error('Erreur chargement plans:', error);
        if (typeof window !== 'undefined') {
          import('@/lib/toast-notifications').then(({ toastNotifications }) => {
            toastNotifications.syncError('Erreur lors du chargement de vos plans');
          });
        }
      });
    }

    // Reset si l'utilisateur se déconnecte
    if (!stackUser) {
      hasLoadedRef.current = false;
    }
  }, [stackUser, loadPlansFromCloud]);

  return <>{children}</>;
}
