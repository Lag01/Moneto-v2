import { describe, it, expect } from 'vitest';
import { monthlyPlanToRow, rowToMonthlyPlan } from '@/lib/neon/types';
import { createMockMonthlyPlan, createMockPlanRow } from '../helpers/test-data';

describe('Conversion de types Neon', () => {
  const userId = 'test-user-123';

  describe('monthlyPlanToRow', () => {
    it('devrait convertir un MonthlyPlan en row de base de données', () => {
      const plan = createMockMonthlyPlan({
        id: 'plan-2025-01',
        month: '2025-01',
      });

      const row = monthlyPlanToRow(plan, userId);

      expect(row.user_id).toBe(userId);
      expect(row.plan_id).toBe('plan-2025-01');
      expect(row.name).toBe('Plan 2025-01');
      expect(row.data).toEqual({
        month: '2025-01',
        fixedIncomes: plan.fixedIncomes,
        fixedExpenses: plan.fixedExpenses,
        envelopes: plan.envelopes,
      });
      expect(row.created_at).toBe(plan.createdAt);
      expect(row.updated_at).toBe(plan.updatedAt);
    });

    it('devrait inclure tous les champs nécessaires', () => {
      const plan = createMockMonthlyPlan();
      const row = monthlyPlanToRow(plan, userId);

      expect(row).toHaveProperty('user_id');
      expect(row).toHaveProperty('plan_id');
      expect(row).toHaveProperty('name');
      expect(row).toHaveProperty('data');
      expect(row).toHaveProperty('created_at');
      expect(row).toHaveProperty('updated_at');
    });
  });

  describe('rowToMonthlyPlan', () => {
    it('devrait convertir une row de base de données en MonthlyPlan', () => {
      const plan = createMockMonthlyPlan({
        id: 'plan-2025-02',
        month: '2025-02',
      });
      const row = createMockPlanRow(plan, userId);

      const convertedPlan = rowToMonthlyPlan(row);

      expect(convertedPlan.id).toBe('plan-2025-02');
      expect(convertedPlan.month).toBe('2025-02');
      expect(convertedPlan.fixedIncomes).toEqual(plan.fixedIncomes);
      expect(convertedPlan.fixedExpenses).toEqual(plan.fixedExpenses);
      expect(convertedPlan.envelopes).toEqual(plan.envelopes);
      expect(convertedPlan.createdAt).toBe(row.created_at);
      expect(convertedPlan.updatedAt).toBe(row.updated_at);
    });

    it('devrait créer des résultats calculés vides', () => {
      const plan = createMockMonthlyPlan();
      const row = createMockPlanRow(plan, userId);

      const convertedPlan = rowToMonthlyPlan(row);

      expect(convertedPlan.calculatedResults).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        availableAmount: 0,
        totalEnvelopes: 0,
        finalBalance: 0,
        lastCalculated: expect.any(String),
      });
    });

    it('devrait gérer les enveloppes avec différents types', () => {
      const plan = createMockMonthlyPlan({
        envelopes: [
          { id: 'env-1', name: 'Alimentation', type: 'percentage', percentage: 50, amount: 500 },
          { id: 'env-2', name: 'Courses', type: 'fixed', percentage: 0, amount: 200 },
        ],
      });
      const row = createMockPlanRow(plan, userId);

      const convertedPlan = rowToMonthlyPlan(row);

      expect(convertedPlan.envelopes).toHaveLength(2);
      expect(convertedPlan.envelopes[0].type).toBe('percentage');
      expect(convertedPlan.envelopes[1].type).toBe('fixed');
    });
  });

  describe('Conversion bidirectionnelle', () => {
    it('devrait maintenir l\'intégrité des données après conversion aller-retour', () => {
      const originalPlan = createMockMonthlyPlan({
        id: 'plan-roundtrip',
        month: '2025-03',
      });

      // Conversion : Plan → Row
      const row = monthlyPlanToRow(originalPlan, userId);

      // Conversion : Row → Plan
      const convertedPlan = rowToMonthlyPlan(row);

      expect(convertedPlan.id).toBe(originalPlan.id);
      expect(convertedPlan.month).toBe(originalPlan.month);
      expect(convertedPlan.fixedIncomes).toEqual(originalPlan.fixedIncomes);
      expect(convertedPlan.fixedExpenses).toEqual(originalPlan.fixedExpenses);
      expect(convertedPlan.envelopes).toEqual(originalPlan.envelopes);
      expect(convertedPlan.createdAt).toBe(originalPlan.createdAt);
      expect(convertedPlan.updatedAt).toBe(originalPlan.updatedAt);
    });
  });
});
