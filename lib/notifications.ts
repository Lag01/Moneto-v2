import type { MonthlyPlan } from '@/store';
import { getTotalPercentage } from './monthly-plan';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

/**
 * Vérifie le statut d'un plan donné
 */
export function getCurrentPlanStatus(currentPlan: MonthlyPlan | null): {
  currentMonthPlan?: MonthlyPlan;
  notifications: Notification[];
} {
  const notifications: Notification[] = [];

  // Pas de plan sélectionné
  if (!currentPlan) {
    notifications.push({
      id: 'no-current-plan',
      type: 'warning',
      title: 'Aucun plan sélectionné',
      message: 'Créez ou sélectionnez un plan pour commencer à gérer votre budget.',
      action: {
        label: 'Créer un plan',
        href: '/dashboard',
      },
    });
    return { notifications };
  }

  const currentMonthPlan = currentPlan;

  // Plan incomplet : pas de revenus
  if (currentMonthPlan.fixedIncomes.length === 0) {
    notifications.push({
      id: 'no-incomes',
      type: 'error',
      title: 'Budget incomplet',
      message: 'Vous n\'avez pas encore défini vos revenus fixes pour ce mois.',
      action: {
        label: 'Ajouter des revenus',
        href: '/onboarding',
      },
    });
  }

  // Plan incomplet : pas de dépenses
  if (currentMonthPlan.fixedExpenses.length === 0) {
    notifications.push({
      id: 'no-expenses',
      type: 'error',
      title: 'Budget incomplet',
      message: 'Vous n\'avez pas encore défini vos dépenses fixes pour ce mois.',
      action: {
        label: 'Ajouter des dépenses',
        href: '/onboarding',
      },
    });
  }

  // Montant disponible négatif
  const totalIncome = currentMonthPlan.fixedIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = currentMonthPlan.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const availableAmount = totalIncome - totalExpenses;

  if (availableAmount < 0) {
    notifications.push({
      id: 'negative-balance',
      type: 'error',
      title: 'Budget déséquilibré',
      message: 'Vos dépenses dépassent vos revenus. Ajustez votre budget pour retrouver un équilibre.',
      action: {
        label: 'Ajuster le budget',
        href: '/onboarding',
      },
    });
  }

  // Pas d'enveloppes définies
  if (availableAmount > 0 && currentMonthPlan.envelopes.length === 0) {
    notifications.push({
      id: 'no-envelopes',
      type: 'warning',
      title: 'Répartition manquante',
      message: 'Vous n\'avez pas encore réparti votre argent disponible dans des enveloppes.',
      action: {
        label: 'Répartir le budget',
        href: '/repartition',
      },
    });
  }

  // Pourcentages non validés
  if (currentMonthPlan.envelopes.length > 0) {
    const totalPercentage = getTotalPercentage(currentMonthPlan.envelopes);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      notifications.push({
        id: 'invalid-percentages',
        type: 'warning',
        title: 'Répartition incomplète',
        message: `La somme de vos pourcentages ne fait pas 100% (actuellement: ${totalPercentage.toFixed(1)}%).`,
        action: {
          label: 'Ajuster les pourcentages',
          href: '/repartition',
        },
      });
    }
  }

  // Tout est OK !
  if (notifications.length === 0) {
    notifications.push({
      id: 'all-good',
      type: 'success',
      title: 'Budget en ordre !',
      message: `Votre plan "${currentPlan.name}" est complet et validé. Félicitations !`,
      action: {
        label: 'Voir la visualisation',
        href: '/visualisation',
      },
    });
  }

  return { currentMonthPlan, notifications };
}

/**
 * Obtient des statistiques générales sur les plans
 */
export function getGeneralStats(plans: MonthlyPlan[]) {
  const totalPlans = plans.length;
  const completePlans = plans.filter((p) => {
    const hasIncomes = p.fixedIncomes.length > 0;
    const hasExpenses = p.fixedExpenses.length > 0;
    const hasEnvelopes = p.envelopes.length > 0;
    const totalPercentage = getTotalPercentage(p.envelopes);
    const percentagesValid = Math.abs(totalPercentage - 100) < 0.01;

    return hasIncomes && hasExpenses && hasEnvelopes && percentagesValid;
  }).length;

  const averageIncome =
    plans.reduce((sum, p) => {
      const total = p.fixedIncomes.reduce((s, i) => s + i.amount, 0);
      return sum + total;
    }, 0) / (totalPlans || 1);

  const averageExpenses =
    plans.reduce((sum, p) => {
      const total = p.fixedExpenses.reduce((s, e) => s + e.amount, 0);
      return sum + total;
    }, 0) / (totalPlans || 1);

  return {
    totalPlans,
    completePlans,
    averageIncome,
    averageExpenses,
    averageSavings: averageIncome - averageExpenses,
  };
}
