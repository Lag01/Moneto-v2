'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';

export interface SyncChoiceModalProps {
  isOpen: boolean;
  localPlansCount: number;
  cloudPlansCount: number;
  onClose: () => void;
}

export default function SyncChoiceModal({
  isOpen,
  localPlansCount,
  cloudPlansCount,
  onClose,
}: SyncChoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'smart' | 'cloud' | 'local' | null>(null);
  const { syncWithCloud, importLocalDataToCloud } = useAppStore();

  if (!isOpen) return null;

  const handleSmartSync = async () => {
    setIsLoading(true);
    setSelectedOption('smart');
    try {
      await syncWithCloud();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la synchronisation intelligente:', error);
    } finally {
      setIsLoading(false);
      setSelectedOption(null);
    }
  };

  const handleImportCloud = async () => {
    setIsLoading(true);
    setSelectedOption('cloud');
    try {
      await syncWithCloud();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'import cloud:', error);
    } finally {
      setIsLoading(false);
      setSelectedOption(null);
    }
  };

  const handleUploadLocal = async () => {
    setIsLoading(true);
    setSelectedOption('local');
    try {
      await importLocalDataToCloud();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'upload local:', error);
    } finally {
      setIsLoading(false);
      setSelectedOption(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Synchronisation des données
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Vous avez <strong>{localPlansCount} plans locaux</strong> et{' '}
            <strong>{cloudPlansCount} plans dans le cloud</strong>. Comment souhaitez-vous
            synchroniser vos données ?
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Option 1 : Sync intelligente (recommandé) */}
          <button
            onClick={handleSmartSync}
            disabled={isLoading}
            className={`w-full p-6 rounded-lg border-2 text-left transition-all ${
              selectedOption === 'smart'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Synchronisation intelligente
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                    Recommandé
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Fusionne automatiquement vos plans locaux et cloud. Les conflits sont résolus en
                  gardant la version la plus récente (last-write-wins).
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-500 mt-3 space-y-1">
                  <li>✓ Conserve tous les plans (locaux + cloud)</li>
                  <li>✓ Résolution automatique des conflits</li>
                  <li>✓ Aucune perte de données</li>
                </ul>
              </div>
            </div>
          </button>

          {/* Option 2 : Import depuis le cloud */}
          <button
            onClick={handleImportCloud}
            disabled={isLoading}
            className={`w-full p-6 rounded-lg border-2 text-left transition-all ${
              selectedOption === 'cloud'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Télécharger depuis le cloud
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Identique à la synchronisation intelligente. Récupère vos plans cloud et fusionne
                  avec les plans locaux.
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-500 mt-3 space-y-1">
                  <li>✓ Même comportement que l'option recommandée</li>
                  <li>✓ Fusion automatique</li>
                </ul>
              </div>
            </div>
          </button>

          {/* Option 3 : Upload vers le cloud */}
          <button
            onClick={handleUploadLocal}
            disabled={isLoading}
            className={`w-full p-6 rounded-lg border-2 text-left transition-all ${
              selectedOption === 'local'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Envoyer mes données locales
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Upload tous vos plans locaux vers le cloud. Utile pour la première
                  synchronisation ou après une réinstallation.
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-500 mt-3 space-y-1">
                  <li>✓ Upload de tous les plans locaux</li>
                  <li>✓ Idéal pour la première connexion</li>
                </ul>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {isLoading && selectedOption && (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Synchronisation en cours...
              </span>
            )}
          </p>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
