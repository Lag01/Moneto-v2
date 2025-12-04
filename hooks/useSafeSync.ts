'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

/**
 * Hook pour déclencher la synchronisation UNIQUEMENT après réhydratation complète.
 *
 * Résout le problème de race condition où syncWithCloud() était appelé
 * avant que IndexedDB ait fini de charger les plans locaux.
 *
 * Ce hook garantit que :
 * 1. L'utilisateur est connecté
 * 2. Le store a fini de charger depuis IndexedDB (_hasHydrated = true)
 * 3. La sync n'est déclenchée qu'une seule fois par session
 */
export function useSafeSync() {
  const user = useAppStore((state) => state.user);
  const _hasHydrated = useAppStore((state) => state._hasHydrated);
  const syncWithCloud = useAppStore((state) => state.syncWithCloud);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Conditions pour synchroniser :
    // 1. Utilisateur connecté
    // 2. Store réhydraté depuis IndexedDB
    // 3. Pas encore synchronisé dans cette session
    if (user && _hasHydrated && !hasSyncedRef.current) {
      console.log('[SafeSync] Déclenchement sync après réhydratation complète');
      hasSyncedRef.current = true;
      syncWithCloud();
    }
  }, [user, _hasHydrated, syncWithCloud]);
}
