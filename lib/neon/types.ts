import type { MonthlyPlan } from '@/store';
import {
  calculateFixedTotal,
  calculateAvailableAmount,
  recalculateEnvelopeAmounts,
} from '@/lib/monthly-plan';

/**
 * Type centralisé pour les erreurs de synchronisation.
 * Utilisé par client.ts, sync.ts et le store.
 */
export interface SyncError {
  code: 'NETWORK' | 'AUTH' | 'SERVER' | 'CONFLICT' | 'UNKNOWN';
  message: string;
  details?: unknown;
}

export interface MonthlyPlanRow {
  id: string;
  user_id: string;
  plan_id: string;
  name: string;
  data: any;
  created_at: string;
  updated_at: string;
}

export interface MonthlyPlanInsert {
  user_id: string;
  plan_id: string;
  name: string;
  data: any;
  created_at: string;
  updated_at: string;
}

export function monthlyPlanToRow(
  plan: MonthlyPlan,
  userId: string
): MonthlyPlanInsert {
  return {
    user_id: userId,
    plan_id: plan.id,
    name: plan.name,
    data: {
      fixedIncomes: plan.fixedIncomes,
      fixedExpenses: plan.fixedExpenses,
      envelopes: plan.envelopes,
      isTutorial: plan.isTutorial,
    },
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

export function rowToMonthlyPlan(row: MonthlyPlanRow): MonthlyPlan {
  const data = row.data;

  const fixedIncomes = data.fixedIncomes || [];
  const fixedExpenses = data.fixedExpenses || [];
  const envelopes = data.envelopes || [];

  // Recalculer immédiatement les résultats (au lieu de laisser des 0)
  const totalIncome = calculateFixedTotal(fixedIncomes);
  const totalExpenses = calculateFixedTotal(fixedExpenses);
  const availableAmount = calculateAvailableAmount(fixedIncomes, fixedExpenses);
  const recalculatedEnvelopes = recalculateEnvelopeAmounts(envelopes, availableAmount);
  const totalEnvelopes = recalculatedEnvelopes.reduce((sum: number, env: any) => sum + env.amount, 0);
  const finalBalance = availableAmount - totalEnvelopes;

  return {
    id: row.plan_id,
    name: row.name,
    fixedIncomes,
    fixedExpenses,
    envelopes: recalculatedEnvelopes,
    calculatedResults: {
      totalIncome,
      totalExpenses,
      availableAmount,
      totalEnvelopes,
      finalBalance,
      lastCalculated: new Date().toISOString(),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isTutorial: data.isTutorial,
  };
}
