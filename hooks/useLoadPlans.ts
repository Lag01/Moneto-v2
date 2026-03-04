'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

/**
 * Hook pour charger les plans depuis le cloud une fois au login.
 */
export function useLoadPlans() {
  const user = useAppStore((state) => state.user);
  const loadPlansFromCloud = useAppStore((state) => state.loadPlansFromCloud);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPlansFromCloud().catch(() => {});
    }

    if (!user) {
      hasLoadedRef.current = false;
    }
  }, [user, loadPlansFromCloud]);
}
