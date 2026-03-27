'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import LayoutWithNav from '@/app/(main)/layout-with-nav';
import { formatDate } from '@/lib/financial';
import { formatCurrency } from '@/lib/financial';
import { getPlanSummary } from '@/lib/monthly-plan';
import { useTutorialContext } from '@/context/TutorialContext';
import { useTutorial } from '@/hooks/useTutorial';
import TutorialWelcomeModal from '@/components/tutorial/TutorialWelcomeModal';
import TutorialDisclaimerModal from '@/components/tutorial/TutorialDisclaimerModal';
import RenamePlanModal from '@/components/plans/RenamePlanModal';
import ConfirmModal from '@/components/ConfirmModal';
import { RefreshCw } from 'lucide-react';
import { notifySyncDebug } from '@/lib/toast-notifications';
import toast from 'react-hot-toast';

const MAX_PLANS = 25;

export default function DashboardPage() {
  const router = useRouter();
  const {
    monthlyPlans,
    addMonthlyPlan,
    setCurrentMonth,
    deleteMonthlyPlan,
    updateMonthlyPlanName,
    userSettings,
    updateUserSettings,
    syncWithCloud,
    syncStatus,
    user,
    pauseSync,
    _hasHydrated,
  } = useAppStore();

  const [showBetaWarning, setShowBetaWarning] = useState(true);
  const [renamingPlanId, setRenamingPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  // Tutoriel
  const { showWelcomeModal, showDisclaimerModal, setShowWelcomeModal, startTutorial, startTutorialAfterDisclaimer } = useTutorialContext();
  const { initializeTutorial } = useTutorial();

  // Afficher la modal de bienvenue si l'utilisateur n'a jamais vu le tutoriel et n'a aucun plan
  useEffect(() => {
    if (_hasHydrated && !user && !userSettings.hasSeenTutorial && monthlyPlans.length === 0) {
      setShowWelcomeModal(true);
    }
  }, [_hasHydrated, user, userSettings.hasSeenTutorial, monthlyPlans.length, setShowWelcomeModal]);

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

  // Compteur et limite
  const nonTutorialPlans = monthlyPlans.filter((p) => !p.isTutorial);
  const planCount = nonTutorialPlans.length;
  const isLimitReached = planCount >= MAX_PLANS;

  const handleCreateNew = () => {
    if (isLimitReached) return;
    pauseSync();
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    addMonthlyPlan(month);
    router.push('/onboarding');
  };

  const handleSelectPlan = (planId: string) => {
    pauseSync();
    setCurrentMonth(planId);
    router.push('/onboarding');
  };

  const handleViewPlan = (planId: string) => {
    setCurrentMonth(planId);
    router.push('/visualisation');
  };

  const handleDeletePlan = (planId: string) => {
    setDeletingPlanId(planId);
  };

  const confirmDeletePlan = () => {
    if (!deletingPlanId) return;
    const planId = deletingPlanId;
    setDeletingPlanId(null);

    // Marquer comme "en attente de suppression" (masqué visuellement)
    setPendingDeleteIds((prev) => new Set(prev).add(planId));

    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">Plan supprimé</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setPendingDeleteIds((prev) => {
                const next = new Set(prev);
                next.delete(planId);
                return next;
              });
            }}
            className="px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            Annuler
          </button>
        </div>
      ),
      { duration: 5000 }
    );

    // Supprimer réellement après 5s si pas annulé
    setTimeout(() => {
      setPendingDeleteIds((prev) => {
        if (prev.has(planId)) {
          deleteMonthlyPlan(planId);
          const next = new Set(prev);
          next.delete(planId);
          return next;
        }
        return prev;
      });
    }, 5200);
  };

  // Filtrer les plans tutoriel et trier par date de création (plus récent en premier)
  const sortedPlans = [...monthlyPlans]
    .filter((plan) => !plan.isTutorial && !pendingDeleteIds.has(plan.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Afficher le bouton de rechargement si connecté, aucun plan, et (erreur OU jamais sync)
  const showReloadButton =
    user && monthlyPlans.length === 0 && (syncStatus.error || !syncStatus.lastSyncAt);

  const handleReloadPlans = async () => {
    try {
      notifySyncDebug.syncStarting();
      await syncWithCloud();
      const count = useAppStore.getState().monthlyPlans.length;
      notifySyncDebug.syncCompleted(count);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      notifySyncDebug.syncFailed(msg);
    }
  };

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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {planCount}/{MAX_PLANS} plans
            </span>
          </div>
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
                    L&apos;application est pour le moment en phase de test et subit souvent des mises à jour. Il se peut alors que vos données soient supprimées la prochaine fois que vous vous connecterez.
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

          {/* Bouton de création */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
            <button
              onClick={handleCreateNew}
              disabled={isLimitReached}
              className={`px-4 md:px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base ${
                isLimitReached
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {isLimitReached ? `Limite de ${MAX_PLANS} plans atteinte` : 'Créer un nouveau plan'}
            </button>
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
                Plans mensuels ({sortedPlans.length})
              </h2>

              {sortedPlans.map((plan) => {
                const summary = getPlanSummary(plan);

                return (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                          {plan.name}
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
                          onClick={() => setRenamingPlanId(plan.id)}
                          className="px-3 md:px-4 py-2 md:py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-xs md:text-sm font-medium min-h-[44px] flex items-center justify-center"
                        >
                          Renommer
                        </button>
                        <button
                          onClick={() => handleViewPlan(plan.id)}
                          className="px-3 md:px-4 py-2 md:py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-xs md:text-sm font-medium min-h-[44px] flex items-center justify-center"
                        >
                          Visualiser
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

      {/* Bouton de rechargement manuel */}
      {showReloadButton && (
        <div className="max-w-md mx-auto mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Aucun plan trouvé
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Si vous avez des plans dans le cloud, rechargez-les manuellement.
              </p>
              <button
                onClick={handleReloadPlans}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Recharger les plans cloud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={!!deletingPlanId}
        title="Supprimer ce plan"
        message="Êtes-vous sûr de vouloir supprimer ce plan ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={confirmDeletePlan}
        onCancel={() => setDeletingPlanId(null)}
      />

      {/* Modal de renommage */}
      {renamingPlanId && (
        <RenamePlanModal
          isOpen={true}
          currentName={monthlyPlans.find((p) => p.id === renamingPlanId)?.name || ''}
          onRename={(newName) => {
            updateMonthlyPlanName(renamingPlanId, newName);
            setRenamingPlanId(null);
          }}
          onClose={() => setRenamingPlanId(null)}
        />
      )}

    </LayoutWithNav>
  );
}
