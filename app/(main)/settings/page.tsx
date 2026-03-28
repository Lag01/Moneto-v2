'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import LayoutWithNav from '@/app/(main)/layout-with-nav';
import ConfirmModal from '@/components/ConfirmModal';
import { useTheme } from '@/components/ThemeProvider';
import { formatCurrency } from '@/lib/financial';
import { exportAllData, importData } from '@/lib/export-import';
import { formatDate } from '@/lib/financial';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CURRENCIES = [
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar US (USD)' },
  { value: 'GBP', label: 'Livre sterling (GBP)' },
  { value: 'CHF', label: 'Franc suisse (CHF)' },
  { value: 'CAD', label: 'Dollar canadien (CAD)' },
];

const LOCALES = [
  { value: 'fr-FR', label: 'Français (1 234,56)' },
  { value: 'en-US', label: 'Anglais US (1,234.56)' },
  { value: 'de-DE', label: 'Allemand (1.234,56)' },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
};

export default function SettingsPage() {
  const userSettings = useAppStore((state) => state.userSettings);
  const updateUserSettings = useAppStore((state) => state.updateUserSettings);
  const monthlyPlans = useAppStore((state) => state.monthlyPlans);
  const categories = useAppStore((state) => state.categories);
  const user = useAppStore((state) => state.user);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const clearAllData = useAppStore((state) => state.clearAllData);

  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Awaited<ReturnType<typeof importData>>['data'] | null>(null);

  const handleExport = () => {
    exportAllData(monthlyPlans, userSettings, categories);
    toast.success('Données exportées avec succès');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importData(file);
    if (result.success && result.data) {
      setPendingImportData(result.data);
      setShowImportConfirm(true);
    } else {
      toast.error(result.error || 'Erreur d\'importation');
    }

    // Reset input pour permettre de re-sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!pendingImportData) return;

    const store = useAppStore.getState();

    // Appliquer les settings importés
    if (pendingImportData.userSettings) {
      store.updateUserSettings(pendingImportData.userSettings);
    }

    // Remplacer les plans : supprimer les existants puis ajouter les importés
    for (const plan of store.monthlyPlans) {
      store.deleteMonthlyPlan(plan.id);
    }
    for (const plan of pendingImportData.monthlyPlans) {
      useAppStore.setState((state) => ({
        monthlyPlans: [...state.monthlyPlans, plan],
      }));
    }

    setShowImportConfirm(false);
    setPendingImportData(null);
    toast.success('Données importées avec succès');
  };

  const handleDeleteAll = () => {
    clearAllData();
    setShowDeleteConfirm(false);
    toast.success('Toutes les données ont été supprimées');
  };

  return (
    <LayoutWithNav>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Paramètres
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-6 md:mb-8">
            Personnalisez votre expérience Moneto
          </p>

          <div className="space-y-6">
            {/* Section 1 : Préférences financières */}
            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0 }}>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Préférences financières
                </h2>

                <div className="space-y-4">
                  {/* Devise */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Devise
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Devise utilisée pour l&apos;affichage des montants
                      </p>
                    </div>
                    <select
                      value={userSettings.currency}
                      onChange={(e) => updateUserSettings({ currency: e.target.value })}
                      className="px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] text-sm sm:w-56"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Format des nombres */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Format des nombres
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Aperçu : {formatCurrency(1234.56, userSettings.currency, userSettings.locale)}
                      </p>
                    </div>
                    <select
                      value={userSettings.locale}
                      onChange={(e) => updateUserSettings({ locale: e.target.value })}
                      className="px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] text-sm sm:w-56"
                    >
                      {LOCALES.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Jour de début de mois */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Jour de début de mois
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pour les salaires versés en milieu de mois
                      </p>
                    </div>
                    <select
                      value={userSettings.firstDayOfMonth}
                      onChange={(e) => updateUserSettings({ firstDayOfMonth: parseInt(e.target.value) })}
                      className="px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] text-sm sm:w-56"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 2 : Préférences d'affichage */}
            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.1 }}>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Préférences d&apos;affichage
                </h2>

                <div className="space-y-4">
                  {/* Thème */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Thème
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Apparence de l&apos;application
                      </p>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                      {[
                        { value: 'system' as const, label: 'Système' },
                        { value: 'light' as const, label: 'Clair' },
                        { value: 'dark' as const, label: 'Sombre' },
                      ].map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setTheme(t.value)}
                          className={`px-3 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                            theme === t.value
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Graphique par défaut */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Graphique par défaut
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Type de graphique sur la page visualisation
                      </p>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                      {[
                        { value: 'sankey' as const, label: 'Sankey' },
                        { value: 'waterfall' as const, label: 'Waterfall' },
                      ].map((c) => (
                        <button
                          key={c.value}
                          onClick={() => updateUserSettings({ defaultChart: c.value })}
                          className={`px-4 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                            userSettings.defaultChart === c.value
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tri des plans */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tri des plans
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ordre d&apos;affichage sur le dashboard
                      </p>
                    </div>
                    <select
                      value={userSettings.planSortOrder}
                      onChange={(e) => updateUserSettings({ planSortOrder: e.target.value as 'date' | 'name' | 'amount' })}
                      className="px-3 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] text-sm sm:w-56"
                    >
                      <option value="date">Plus récent</option>
                      <option value="name">Alphabétique</option>
                      <option value="amount">Par montant</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 3 : Données et stockage */}
            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.2 }}>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Données et stockage
                </h2>

                <div className="space-y-4">
                  {/* Statut sync */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Synchronisation cloud
                      </span>
                      {user ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          Connecté
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                          Mode local
                        </span>
                      )}
                    </div>
                    {user && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <p>{monthlyPlans.filter((p) => !p.isTutorial).length} plan(s) synchronisé(s)</p>
                        {syncStatus.lastSyncAt && (
                          <p>Dernière sync : {formatDate(syncStatus.lastSyncAt, 'DD/MM/YYYY HH:mm')}</p>
                        )}
                      </div>
                    )}
                    {!user && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Connectez-vous pour synchroniser vos données entre appareils.
                      </p>
                    )}
                  </div>

                  {/* Export / Import */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleExport}
                      className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors min-h-[44px] text-sm"
                    >
                      Exporter les données (JSON)
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors min-h-[44px] text-sm"
                    >
                      Importer des données
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Supprimer */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors min-h-[44px] text-sm w-full sm:w-auto"
                    >
                      Supprimer toutes les données locales
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Cette action est irréversible. Toutes vos données locales seront effacées.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 4 : Notifications */}
            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.3 }}>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Notifications
                </h2>

                <div className="space-y-4">
                  {/* Toggle notifications toast */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Notifications toast
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Afficher les messages de confirmation et d&apos;erreur
                      </p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={userSettings.toastNotificationsEnabled}
                      onClick={() => updateUserSettings({ toastNotificationsEnabled: !userSettings.toastNotificationsEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                        userSettings.toastNotificationsEnabled
                          ? 'bg-emerald-600'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          userSettings.toastNotificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer toutes les données"
        message="Cette action supprimera définitivement toutes vos données locales (plans, paramètres, catégories). Cette action est irréversible."
        confirmLabel="Supprimer tout"
        variant="danger"
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmModal
        isOpen={showImportConfirm}
        title="Importer des données"
        message="L'importation remplacera toutes vos données actuelles (plans et paramètres). Voulez-vous continuer ?"
        confirmLabel="Importer"
        onConfirm={confirmImport}
        onCancel={() => {
          setShowImportConfirm(false);
          setPendingImportData(null);
        }}
      />
    </LayoutWithNav>
  );
}
