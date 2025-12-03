'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import LayoutWithNav from '@/app/(main)/layout-with-nav';
import EnvelopeAllocator from '@/components/EnvelopeAllocator';
import { calculateAvailableAmount, getTotalPercentage } from '@/lib/monthly-plan';
import { useTutorialContext } from '@/context/TutorialContext';

export default function RepartitionPage() {
  const router = useRouter();
  const { monthlyPlans, currentMonthId, updateMonthlyPlan, normalizeEnvelopesForPlan } =
    useAppStore();
  const { isActive: isTutorialActive, nextStep } = useTutorialContext();

  const currentPlan = monthlyPlans.find((p) => p.id === currentMonthId);

  if (!currentPlan) {
    return (
      <LayoutWithNav>
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Aucun plan sélectionné
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-6">
              Veuillez créer ou sélectionner un plan depuis le dashboard
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 min-h-[44px] text-sm md:text-base"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </LayoutWithNav>
    );
  }

  const monthDate = new Date(currentPlan.month + '-01');
  const monthLabel = monthDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const availableAmount = calculateAvailableAmount(
    currentPlan.fixedIncomes,
    currentPlan.fixedExpenses
  );

  const totalPercentage = getTotalPercentage(currentPlan.envelopes);
  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  const handleEnvelopesChange = (envelopes: typeof currentPlan.envelopes) => {
    updateMonthlyPlan(currentPlan.id, { envelopes });
  };

  const handleNext = () => {
    if (!isValid) {
      alert('La somme des pourcentages doit être égale à 100%');
      return;
    }

    if (currentPlan.envelopes.length === 0) {
      alert('Veuillez ajouter au moins une enveloppe');
      return;
    }

    // Si le tutoriel est actif, faire progresser le tutoriel (qui fera la navigation automatiquement)
    if (isTutorialActive) {
      nextStep();
    } else {
      router.push('/visualisation');
    }
  };

  return (
    <LayoutWithNav>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 capitalize">
              Répartition - {monthLabel}
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
              Définissez comment allouer votre reste disponible dans différentes enveloppes
            </p>
          </div>

          {availableAmount <= 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 md:p-6 rounded-r-lg mb-6 md:mb-8">
              <div className="flex items-start md:items-center gap-3">
                <svg
                  className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5 md:mt-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-xs md:text-sm font-medium text-red-800 dark:text-red-300">
                    Aucun montant disponible à répartir
                  </p>
                  <p className="text-xs md:text-sm text-red-700 dark:text-red-400 mt-1">
                    Vos dépenses dépassent ou égalent vos revenus. Retournez à l&apos;onboarding
                    pour ajuster vos montants.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/onboarding')}
                className="mt-4 px-4 py-3 md:py-2 bg-red-600 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-red-700 transition-colors min-h-[44px]"
              >
                ← Retour à l&apos;onboarding
              </button>
            </div>
          ) : (
            <>
              {/* Composant principal de répartition */}
              <div className="mb-6 md:mb-8">
                <EnvelopeAllocator
                  envelopes={currentPlan.envelopes}
                  availableAmount={availableAmount}
                  onChange={handleEnvelopesChange}
                  onAutoAdjust={() => normalizeEnvelopesForPlan(currentPlan.id)}
                />
              </div>

              {/* Boutons de navigation */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 md:gap-0">
                <button
                  onClick={() => router.push('/onboarding')}
                  className="px-4 md:px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors min-h-[44px] text-sm md:text-base order-2 sm:order-1"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isValid || currentPlan.envelopes.length === 0}
                  className="px-6 md:px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors min-h-[44px] text-sm md:text-base order-1 sm:order-2"
                >
                  Suivant : Visualisation →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </LayoutWithNav>
  );
}
