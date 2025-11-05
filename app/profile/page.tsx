'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppStore } from '@/store';
import LayoutWithNav from '@/app/layout-with-nav';
import SyncIndicator from '@/components/sync/SyncIndicator';
import { formatDate } from '@/lib/financial';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const monthlyPlans = useAppStore((state) => state.monthlyPlans);
  const dataMigrationStatus = useAppStore((state) => state.dataMigrationStatus);
  const logout = useAppStore((state) => state.logout);

  // Rediriger vers login si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
      router.push('/');
    }
  };

  if (!user) {
    return null; // Ou un loader
  }

  const getSyncStatusBadge = () => {
    if (syncStatus.isSyncing) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          En cours...
        </span>
      );
    }

    if (syncStatus.error) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Erreur
        </span>
      );
    }

    if (syncStatus.lastSyncAt) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Synchronisé
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-full">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Non synchronisé
      </span>
    );
  };

  return (
    <LayoutWithNav>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Mon profil
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-6 md:mb-8">
            Gérez votre compte et vos paramètres de synchronisation
          </p>

          {/* Informations utilisateur */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Informations du compte
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium text-slate-800 dark:text-slate-100">
                  {user.email}
                </p>
                {user.isPremium && (
                  <span className="inline-block mt-1 px-3 py-1 text-sm font-medium bg-emerald-600 text-white rounded-full">
                    Premium
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Se déconnecter
              </button>
            </div>
          </div>

          {/* État de synchronisation */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Synchronisation cloud
              </h2>
              {getSyncStatusBadge()}
            </div>

            <div className="space-y-4">
              {/* Dernière synchronisation */}
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Dernière synchronisation
                </span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {syncStatus.lastSyncAt
                    ? formatDate(syncStatus.lastSyncAt, 'DD/MM/YYYY HH:mm')
                    : 'Jamais'}
                </span>
              </div>

              {/* Nombre de plans */}
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Plans sur cet appareil
                </span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {monthlyPlans.length}
                </span>
              </div>

              {/* Plans migrés */}
              {dataMigrationStatus.hasBeenCompleted && (
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Plans migrés vers le cloud
                  </span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {dataMigrationStatus.migratedPlansCount}
                  </span>
                </div>
              )}

              {/* Erreur de sync */}
              {syncStatus.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                    Erreur de synchronisation
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {syncStatus.error}
                  </p>
                </div>
              )}

              {/* Indicateur de synchronisation */}
              <div className="pt-4">
                <SyncIndicator />
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  À propos de la synchronisation
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Vos données sont automatiquement synchronisées avec le cloud après chaque modification.
                  Vous pouvez également forcer une synchronisation manuelle à tout moment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithNav>
  );
}
