import type { MonthlyPlan } from '@/store';

/**
 * Structure du fichier JSON exporté
 */
export interface ExportedPlanData {
  version: string;
  exportDate: string;
  plan: {
    name: string;
    month?: string; // Rétrocompatibilité : accepté à l'import mais plus exporté
    fixedIncomes: MonthlyPlan['fixedIncomes'];
    fixedExpenses: MonthlyPlan['fixedExpenses'];
    envelopes: MonthlyPlan['envelopes'];
    calculatedResults: MonthlyPlan['calculatedResults'];
  };
}

/**
 * Exporte un plan mensuel en fichier JSON téléchargeable
 */
export function exportMonthlyPlanToJSON(plan: MonthlyPlan): void {
  const exportData: ExportedPlanData = {
    version: '2.0', // Incrémentation pour nouveau format
    exportDate: new Date().toISOString(),
    plan: {
      name: plan.name,
      fixedIncomes: plan.fixedIncomes,
      fixedExpenses: plan.fixedExpenses,
      envelopes: plan.envelopes,
      calculatedResults: plan.calculatedResults,
    },
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Générer nom de fichier sûr (remplacer caractères interdits)
  const safeFileName = plan.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const link = document.createElement('a');
  link.href = url;
  link.download = `moneto-plan-${safeFileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporte tous les plans en un seul fichier JSON
 */
export function exportAllPlansToJSON(plans: MonthlyPlan[]): void {
  const exportData = {
    version: '2.0', // Incrémentation pour nouveau format
    exportDate: new Date().toISOString(),
    plans: plans.map((plan) => ({
      name: plan.name,
      fixedIncomes: plan.fixedIncomes,
      fixedExpenses: plan.fixedExpenses,
      envelopes: plan.envelopes,
      calculatedResults: plan.calculatedResults,
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `moneto-all-plans-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valide la structure d'un plan importé
 */
function validateImportedPlan(data: any): {
  valid: boolean;
  errors: string[];
  plan?: ExportedPlanData['plan'];
} {
  const errors: string[] = [];

  // Vérifier la structure de base
  if (!data || typeof data !== 'object') {
    errors.push('Le fichier JSON est invalide');
    return { valid: false, errors };
  }

  if (!data.version) {
    errors.push('Version manquante dans le fichier');
  }

  if (!data.plan || typeof data.plan !== 'object') {
    errors.push('Données du plan manquantes');
    return { valid: false, errors };
  }

  const { plan } = data;

  // Rétrocompatibilité : Convertir month → name si nécessaire
  if (!plan.name && plan.month) {
    // Ancien format détecté, convertir month en name
    try {
      const monthDate = new Date(plan.month + '-01');
      plan.name = monthDate.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      plan.name = plan.name.charAt(0).toUpperCase() + plan.name.slice(1);
      console.log(`[Import] Conversion ancien format : "${plan.month}" → "${plan.name}"`);
    } catch {
      plan.name = `Plan ${plan.month}`;
    }
  }

  // Vérifier le nom (obligatoire dans le nouveau format)
  if (!plan.name || typeof plan.name !== 'string') {
    errors.push('Nom du plan invalide ou manquant');
  }

  // Vérifier fixedIncomes
  if (!Array.isArray(plan.fixedIncomes)) {
    errors.push('Liste des revenus invalide');
  } else {
    plan.fixedIncomes.forEach((income: any, index: number) => {
      if (!income.name || typeof income.name !== 'string') {
        errors.push(`Revenu ${index + 1}: nom invalide`);
      }
      if (typeof income.amount !== 'number' || income.amount < 0) {
        errors.push(`Revenu ${index + 1}: montant invalide`);
      }
    });
  }

  // Vérifier fixedExpenses
  if (!Array.isArray(plan.fixedExpenses)) {
    errors.push('Liste des dépenses invalide');
  } else {
    plan.fixedExpenses.forEach((expense: any, index: number) => {
      if (!expense.name || typeof expense.name !== 'string') {
        errors.push(`Dépense ${index + 1}: nom invalide`);
      }
      if (typeof expense.amount !== 'number' || expense.amount < 0) {
        errors.push(`Dépense ${index + 1}: montant invalide`);
      }
    });
  }

  // Vérifier envelopes
  if (!Array.isArray(plan.envelopes)) {
    errors.push('Liste des enveloppes invalide');
  } else {
    plan.envelopes.forEach((envelope: any, index: number) => {
      if (!envelope.name || typeof envelope.name !== 'string') {
        errors.push(`Enveloppe ${index + 1}: nom invalide`);
      }
      if (typeof envelope.percentage !== 'number' || envelope.percentage < 0) {
        errors.push(`Enveloppe ${index + 1}: pourcentage invalide`);
      }
      if (typeof envelope.amount !== 'number' || envelope.amount < 0) {
        errors.push(`Enveloppe ${index + 1}: montant invalide`);
      }
    });
  }

  // Vérifier calculatedResults
  if (!plan.calculatedResults || typeof plan.calculatedResults !== 'object') {
    errors.push('Résultats calculés manquants');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], plan };
}

/**
 * Importe un plan depuis un fichier JSON
 */
export async function importMonthlyPlanFromJSON(
  file: File
): Promise<{
  success: boolean;
  errors: string[];
  plan?: ExportedPlanData['plan'];
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    const validation = validateImportedPlan(data);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    return {
      success: true,
      errors: [],
      plan: validation.plan,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        errors: ['Le fichier JSON est mal formaté'],
      };
    }
    return {
      success: false,
      errors: ['Erreur lors de la lecture du fichier'],
    };
  }
}

/**
 * Importe plusieurs plans depuis un fichier JSON
 */
export async function importAllPlansFromJSON(
  file: File
): Promise<{
  success: boolean;
  errors: string[];
  plans?: ExportedPlanData['plan'][];
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        errors: ['Le fichier JSON est invalide'],
      };
    }

    if (!Array.isArray(data.plans)) {
      return {
        success: false,
        errors: ['Le fichier ne contient pas de liste de plans'],
      };
    }

    const validatedPlans: ExportedPlanData['plan'][] = [];
    const errors: string[] = [];

    data.plans.forEach((plan: any, index: number) => {
      const validation = validateImportedPlan({ version: data.version, plan });
      if (validation.valid && validation.plan) {
        validatedPlans.push(validation.plan);
      } else {
        errors.push(`Plan ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });

    if (validatedPlans.length === 0) {
      return {
        success: false,
        errors: errors.length > 0 ? errors : ['Aucun plan valide trouvé'],
      };
    }

    return {
      success: true,
      errors,
      plans: validatedPlans,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        errors: ['Le fichier JSON est mal formaté'],
      };
    }
    return {
      success: false,
      errors: ['Erreur lors de la lecture du fichier'],
    };
  }
}
