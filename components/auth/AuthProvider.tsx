'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import { useAppStore } from '@/store';
import LocalDataMigrationModal from './LocalDataMigrationModal';

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
  const dataMigrationStatus = useAppStore((state) => state.dataMigrationStatus);
  const setDataMigrationStatus = useAppStore((state) => state.setDataMigrationStatus);

  const [showMigrationModal, setShowMigrationModal] = useState(false);

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

  const handleCloseMigrationModal = () => {
    setShowMigrationModal(false);
  };

  return (
    <>
      {children}
      <LocalDataMigrationModal
        isOpen={showMigrationModal}
        localPlansCount={monthlyPlans.length}
        onClose={handleCloseMigrationModal}
      />
    </>
  );
}
