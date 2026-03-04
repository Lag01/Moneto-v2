import type { FixedItem, Envelope, MonthlyPlan } from '@/store';

/**
 * Calcule le total d'un tableau d'éléments fixes
 */
export function calculateFixedTotal(items: FixedItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Calcule le reste disponible après déduction des dépenses fixes
 */
export function calculateAvailableAmount(
  fixedIncomes: FixedItem[],
  fixedExpenses: FixedItem[]
): number {
  const totalIncome = calculateFixedTotal(fixedIncomes);
  const totalExpenses = calculateFixedTotal(fixedExpenses);
  return totalIncome - totalExpenses;
}

/**
 * Sépare les enveloppes fixes et en pourcentage
 */
export function separateEnvelopesByType(envelopes: Envelope[]): {
  fixed: Envelope[];
  percentage: Envelope[];
} {
  return {
    fixed: envelopes.filter((env) => env.type === 'fixed'),
    percentage: envelopes.filter((env) => env.type === 'percentage'),
  };
}

/**
 * Calcule le total des enveloppes fixes
 */
export function calculateFixedEnvelopesTotal(envelopes: Envelope[]): number {
  const { fixed } = separateEnvelopesByType(envelopes);
  return fixed.reduce((sum, env) => sum + env.amount, 0);
}

/**
 * Calcule le montant disponible pour les enveloppes en pourcentage
 * (après déduction des enveloppes fixes)
 */
export function calculateAvailableForPercentage(
  fixedIncomes: FixedItem[],
  fixedExpenses: FixedItem[],
  envelopes: Envelope[]
): number {
  const availableAmount = calculateAvailableAmount(fixedIncomes, fixedExpenses);
  const fixedEnvelopesTotal = calculateFixedEnvelopesTotal(envelopes);
  return availableAmount - fixedEnvelopesTotal;
}

/**
 * Calcule les montants des enveloppes en fonction des pourcentages
 */
export function calculateEnvelopeAmounts(
  envelopes: Envelope[],
  availableAmount: number
): Envelope[] {
  return envelopes.map((envelope) => {
    if (envelope.type === 'fixed') {
      // Les enveloppes fixes gardent leur montant
      return envelope;
    }
    // Les enveloppes en pourcentage sont calculées
    return {
      ...envelope,
      amount: (availableAmount * envelope.percentage) / 100,
    };
  });
}

/**
 * Valide que la somme des pourcentages des enveloppes = 100%
 * Ne compte que les enveloppes en pourcentage
 */
export function validateEnvelopesPercentage(envelopes: Envelope[]): boolean {
  const { percentage } = separateEnvelopesByType(envelopes);
  if (percentage.length === 0) return true; // Pas d'enveloppes en %, validation OK
  const total = percentage.reduce((sum, env) => sum + env.percentage, 0);
  return Math.abs(total - 100) < 0.01; // Tolérance pour les erreurs d'arrondi
}

/**
 * Récupère le total des pourcentages actuels
 * Ne compte que les enveloppes en pourcentage
 */
export function getTotalPercentage(envelopes: Envelope[]): number {
  const { percentage } = separateEnvelopesByType(envelopes);
  return percentage.reduce((sum, env) => sum + env.percentage, 0);
}

/**
 * Calcule le pourcentage maximum qu'une enveloppe peut avoir
 * pour ne pas dépasser 100% au total
 * @param envelopes - Liste de toutes les enveloppes
 * @param currentEnvelopeId - ID de l'enveloppe pour laquelle calculer le max
 * @returns Le pourcentage maximum disponible (entre 0 et 100)
 */
export function calculateMaxPercentageForEnvelope(
  envelopes: Envelope[],
  currentEnvelopeId: string
): number {
  const { percentage } = separateEnvelopesByType(envelopes);

  // Somme des pourcentages de toutes les autres enveloppes en %
  const otherPercentagesSum = percentage
    .filter((env) => env.id !== currentEnvelopeId)
    .reduce((sum, env) => sum + env.percentage, 0);

  // Le max est ce qui reste pour arriver à 100%
  return Math.max(0, 100 - otherPercentagesSum);
}

/**
 * Calcule le solde final après allocation de toutes les enveloppes
 */
export function calculateFinalBalance(plan: MonthlyPlan): number {
  const totalIncome = calculateFixedTotal(plan.fixedIncomes);
  const totalExpenses = calculateFixedTotal(plan.fixedExpenses);
  const totalEnvelopes = plan.envelopes.reduce((sum, env) => sum + env.amount, 0);

  return totalIncome - totalExpenses - totalEnvelopes;
}

/**
 * Génère un résumé du plan mensuel
 */
export interface PlanSummary {
  totalIncome: number;
  totalFixedExpenses: number;
  availableAmount: number;
  totalEnvelopes: number;
  finalBalance: number;
}

export function getPlanSummary(plan: MonthlyPlan): PlanSummary {
  const totalIncome = calculateFixedTotal(plan.fixedIncomes);
  const totalFixedExpenses = calculateFixedTotal(plan.fixedExpenses);
  const availableAmount = totalIncome - totalFixedExpenses;
  const totalEnvelopes = plan.envelopes.reduce((sum, env) => sum + env.amount, 0);
  const finalBalance = availableAmount - totalEnvelopes;

  return {
    totalIncome,
    totalFixedExpenses,
    availableAmount,
    totalEnvelopes,
    finalBalance,
  };
}

/**
 * Normalise les pourcentages des enveloppes pour qu'ils totalisent exactement 100%
 * Ajuste proportionnellement chaque pourcentage
 * Ne touche QUE les enveloppes en pourcentage, ignore les fixes
 */
export function normalizeEnvelopePercentages(envelopes: Envelope[]): Envelope[] {
  if (envelopes.length === 0) return envelopes;

  const { percentage } = separateEnvelopesByType(envelopes);

  if (percentage.length === 0) return envelopes; // Que des fixes, rien à normaliser

  const total = getTotalPercentage(envelopes);

  // Si déjà à 100% (avec tolérance), ne rien changer
  if (Math.abs(total - 100) < 0.01) {
    return envelopes;
  }

  // Si total = 0, répartir équitablement sur les enveloppes en %
  if (total === 0) {
    const equalPercentage = Math.round((100 / percentage.length) * 100) / 100;
    return envelopes.map((env) => {
      if (env.type === 'fixed') return env; // Garder les fixes intactes
      return {
        ...env,
        percentage: equalPercentage,
      };
    });
  }

  // Ajuster proportionnellement seulement les enveloppes en %
  // Arrondir à 2 décimales pour éviter les erreurs floating-point
  const factor = 100 / total;
  return envelopes.map((env) => {
    if (env.type === 'fixed') return env; // Garder les fixes intactes
    return {
      ...env,
      percentage: Math.round(env.percentage * factor * 100) / 100,
    };
  });
}

/**
 * Ajuste les montants des enveloppes en fonction des pourcentages
 * Utilisé après modification des pourcentages ou du montant disponible
 * Prend en compte les enveloppes fixes qui sont déduites en premier
 */
export function recalculateEnvelopeAmounts(
  envelopes: Envelope[],
  availableAmount: number
): Envelope[] {
  // Calculer d'abord le montant disponible après enveloppes fixes
  const fixedTotal = calculateFixedEnvelopesTotal(envelopes);
  const availableForPercentage = availableAmount - fixedTotal;

  return envelopes.map((env) => {
    if (env.type === 'fixed') {
      // Les enveloppes fixes gardent leur montant
      return env;
    }
    // Les enveloppes en pourcentage sont calculées sur le reste
    return {
      ...env,
      amount: (availableForPercentage * env.percentage) / 100,
    };
  });
}

/**
 * Valide qu'un plan mensuel est complet et cohérent
 */
export function validateMonthlyPlan(plan: MonthlyPlan): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (plan.fixedIncomes.length === 0) {
    errors.push('Aucun revenu fixe défini');
  }

  if (plan.fixedExpenses.length === 0) {
    errors.push('Aucune dépense fixe définie');
  }

  if (plan.envelopes.length === 0) {
    errors.push('Aucune enveloppe définie');
  }

  if (plan.envelopes.length > 0 && !validateEnvelopesPercentage(plan.envelopes)) {
    errors.push('La somme des pourcentages des enveloppes doit être égale à 100%');
  }

  const availableAmount = calculateAvailableAmount(
    plan.fixedIncomes,
    plan.fixedExpenses
  );

  if (availableAmount < 0) {
    errors.push('Les dépenses fixes dépassent les revenus fixes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
