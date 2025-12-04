import type { MonthlyPlan } from '@/store';

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
    name: plan.name, // Utiliser le nom personnalisé du plan
    data: {
      fixedIncomes: plan.fixedIncomes,
      fixedExpenses: plan.fixedExpenses,
      envelopes: plan.envelopes,
      isTutorial: plan.isTutorial, // Stocker le flag tutoriel dans data JSONB
    },
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

export function rowToMonthlyPlan(row: MonthlyPlanRow): MonthlyPlan {
  const data = row.data;

  const emptyCalculatedResults = {
    totalIncome: 0,
    totalExpenses: 0,
    availableAmount: 0,
    totalEnvelopes: 0,
    finalBalance: 0,
    lastCalculated: new Date().toISOString(),
  };

  return {
    id: row.plan_id,
    name: row.name, // Récupérer le nom depuis la colonne dédiée
    fixedIncomes: data.fixedIncomes || [],
    fixedExpenses: data.fixedExpenses || [],
    envelopes: data.envelopes || [],
    calculatedResults: emptyCalculatedResults,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isTutorial: data.isTutorial, // Récupérer le flag tutoriel depuis data JSONB
  };
}
