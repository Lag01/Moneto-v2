import type { MonthlyPlan } from '@/store';

/**
 * Types générés pour la base de données Supabase
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Schéma de la base de données Supabase
 */
export interface Database {
  public: {
    Tables: {
      monthly_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          name: string;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          name: string;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          name?: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

/**
 * Type pour une ligne de la table monthly_plans
 */
export type MonthlyPlanRow = Database['public']['Tables']['monthly_plans']['Row'];

/**
 * Type pour l'insertion d'un plan mensuel
 */
export type MonthlyPlanInsert = Database['public']['Tables']['monthly_plans']['Insert'];

/**
 * Type pour la mise à jour d'un plan mensuel
 */
export type MonthlyPlanUpdate = Database['public']['Tables']['monthly_plans']['Update'];

/**
 * Convertit un MonthlyPlan (format app) en MonthlyPlanInsert (format DB)
 */
export function monthlyPlanToRow(
  plan: MonthlyPlan,
  userId: string
): MonthlyPlanInsert {
  return {
    user_id: userId,
    plan_id: plan.id, // On utilise l'ID du plan comme plan_id
    name: `Plan ${plan.month}`, // Nom généré à partir du mois
    data: {
      month: plan.month,
      fixedIncomes: plan.fixedIncomes,
      fixedExpenses: plan.fixedExpenses,
      envelopes: plan.envelopes,
    } as unknown as Json,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

/**
 * Convertit un MonthlyPlanRow (format DB) en MonthlyPlan (format app)
 */
export function rowToMonthlyPlan(row: MonthlyPlanRow): MonthlyPlan {
  const data = row.data as any;

  // Créer des résultats calculés vides (seront recalculés par le store)
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
    month: data.month || '',
    fixedIncomes: data.fixedIncomes || [],
    fixedExpenses: data.fixedExpenses || [],
    envelopes: data.envelopes || [],
    calculatedResults: emptyCalculatedResults,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

