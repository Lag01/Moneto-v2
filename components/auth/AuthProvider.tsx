'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import { useAppStore } from '@/store';
import { useSafeSync } from '@/hooks/useSafeSync';
import LocalDataMigrationModal from './LocalDataMigrationModal';
import SyncChoiceModal from '@/components/sync/SyncChoiceModal';
import { downloadPlansFromCloud } from '@/lib/neon/sync';

/**
 * AuthProvider - Initialise l'authentification au chargement de l'application
 *
 * Ce composant :
 * 1. Récupère l'utilisateur actuel depuis Stack Auth via useUser()
 * 2. Met à jour le store Zustand automatiquement
 * 3. Délègue la sync initiale à useSafeSync() (attend réhydratation)
 * 4. Détecte les données locales à migrer et propose la synchronisation
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const stackUser = useUser();
  const setUser = useAppStore((state) => state.setUser);
  const user = useAppStore((state) => state.user);
  const monthlyPlans = useAppStore((state) => state.monthlyPlans);
  const _hasHydrated = useAppStore((state) => state._hasHydrated);
  const dataMigrationStatus = useAppStore((state) => state.dataMigrationStatus);
  const setDataMigrationStatus = useAppStore((state) => state.setDataMigrationStatus);

  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [cloudPlansCount, setCloudPlansCount] = useState(0);

  // Hook de synchronisation sécurisée (attend la réhydratation complète)
  // C'est le SEUL point d'entrée pour la sync initiale au login
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
    } else {
      setUser(null);
    }
  }, [stackUser, setUser]);

  // Proposer la migration de données locales vers le cloud
  // Attend _hasHydrated pour éviter le faux positif monthlyPlans.length === 0
  useEffect(() => {
    if (!user || !_hasHydrated) return;

    if (dataMigrationStatus.hasBeenCompleted) return;

    if (monthlyPlans.length === 0) return;

    // Vérifier si l'utilisateur a refusé récemment (moins de 7 jours)
    if (dataMigrationStatus.wasDeclined && dataMigrationStatus.lastProposedAt) {
      const lastProposed = new Date(dataMigrationStatus.lastProposedAt);
      const now = new Date();
      const daysSinceLastProposal = (now.getTime() - lastProposed.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastProposal < 7) return;
    }

    // Vérifier si on a déjà proposé dans cette session
    if (dataMigrationStatus.hasBeenProposed && !dataMigrationStatus.wasDeclined) return;

    // Toutes les conditions sont remplies, afficher la modal
    setShowMigrationModal(true);
    setDataMigrationStatus({
      hasBeenProposed: true,
      lastProposedAt: new Date(),
    });
  }, [user, _hasHydrated, monthlyPlans.length, dataMigrationStatus, setDataMigrationStatus]);

  // Vérifier les plans cloud après sync initiale pour proposer le SyncChoiceModal
  // S'exécute UNE SEULE FOIS quand user + hydrated sont prêts
  useEffect(() => {
    if (!user || !_hasHydrated) return;

    const fetchCloudPlansCount = async () => {
      try {
        const result = await downloadPlansFromCloud(user.id);

        if (!result.success || !result.plans || result.plans.length === 0) return;

        setCloudPlansCount(result.plans.length);

        // Ne montrer la modal que s'il y a aussi des plans locaux (sinon useSafeSync gère)
        const localPlansCount = useAppStore.getState().monthlyPlans.filter(p => !p.isTutorial).length;
        if (localPlansCount > 0) {
          setShowSyncModal(true);
        }
      } catch {
        // Silencieux - la sync principale via useSafeSync gère les erreurs
      }
    };

    fetchCloudPlansCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, _hasHydrated]);

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
