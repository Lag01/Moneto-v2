'use client';

import { useRouter } from 'next/navigation';
import { useAppStore, type FixedItem } from '@/store';
import LayoutWithNav from '@/app/(main)/layout-with-nav';
import IncomeExpenseForm from '@/components/IncomeExpenseForm';
import { formatCurrency } from '@/lib/financial';
import { calculateAvailableAmount } from '@/lib/monthly-plan';
import { useTutorialContext } from '@/context/TutorialContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { monthlyPlans, currentMonthId, updateMonthlyPlan, setCurrentMonth } = useAppStore();
  const { isActive: isTutorialActive, nextStep } = useTutorialContext();

  const currentPlan = monthlyPlans.find((p) => p.id === currentMonthId);

  // Fallback intelligent : reset currentMonthId si le plan n'existe pas
  if (!currentPlan && currentMonthId) {
    console.warn(
      `[Onboarding] Plan ${currentMonthId} non trouvé, reset de currentMonthId`
    );
    setCurrentMonth(null);
  }

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

  const availableAmount = calculateAvailableAmount(
    currentPlan.fixedIncomes,
    currentPlan.fixedExpenses
  );

  const handleIncomesChange = (items: FixedItem[]) => {
    updateMonthlyPlan(currentPlan.id, { fixedIncomes: items });
  };

  const handleExpensesChange = (items: FixedItem[]) => {
    updateMonthlyPlan(currentPlan.id, { fixedExpenses: items });
  };

  const handleNext = () => {
    if (currentPlan.fixedIncomes.length === 0 || currentPlan.fixedExpenses.length === 0) {
      alert('Veuillez ajouter au moins un revenu et une dépense');
      return;
    }

    if (availableAmount <= 0) {
      alert('Le reste disponible doit être positif pour continuer');
      return;
    }

    // Si le tutoriel est actif, faire progresser le tutoriel (qui fera la navigation automatiquement)
    if (isTutorialActive) {
      nextStep();
    } else {
      router.push('/repartition');
    }
  };

  return (
    <LayoutWithNav>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Entrées / Sorties - {currentPlan.name}
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
              Définissez vos revenus et dépenses fixes pour ce plan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Formulaire Revenus */}
            <IncomeExpenseForm
              type="income"
              items={currentPlan.fixedIncomes}
              onChange={handleIncomesChange}
              title="Revenus fixes"
            />

            {/* Formulaire Dépenses */}
            <IncomeExpenseForm
              type="expense"
              items={currentPlan.fixedExpenses}
              onChange={handleExpensesChange}
              title="Dépenses fixes"
            />
          </div>

          {/* Résumé */}
          <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-5 md:p-6 mb-6">
            <h3 className="text-base md:text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Résumé</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mb-1">Total revenus</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {formatCurrency(
                    currentPlan.fixedIncomes.reduce((sum, i) => sum + i.amount, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mb-1">Total dépenses</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {formatCurrency(
                    currentPlan.fixedExpenses.reduce((sum, i) => sum + i.amount, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mb-1">Reste disponible</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(availableAmount)}</p>
              </div>
            </div>

            {availableAmount <= 0 && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <p className="text-xs md:text-sm text-red-800 dark:text-red-300">
                  ⚠️ Attention : Vos dépenses dépassent ou égalent vos revenus. Veuillez
                  ajuster vos montants.
                </p>
              </div>
            )}
          </div>

          {/* Boutons de navigation */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 md:gap-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 md:px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors min-h-[44px] text-sm md:text-base order-2 sm:order-1"
            >
              ← Retour
            </button>
            <button
              onClick={handleNext}
              disabled={
                currentPlan.fixedIncomes.length === 0 ||
                currentPlan.fixedExpenses.length === 0 ||
                availableAmount <= 0
              }
              className="px-6 md:px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors min-h-[44px] text-sm md:text-base order-1 sm:order-2"
            >
              Suivant : Répartition →
            </button>
          </div>
        </div>
      </div>
    </LayoutWithNav>
  );
}
