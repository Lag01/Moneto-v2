'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppStore } from '@/store';
import LayoutWithNav from '@/app/(main)/layout-with-nav';
import SyncIndicator from '@/components/sync/SyncIndicator';
import { formatDate } from '@/lib/financial';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const monthlyPlans = useAppStore((state) => state.monthlyPlans);
  const logout = useAppStore((state) => state.logout);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
      router.push('/auth/login');
    }
  };

  if (!user) {
    return null;
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
        Non synchronisé
      </span>
    );
  };

  const nonTutorialPlans = monthlyPlans.filter((p) => !p.isTutorial);

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
                <span className="inline-block mt-1 px-3 py-1 text-sm font-medium bg-emerald-600 text-white rounded-full">
                  Premium
                </span>
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

              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Mes plans
                </span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {nonTutorialPlans.length}/25
                </span>
              </div>

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

              <div className="pt-4">
                <SyncIndicator />
              </div>
            </div>
          </div>

        </div>
      </div>
    </LayoutWithNav>
  );
}
