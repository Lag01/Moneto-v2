'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import { useAppStore } from '@/store';
import { useSafeSync } from '@/hooks/useSafeSync';
import LocalDataMigrationModal from './LocalDataMigrationModal';
import SyncChoiceModal from '@/components/sync/SyncChoiceModal';
import { downloadPlansFromCloud } from '@/lib/neon/sync';
import { notifySyncDebug } from '@/lib/toast-notifications';

/**
 * AuthProvider - Initialise l'authentification au chargement de l'application
 *
 * Ce composant :
 * 1. Récupère l'utilisateur actuel depuis Stack Auth au chargement
 * 2. Écoute les changements de session (login, logout) via useUser hook
 * 3. Met à jour le store Zustand automatiquement
 * 4. Détecte les données locales à migrer et propose la synchronisation
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const stackUser = useUser();
  const setUser = useAppStore((state) => state.setUser);
  const user = useAppStore((state) => state.user);
  const monthlyPlans = useAppStore((state) => state.monthlyPlans);
  const syncWithCloud = useAppStore((state) => state.syncWithCloud);
  const dataMigrationStatus = useAppStore((state) => state.dataMigrationStatus);
  const setDataMigrationStatus = useAppStore((state) => state.setDataMigrationStatus);

  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [cloudPlansCount, setCloudPlansCount] = useState(0);
  const [hasAttemptedAutoDownload, setHasAttemptedAutoDownload] = useState(false);

  // Hook de synchronisation sécurisée (attend la réhydratation complète)
  useSafeSync();

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
      // La synchronisation est maintenant gérée par useSafeSync()
      // qui attend la fin de la réhydratation IndexedDB
    } else {
      setUser(null);
    }
  }, [stackUser, setUser]);

  useEffect(() => {
    // Vérifier si on doit proposer la migration
    if (!user) {
      // Pas d'utilisateur connecté, pas de migration
      return;
    }

    if (dataMigrationStatus.hasBeenCompleted) {
      // Migration déjà effectuée
      return;
    }

    if (monthlyPlans.length === 0) {
      // Pas de plans locaux à migrer
      return;
    }

    // Vérifier si l'utilisateur a refusé récemment (moins de 7 jours)
    if (dataMigrationStatus.wasDeclined && dataMigrationStatus.lastProposedAt) {
      const lastProposed = new Date(dataMigrationStatus.lastProposedAt);
      const now = new Date();
      const daysSinceLastProposal = (now.getTime() - lastProposed.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastProposal < 7) {
        // Refusé il y a moins de 7 jours, ne pas redemander
        return;
      }
    }

    // Vérifier si on a déjà proposé dans cette session
    if (dataMigrationStatus.hasBeenProposed && !dataMigrationStatus.wasDeclined) {
      // Déjà proposé dans cette session, mais pas refusé
      return;
    }

    // Toutes les conditions sont remplies, afficher la modal
    setShowMigrationModal(true);
    setDataMigrationStatus({
      hasBeenProposed: true,
      lastProposedAt: new Date(),
    });
  }, [user, monthlyPlans.length, dataMigrationStatus, setDataMigrationStatus]);

  // Afficher la modal de choix de synchronisation à chaque login
  useEffect(() => {
    if (!user) {
      // Pas d'utilisateur connecté, pas de modal
      return;
    }

    // Compter les plans cloud à chaque login
    const fetchCloudPlansCount = async () => {
      try {
        console.log('[AuthProvider] user.id:', user.id);
        notifySyncDebug.fetchingCloudPlans();

        const result = await downloadPlansFromCloud(user.id);

        console.log('[AuthProvider] résultat:', {
          success: result.success,
          plansCount: result.plans?.length ?? 0,
          error: result.error,
        });

        if (!result.success) {
          const errorMsg =
            typeof result.error === 'string'
              ? result.error
              : result.error?.message || 'Erreur inconnue';
          notifySyncDebug.fetchError(errorMsg);
          return;
        }

        if (result.plans && result.plans.length > 0) {
          setCloudPlansCount(result.plans.length);
          notifySyncDebug.cloudPlansFound(result.plans.length);

          // 🎯 NOUVEAU : Auto-download si aucun plan local
          const localPlansCount = useAppStore.getState().monthlyPlans.length;

          if (localPlansCount === 0 && !hasAttemptedAutoDownload) {
            console.log('[AuthProvider] Auto-download: 0 plans locaux, chargement auto');
            setHasAttemptedAutoDownload(true);

            // Charger directement sans modal
            notifySyncDebug.syncStarting();
            syncWithCloud()
              .then(() => {
                const count = useAppStore.getState().monthlyPlans.length;
                notifySyncDebug.syncCompleted(count);
              })
              .catch((error) => {
                const msg = error instanceof Error ? error.message : String(error);
                notifySyncDebug.syncFailed(msg);
              });
          } else {
            // Comportement normal : afficher la modal
            setShowSyncModal(true);
          }
        } else {
          notifySyncDebug.noCloudPlans();
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[AuthProvider] exception:', msg, error);
        notifySyncDebug.fetchError(msg);
      }
    };

    fetchCloudPlansCount();
  }, [user, hasAttemptedAutoDownload, syncWithCloud]);

  const handleCloseMigrationModal = () => {
    setShowMigrationModal(false);
  };

  const handleCloseSyncModal = () => {
    setShowSyncModal(false);
  };

  // Filtrer les plans tutoriels pour le comptage
  const nonTutorialPlans = monthlyPlans.filter((p) => !p.isTutorial);

  return (
    <>
      {children}
      <LocalDataMigrationModal
        isOpen={showMigrationModal}
        localPlansCount={monthlyPlans.length}
        onClose={handleCloseMigrationModal}
      />
      <SyncChoiceModal
        isOpen={showSyncModal}
        localPlansCount={nonTutorialPlans.length}
        cloudPlansCount={cloudPlansCount}
        onClose={handleCloseSyncModal}
      />
    </>
  );
}
