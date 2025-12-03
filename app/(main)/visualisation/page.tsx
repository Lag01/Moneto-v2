'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import LayoutWithNav from '@/app/(main)/layout-with-nav';
import SankeyChart from '@/components/SankeyChart';
import { getPlanSummary } from '@/lib/monthly-plan';
import { formatCurrency } from '@/lib/financial';
import { useTutorialContext } from '@/context/TutorialContext';
import { useTutorial } from '@/hooks/useTutorial';

export default function VisualisationPage() {
  const router = useRouter();
  const { monthlyPlans, currentMonthId, setCurrentMonth } = useAppStore();
  const { isActive: isTutorialActive } = useTutorialContext();
  const { finishTutorial } = useTutorial();

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

  const summary = getPlanSummary(currentPlan);

  const handleChangePlan = (planId: string) => {
    setCurrentMonth(planId);
  };

  return (
    <LayoutWithNav>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 capitalize">
              Visualisation - {monthLabel}
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-4">
              Analysez votre plan financier avec des graphiques détaillés
            </p>

            {/* Sélecteur de mois */}
            {monthlyPlans.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <label className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sélectionner un autre mois :
                </label>
                <select
                  value={currentMonthId || ''}
                  onChange={(e) => handleChangePlan(e.target.value)}
                  className="px-3 md:px-4 py-3 md:py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] text-sm md:text-base"
                >
                  {monthlyPlans.map((plan) => {
                    const date = new Date(plan.month + '-01');
                    const label = date.toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric',
                    });
                    return (
                      <option key={plan.id} value={plan.id} className="capitalize">
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Résumé financier */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 md:p-4">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Revenus totaux</p>
              <p className="text-base md:text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 md:p-4">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Dépenses fixes</p>
              <p className="text-base md:text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalFixedExpenses)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 md:p-4">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Disponible</p>
              <p className="text-base md:text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.availableAmount)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 md:p-4">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Enveloppes</p>
              <p className="text-base md:text-xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(summary.totalEnvelopes)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 md:p-4 col-span-2 sm:col-span-1">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">Solde final</p>
              <p
                className={`text-base md:text-xl font-bold ${
                  summary.finalBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(summary.finalBalance)}
              </p>
            </div>
          </div>

          {/* Détails des revenus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-green-700 dark:text-green-400 mb-4">Revenus fixes</h3>
              <div className="space-y-2">
                {currentPlan.fixedIncomes.map((income) => (
                  <div key={income.id} className="flex justify-between items-center">
                    <span className="text-sm md:text-base text-slate-700 dark:text-slate-300">{income.name}</span>
                    <span className="text-sm md:text-base font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(income.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-red-700 dark:text-red-400 mb-4">Dépenses fixes</h3>
              <div className="space-y-2">
                {currentPlan.fixedExpenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center">
                    <span className="text-sm md:text-base text-slate-700 dark:text-slate-300">{expense.name}</span>
                    <span className="text-sm md:text-base font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enveloppes */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 md:p-6 mb-6 md:mb-8">
            <h3 className="text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4">
              Répartition des enveloppes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {currentPlan.envelopes.map((envelope) => (
                <div key={envelope.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 md:p-4">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-1">{envelope.name}</p>
                  <p className="text-lg md:text-xl font-bold text-purple-700 dark:text-purple-400">
                    {formatCurrency(envelope.amount)}
                  </p>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500 mt-1">{envelope.percentage}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique Sankey */}
          <div className="space-y-6 md:space-y-8">
            <SankeyChart plan={currentPlan} />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 md:gap-0 mt-6 md:mt-8">
            <button
              onClick={() => router.push('/repartition')}
              className="px-4 md:px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 min-h-[44px] text-sm md:text-base order-2 sm:order-1"
            >
              ← Modifier le plan
            </button>
            <button
              onClick={() => {
                if (isTutorialActive) {
                  finishTutorial();
                } else {
                  router.push('/dashboard');
                }
              }}
              className="px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 min-h-[44px] text-sm md:text-base order-1 sm:order-2"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    </LayoutWithNav>
  );
}
