import type { MonthlyPlan, CalculatedResults } from '@/store';
import {
  calculateFixedTotal,
  recalculateEnvelopeAmounts,
} from './monthly-plan';

/**
 * Calcule tous les résultats d'un plan mensuel
 * Cette fonction centralise tous les calculs nécessaires
 * Ordre : Revenus - Dépenses fixes = Disponible brut
 *         Disponible brut - Enveloppes fixes = Disponible pour %
 *         Répartition du disponible pour % selon les enveloppes en %
 */
export function calculatePlanResults(plan: MonthlyPlan): CalculatedResults {
  // 1. Total des revenus
  const totalIncome = calculateFixedTotal(plan.fixedIncomes);

  // 2. Total des dépenses fixes
  const totalExpenses = calculateFixedTotal(plan.fixedExpenses);

  // 3. Reste disponible brut = Revenus - Dépenses fixes
  const availableAmount = totalIncome - totalExpenses;

  // 4. Recalculer les montants des enveloppes (fixes gardent leur montant, % sont recalculés)
  const updatedEnvelopes = recalculateEnvelopeAmounts(
    plan.envelopes,
    availableAmount
  );

  // 5. Total alloué dans toutes les enveloppes (fixes + pourcentage)
  const totalEnvelopes = updatedEnvelopes.reduce(
    (sum, env) => sum + env.amount,
    0
  );

  // 6. Solde final = Disponible brut - Total enveloppes
  const finalBalance = availableAmount - totalEnvelopes;

  return {
    totalIncome,
    totalExpenses,
    availableAmount,
    totalEnvelopes,
    finalBalance,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Crée un plan avec les résultats calculés initiaux
 */
export function createCalculatedPlan(
  name: string,
  id: string
): MonthlyPlan {
  const emptyResults: CalculatedResults = {
    totalIncome: 0,
    totalExpenses: 0,
    availableAmount: 0,
    totalEnvelopes: 0,
    finalBalance: 0,
    lastCalculated: new Date().toISOString(),
  };

  return {
    id,
    name,
    fixedIncomes: [],
    fixedExpenses: [],
    envelopes: [],
    calculatedResults: emptyResults,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
