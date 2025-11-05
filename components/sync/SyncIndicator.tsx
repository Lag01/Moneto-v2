'use client';

import { useAppStore } from '@/store';

export default function SyncIndicator() {
  const user = useAppStore((state) => state.user);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const syncWithCloud = useAppStore((state) => state.syncWithCloud);

  // Ne pas afficher si l'utilisateur n'est pas connecté
  if (!user) return null;

  const { isSyncing, lastSyncAt, error } = syncStatus;

  const handleSync = () => {
    if (!isSyncing) {
      syncWithCloud();
    }
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return (
        <svg
          className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    if (error) {
      return (
        <svg
          className="w-4 h-4 text-red-600 dark:text-red-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    if (lastSyncAt) {
      return (
        <svg
          className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return (
      <svg
        className="w-4 h-4 text-slate-400 dark:text-slate-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    );
  };

  const getStatusText = () => {
    if (isSyncing) return 'Synchronisation...';
    if (error) return 'Erreur de sync';
    if (lastSyncAt) {
      const now = new Date();
      const lastSync = new Date(lastSyncAt);
      const diffMs = now.getTime() - lastSync.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Il y a ${diffHours}h`;

      const diffDays = Math.floor(diffHours / 24);
      return `Il y a ${diffDays}j`;
    }
    return 'Non synchronisé';
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        transition-all duration-200
        ${
          isSyncing
            ? 'bg-blue-500/20 dark:bg-blue-500/10 cursor-wait'
            : error
            ? 'bg-red-500/20 dark:bg-red-500/10 hover:bg-red-500/30 dark:hover:bg-red-500/20'
            : lastSyncAt
            ? 'bg-emerald-500/20 dark:bg-emerald-500/10 hover:bg-emerald-500/30 dark:hover:bg-emerald-500/20'
            : 'bg-slate-500/20 dark:bg-slate-500/10 hover:bg-slate-500/30 dark:hover:bg-slate-500/20'
        }
        disabled:cursor-not-allowed
      `}
      title={error ? error : 'Cliquez pour synchroniser'}
    >
      {getStatusIcon()}
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {getStatusText()}
      </span>
    </button>
  );
}
