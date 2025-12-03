'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import LayoutWithNav from '@/app/(main)/layout-with-nav';
import { formatDate } from '@/lib/financial';
import { formatCurrency } from '@/lib/financial';
import { getPlanSummary } from '@/lib/monthly-plan';
import {
  exportMonthlyPlanToJSON,
  exportAllPlansToJSON,
  importMonthlyPlanFromJSON,
} from '@/lib/export-import';
import { useTutorialContext } from '@/context/TutorialContext';
import { useTutorial } from '@/hooks/useTutorial';
import TutorialWelcomeModal from '@/components/tutorial/TutorialWelcomeModal';
import TutorialDisclaimerModal from '@/components/tutorial/TutorialDisclaimerModal';
import LocalDataMigrationModal from '@/components/auth/LocalDataMigrationModal';

export default function DashboardPage() {
  const router = useRouter();
  const {
    monthlyPlans,
    addMonthlyPlan,
    setCurrentMonth,
    deleteMonthlyPlan,
    importMonthlyPlanFromData,
    userSettings,
    updateUserSettings,
    user,
    dataMigrationStatus,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showBetaWarning, setShowBetaWarning] = useState(true);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showMigrationBanner, setShowMigrationBanner] = useState(true);

  // Tutoriel
  const { showWelcomeModal, showDisclaimerModal, setShowWelcomeModal, startTutorial, startTutorialAfterDisclaimer } = useTutorialContext();
  const { initializeTutorial } = useTutorial();

  // Afficher la modal de bienvenue si l'utilisateur n'a jamais vu le tutoriel et n'a aucun plan
  useEffect(() => {
    if (!userSettings.hasSeenTutorial && monthlyPlans.length === 0) {
      setShowWelcomeModal(true);
    }
  }, [userSettings.hasSeenTutorial, monthlyPlans.length, setShowWelcomeModal]);

  // Vérifier si le bandeau de beta a été fermé
  useEffect(() => {
    const dismissed = localStorage.getItem('betaWarningDismissed');
    if (dismissed === 'true') {
      setShowBetaWarning(false);
    }
  }, []);

  const handleDismissBetaWarning = () => {
    localStorage.setItem('betaWarningDismissed', 'true');
    setShowBetaWarning(false);
  };

  const handleDismissMigrationBanner = () => {
    setShowMigrationBanner(false);
  };

  const handleOpenMigrationModal = () => {
    setShowMigrationModal(true);
  };

  const handleCloseMigrationModal = () => {
    setShowMigrationModal(false);
  };

  // Vérifier si on doit afficher le banner de migration
  const shouldShowMigrationBanner =
    showMigrationBanner &&
    user &&
    monthlyPlans.length > 0 &&
    !dataMigrationStatus.hasBeenCompleted;

  // Vérifier si on doit afficher le call-to-action pour se connecter
  const shouldShowLoginCTA =
    !user &&
    monthlyPlans.length > 0;

  const handleAcceptTutorial = () => {
    initializeTutorial();
    startTutorial();
  };

  const handleDeclineTutorial = () => {
    updateUserSettings({ hasSeenTutorial: true });
    setShowWelcomeModal(false);
  };

  const handleContinueFromDisclaimer = () => {
    startTutorialAfterDisclaimer();
  };

  const handleCreateNew = () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    addMonthlyPlan(month);
    router.push('/onboarding');
  };

  const handleSelectPlan = (planId: string) => {
    setCurrentMonth(planId);
    router.push('/onboarding');
  };

  const handleViewPlan = (planId: string) => {
    setCurrentMonth(planId);
    router.push('/visualisation');
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      deleteMonthlyPlan(planId);
    }
  };

  const handleExportPlan = (planId: string) => {
    const plan = monthlyPlans.find((p) => p.id === planId);
    if (plan) {
      exportMonthlyPlanToJSON(plan);
    }
  };

  const handleExportAll = () => {
    if (monthlyPlans.length === 0) {
      alert('Aucun plan à exporter');
      return;
    }
    exportAllPlansToJSON(monthlyPlans);
  };

  const handleImportClick = () => {
    setImportError(null);
    setImportSuccess(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    try {
      const result = await importMonthlyPlanFromJSON(file);

      if (result.success && result.plan) {
        // Vérifier si un plan existe déjà pour ce mois
        const existingPlan = monthlyPlans.find((p) => p.month === result.plan!.month);
        if (existingPlan) {
          const confirm = window.confirm(
            `Un plan existe déjà pour ${result.plan.month}. Voulez-vous importer quand même ?`
          );
          if (!confirm) {
            return;
          }
        }

        // Importer le plan
        const newPlanId = importMonthlyPlanFromData(result.plan);
        setImportSuccess(`Plan ${result.plan.month} importé avec succès !`);

        // Réinitialiser l'input file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Rediriger après un court délai
        setTimeout(() => {
          setCurrentMonth(newPlanId);
          router.push('/onboarding');
        }, 1500);
      } else {
        setImportError(
          `Erreurs d'import : ${result.errors.join(', ')}`
        );
      }
    } catch (error) {
      setImportError('Erreur inattendue lors de l\'import');
      console.error('Import error:', error);
    }

    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sortedPlans = [...monthlyPlans].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <LayoutWithNav>
      {/* Modal de bienvenue du tutoriel */}
      <TutorialWelcomeModal
        isOpen={showWelcomeModal}
        onAccept={handleAcceptTutorial}
        onDecline={handleDeclineTutorial}
      />

      {/* Modal de disclaimer du tutoriel */}
      <TutorialDisclaimerModal
        isOpen={showDisclaimerModal}
        onContinue={handleContinueFromDisclaimer}
      />

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-6 md:mb-8">
            Gérez vos plans mensuels et consultez votre historique financier
          </p>

          {/* Bandeau d'avertissement beta */}
          {showBetaWarning && (
            <div className="mb-4 md:mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 md:p-5 rounded-r-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm md:text-base font-bold text-red-800 dark:text-red-300 mb-2">
                    Application en phase de test
                  </h3>
                  <p className="text-xs md:text-sm text-red-700 dark:text-red-300 leading-relaxed">
                    L&apos;application est pour le moment en phase de test et subit souvent des mises à jour. Il se peut alors que vos données soient supprimées la prochaine fois que vous vous connecterez. Nous vous conseillons alors d&apos;exporter vos données afin de les réimporter plus tard si besoin.
                  </p>
                </div>
                <button
                  onClick={handleDismissBetaWarning}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Fermer"
                >
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Bandeau de migration des données */}
          {shouldShowMigrationBanner && (
            <div className="mb-4 md:mb-6 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 md:p-5 rounded-r-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5"
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
                <div className="flex-1">
                  <h3 className="text-sm md:text-base font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                    Synchronisez vos données avec le cloud
                  </h3>
                  <p className="text-xs md:text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed mb-3">
                    Vous avez {monthlyPlans.length} {monthlyPlans.length > 1 ? 'plans' : 'plan'} sur cet appareil. Sauvegardez-les dans le cloud pour y accéder depuis tous vos appareils et ne jamais les perdre.
                  </p>
                  <button
                    onClick={handleOpenMigrationModal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Synchroniser mes données
                  </button>
                </div>
                <button
                  onClick={handleDismissMigrationBanner}
                  className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Fermer"
                >
                  <svg
                    className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Call-to-action pour se connecter (utilisateurs non connectés avec plans locaux) */}
          {shouldShowLoginCTA && (
            <div className="mb-4 md:mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 md:p-5 rounded-r-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm md:text-base font-bold text-blue-800 dark:text-blue-300 mb-2">
                    Sauvegardez vos données dans le cloud
                  </h3>
                  <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 leading-relaxed mb-3">
                    Vous avez {monthlyPlans.length} {monthlyPlans.length > 1 ? 'plans' : 'plan'} sur cet appareil.
                    Créez un compte pour sauvegarder vos données dans le cloud et y accéder depuis tous vos appareils.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Se connecter pour sauvegarder
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Messages d'erreur/succès import */}
          {importError && (
            <div className="mb-4 md:mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 md:p-4 rounded-r-lg">
              <div className="flex items-start md:items-center gap-2 md:gap-3">
                <svg
                  className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5 md:mt-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs md:text-sm font-medium text-red-800 dark:text-red-300">{importError}</p>
              </div>
            </div>
          )}

          {importSuccess && (
            <div className="mb-4 md:mb-6 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-3 md:p-4 rounded-r-lg">
              <div className="flex items-start md:items-center gap-2 md:gap-3">
                <svg
                  className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5 md:mt-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs md:text-sm font-medium text-emerald-800 dark:text-emerald-300">{importSuccess}</p>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
            <button
              onClick={handleCreateNew}
              className="px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Créer un nouveau plan
            </button>

            {monthlyPlans.length > 0 && (
              <button
                onClick={handleExportAll}
                className="px-4 md:px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden sm:inline">Exporter tous</span>
                <span className="sm:hidden">Exporter</span>
              </button>
            )}

            <button
              onClick={handleImportClick}
              className="px-4 md:px-6 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Importer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

          </div>

          {/* Liste des plans */}
          {monthlyPlans.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 md:p-12 text-center">
              <svg
                className="w-12 h-12 md:w-16 md:h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-2">
                Aucun plan mensuel créé pour le moment
              </p>
              <p className="text-sm md:text-base text-slate-400 dark:text-slate-500 mb-6">
                Créez votre premier plan pour commencer à gérer vos finances
              </p>
              <button
                onClick={handleCreateNew}
                className="px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Créer mon premier plan
              </button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Plans mensuels ({monthlyPlans.length})
              </h2>

              {sortedPlans.map((plan) => {
                const summary = getPlanSummary(plan);
                const monthDate = new Date(plan.month + '-01');
                const monthLabel = monthDate.toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 capitalize mb-2">
                          {monthLabel}
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-3 md:mt-4">
                          <div>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Revenus</p>
                            <p className="text-base md:text-lg font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(summary.totalIncome)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Dépenses fixes</p>
                            <p className="text-base md:text-lg font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(summary.totalFixedExpenses)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Disponible</p>
                            <p className="text-base md:text-lg font-semibold text-blue-600 dark:text-blue-400">
                              {formatCurrency(summary.availableAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Solde final</p>
                            <p
                              className={`text-base md:text-lg font-semibold ${
                                summary.finalBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {formatCurrency(summary.finalBalance)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 mt-3">
                          Dernière modification :{' '}
                          {formatDate(plan.updatedAt, 'DD/MM/YYYY HH:mm')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-col gap-2 lg:ml-4">
                        <button
                          onClick={() => handleSelectPlan(plan.id)}
                          className="px-3 md:px-4 py-2 md:py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs md:text-sm font-medium min-h-[44px] flex items-center justify-center"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleViewPlan(plan.id)}
                          className="px-3 md:px-4 py-2 md:py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-xs md:text-sm font-medium min-h-[44px] flex items-center justify-center"
                        >
                          Visualiser
                        </button>
                        <button
                          onClick={() => handleExportPlan(plan.id)}
                          className="px-3 md:px-4 py-2 md:py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs md:text-sm font-medium min-h-[44px] flex items-center justify-center"
                        >
                          Exporter
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="px-3 md:px-4 py-2 md:py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs md:text-sm font-medium min-h-[44px] flex items-center justify-center"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de migration des données */}
      <LocalDataMigrationModal
        isOpen={showMigrationModal}
        localPlansCount={monthlyPlans.length}
        onClose={handleCloseMigrationModal}
      />

    </LayoutWithNav>
  );
}
