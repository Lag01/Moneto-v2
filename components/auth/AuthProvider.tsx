'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

/**
 * AuthProvider - Vérifie la session JWT et charge les plans depuis le cloud
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore((state) => state.setUser);
  const loadPlansFromCloud = useAppStore((state) => state.loadPlansFromCloud);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        let res = await fetch('/api/auth/me');

        // Si le token est expiré, tenter un refresh automatique
        if (res.status === 401) {
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
          if (refreshRes.ok) {
            res = await fetch('/api/auth/me');
          }
        }

        if (!res.ok) {
          setUser(null);
          hasLoadedRef.current = false;
          return;
        }

        const data = await res.json();
        if (data.success && data.user && !cancelled) {
          setUser(data.user);

          if (!hasLoadedRef.current) {
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
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [setUser, loadPlansFromCloud]);

  return <>{children}</>;
}
