'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store';
import { useTutorialContext } from '@/context/TutorialContext';
import { createTutorialPlan } from '@/lib/tutorial-data';

/**
 * Hook personnalisé pour gérer le tutoriel
 * Gère la navigation automatique entre les pages selon l'étape du tutoriel
 */
export function useTutorial() {
  const router = useRouter();
  const pathname = usePathname();
  const { isActive, currentStep, nextStep, previousStep, skipTutorial, completeTutorial } =
    useTutorialContext();
  const { addMonthlyPlan, deleteMonthlyPlan, setCurrentMonth, updateUserSettings, monthlyPlans } =
    useAppStore();

  /**
   * Démarre le tutoriel en créant un plan d'exemple
   */
  const initializeTutorial = () => {
    // Créer le plan tutoriel
    const tutorialPlan = createTutorialPlan();

    // Ajouter le plan manuellement au store
    addMonthlyPlan(tutorialPlan.name);

    // Mettre à jour avec les données du tutoriel
    const plans = useAppStore.getState().monthlyPlans;
    const newPlan = plans[plans.length - 1];
    if (newPlan) {
      useAppStore.setState((state) => ({
        monthlyPlans: state.monthlyPlans.map((p) =>
          p.id === newPlan.id
            ? {
                ...p,
                fixedIncomes: tutorialPlan.fixedIncomes,
                fixedExpenses: tutorialPlan.fixedExpenses,
                envelopes: tutorialPlan.envelopes,
                calculatedResults: tutorialPlan.calculatedResults,
                isTutorial: true,
              }
            : p
        ),
        currentMonthId: newPlan.id,
      }));
    }
  };

  /**
   * Termine le tutoriel et nettoie le plan d'exemple
   */
  const finishTutorial = () => {
    // Trouver et supprimer le plan tutoriel
    const tutorialPlan = monthlyPlans.find((p) => p.isTutorial);
    if (tutorialPlan) {
      deleteMonthlyPlan(tutorialPlan.id);
    }

    // Marquer le tutoriel comme vu et complété
    updateUserSettings({
      hasSeenTutorial: true,
      tutorialCompleted: true,
    });

    completeTutorial();

    // Rediriger vers le dashboard
    router.push('/dashboard');
  };

  /**
   * Passer le tutoriel sans le compléter
   */
  const quitTutorial = () => {
    // Trouver et supprimer le plan tutoriel
    const tutorialPlan = monthlyPlans.find((p) => p.isTutorial);
    if (tutorialPlan) {
      deleteMonthlyPlan(tutorialPlan.id);
    }

    // Marquer le tutoriel comme vu mais pas complété
    updateUserSettings({
      hasSeenTutorial: true,
      tutorialCompleted: false,
    });

    skipTutorial();

    // Rediriger vers le dashboard
    router.push('/dashboard');
  };

  /**
   * Navigation automatique selon l'étape du tutoriel
   */
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const targetPage = `/${currentStep.page}`;

    // Naviguer vers la page correspondante si on n'y est pas déjà
    if (pathname !== targetPage) {
      router.push(targetPage);
    }
  }, [isActive, currentStep, pathname, router]);

  /**
   * Support du clavier
   */
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        quitTutorial();
      } else if (e.key === 'Enter') {
        if (currentStep && currentStep.id === 'step-4') {
          finishTutorial();
        } else {
          nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        previousStep();
      } else if (e.key === 'ArrowRight') {
        nextStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, nextStep, previousStep]);

  return {
    isActive,
    currentStep,
    nextStep,
    previousStep,
    initializeTutorial,
    finishTutorial,
    quitTutorial,
  };
}
