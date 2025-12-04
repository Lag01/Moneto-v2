import { FixedItem, Envelope, MonthlyPlan, CalculatedResults } from '@/store';

/**
 * Données d'exemple pour le tutoriel
 */

// Revenus fixes d'exemple
export const tutorialIncomes: FixedItem[] = [
  {
    id: 'tutorial-income-1',
    name: 'Salaire',
    amount: 2500,
  },
  {
    id: 'tutorial-income-2',
    name: 'Freelance',
    amount: 500,
  },
];

// Dépenses fixes d'exemple
export const tutorialExpenses: FixedItem[] = [
  {
    id: 'tutorial-expense-1',
    name: 'Loyer',
    amount: 800,
  },
  {
    id: 'tutorial-expense-2',
    name: 'Courses',
    amount: 300,
  },
  {
    id: 'tutorial-expense-3',
    name: 'Transport',
    amount: 100,
  },
];

// Enveloppes d'exemple
export const tutorialEnvelopes: Envelope[] = [
  {
    id: 'tutorial-env-1',
    name: 'Épargne',
    type: 'percentage',
    percentage: 40,
    amount: 720, // 40% de 1800
  },
  {
    id: 'tutorial-env-2',
    name: 'Loisirs',
    type: 'percentage',
    percentage: 30,
    amount: 540, // 30% de 1800
  },
  {
    id: 'tutorial-env-3',
    name: 'Investissement',
    type: 'percentage',
    percentage: 30,
    amount: 540, // 30% de 1800
  },
];

/**
 * Crée un plan mensuel d'exemple pour le tutoriel
 */
export function createTutorialPlan(): MonthlyPlan {
  const now = new Date();

  const calculatedResults: CalculatedResults = {
    totalIncome: 3000,
    totalExpenses: 1200,
    availableAmount: 1800,
    totalEnvelopes: 1800,
    finalBalance: 0,
    lastCalculated: now.toISOString(),
  };

  return {
    id: 'tutorial-plan',
    name: 'Plan Tutoriel', // Nom fixe pour le plan de démonstration
    fixedIncomes: tutorialIncomes,
    fixedExpenses: tutorialExpenses,
    envelopes: tutorialEnvelopes,
    calculatedResults,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    isTutorial: true,
  };
}

/**
 * Définition des étapes du tutoriel
 */
export interface TutorialStepData {
  id: string;
  page: 'dashboard' | 'onboarding' | 'repartition' | 'visualisation';
  title: string;
  description: string;
  highlightSelector?: string; // Sélecteur CSS pour mettre en surbrillance
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const tutorialSteps: TutorialStepData[] = [
  {
    id: 'step-1',
    page: 'dashboard',
    title: 'Bienvenue dans votre Dashboard',
    description:
      "C'est ici que vous gérez tous vos plans mensuels. Vous pouvez créer de nouveaux plans, copier des plans existants, ou importer/exporter vos données pour les sauvegarder.",
    position: 'center',
  },
  {
    id: 'step-2',
    page: 'onboarding',
    title: 'Définissez vos revenus et dépenses fixes',
    description:
      'Commencez par entrer vos revenus mensuels (salaire, freelance...) et vos dépenses fixes récurrentes (loyer, courses, transport...). Le reste disponible sera automatiquement calculé.',
    position: 'center',
  },
  {
    id: 'step-3',
    page: 'repartition',
    title: 'Répartissez votre budget en enveloppes',
    description:
      "Allouez votre reste disponible dans différentes enveloppes selon vos objectifs. Vous pouvez utiliser des pourcentages ou des montants fixes. L'application s'assure que la somme fait 100%.",
    position: 'center',
  },
  {
    id: 'step-4',
    page: 'visualisation',
    title: 'Visualisez vos flux financiers',
    description:
      "Le diagramme Sankey vous montre comment votre argent circule : de vos revenus vers vos dépenses fixes, puis vers vos enveloppes. C'est un excellent moyen de comprendre visuellement votre budget.",
    position: 'center',
  },
];
