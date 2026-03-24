import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import type { User } from '@/lib/auth/types';
import { logger } from '@/lib/logger';

/**
 * Types pour les transactions
 */
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

/**
 * Types pour les catégories
 */
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

/**
 * Types pour les éléments fixes (revenus ou dépenses)
 */
export interface FixedItem {
  id: string;
  name: string;
  amount: number;
}

/**
 * Types pour les enveloppes d'allocation
 */
export interface Envelope {
  id: string;
  name: string;
  type: 'percentage' | 'fixed'; // percentage: en % du reste, fixed: montant fixe en euros
  percentage: number; // Utilisé seulement si type='percentage'
  amount: number; // Montant calculé (percentage) ou fixé (fixed)
}

/**
 * Résultats calculés d'un plan mensuel
 */
export interface CalculatedResults {
  totalIncome: number;
  totalExpenses: number;
  availableAmount: number;
  totalEnvelopes: number;
  finalBalance: number;
  lastCalculated: string;
}

/**
 * Type pour un plan mensuel complet
 */
export interface MonthlyPlan {
  id: string;
  name: string;
  fixedIncomes: FixedItem[];
  fixedExpenses: FixedItem[];
  envelopes: Envelope[];
  calculatedResults: CalculatedResults;
  createdAt: string;
  updatedAt: string;
  isTutorial?: boolean;
}

/**
 * Paramètres globaux de l'utilisateur
 */
export interface UserSettings {
  firstDayOfMonth: number;
  currency: string;
  locale: string;
  autoAdjustPercentages: boolean;
  theme: 'light' | 'dark' | 'system';
  hasSeenTutorial: boolean;
  tutorialCompleted: boolean;
}

/**
 * État de synchronisation avec le cloud
 */
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: string | null;
  error: string | null;
}

const MAX_PLANS = 25;

/**
 * État global de l'application
 */
interface AppState {
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByType: (type: 'income' | 'expense') => Transaction[];

  // Catégories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoriesByType: (type: 'income' | 'expense') => Category[];

  // Plans mensuels (cloud-only, pas de persistance locale)
  monthlyPlans: MonthlyPlan[];
  currentMonthId: string | null;
  addMonthlyPlan: (name: string) => string;
  updateMonthlyPlan: (id: string, plan: Partial<MonthlyPlan>) => void;
  updateMonthlyPlanName: (id: string, newName: string) => void;
  deleteMonthlyPlan: (id: string) => void;
  getMonthlyPlan: (id: string) => MonthlyPlan | undefined;
  copyMonthlyPlan: (sourceId: string, newName?: string) => string;
  setCurrentMonth: (id: string | null) => void;
  recalculatePlan: (id: string) => void;
  normalizeEnvelopesForPlan: (id: string) => void;

  // Paramètres utilisateur
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => void;

  // Authentification et utilisateur
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;

  // Cloud
  syncStatus: SyncStatus;
  syncPaused: boolean;
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  pauseSync: () => void;
  resumeSync: () => void;
  loadPlansFromCloud: () => Promise<void>;
  syncWithCloud: (silent?: boolean) => Promise<void>;

  // Budget
  monthlyBudget: number;
  setMonthlyBudget: (budget: number) => void;

  // Réhydratation (pour userSettings uniquement)
  _hasHydrated: boolean;
  _setHasHydrated: (value: boolean) => void;

  // Utilitaires
  clearAllData: () => void;
}

/**
 * Catégories par défaut
 */
const defaultCategories: Category[] = [
  { id: '1', name: 'Salaire', type: 'income', color: '#10b981' },
  { id: '2', name: 'Freelance', type: 'income', color: '#3b82f6' },
  { id: '3', name: 'Alimentation', type: 'expense', color: '#ef4444' },
  { id: '4', name: 'Transport', type: 'expense', color: '#f59e0b' },
  { id: '5', name: 'Logement', type: 'expense', color: '#8b5cf6' },
  { id: '6', name: 'Loisirs', type: 'expense', color: '#ec4899' },
];

/**
 * Paramètres utilisateur par défaut
 */
const defaultUserSettings: UserSettings = {
  firstDayOfMonth: 1,
  currency: 'EUR',
  locale: 'fr-FR',
  autoAdjustPercentages: true,
  theme: 'system',
  hasSeenTutorial: false,
  tutorialCompleted: false,
};

/**
 * Configuration du stockage avec localforage (pour userSettings uniquement)
 */
const customStorage = {
  getItem: async (name: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const value = await localforage.getItem<string>(name);
      return value || null;
    } catch (error) {
      logger.error('Erreur lors de la récupération depuis localforage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      await localforage.setItem(name, value);
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde dans localforage:', error);
    }
  },
  removeItem: async (name: string) => {
    if (typeof window === 'undefined') return;
    try {
      await localforage.removeItem(name);
    } catch (error) {
      logger.error('Erreur lors de la suppression depuis localforage:', error);
    }
  },
};

/**
 * Store principal — Plans en cloud, settings en local
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // État initial
      transactions: [],
      categories: defaultCategories,
      monthlyBudget: 0,
      monthlyPlans: [],
      currentMonthId: null,
      userSettings: defaultUserSettings,
      user: null,
      syncStatus: {
        isSyncing: false,
        lastSyncAt: null,
        error: null,
      },
      syncPaused: false,
      _hasHydrated: false,

      // Actions pour les transactions
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));
      },

      updateTransaction: (id, transaction) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...transaction } : t
          ),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      getTransactionsByType: (type) => {
        return get().transactions.filter((t) => t.type === type);
      },

      // Actions pour les catégories
      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, category) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...category } : c
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      getCategoriesByType: (type) => {
        return get().categories.filter((c) => c.type === type);
      },

      // Actions pour les plans mensuels (cloud-only)
      addMonthlyPlan: (name: string) => {
        // Vérifier la limite
        const currentPlans = get().monthlyPlans.filter((p) => !p.isTutorial);
        if (currentPlans.length >= MAX_PLANS) {
          if (typeof window !== 'undefined') {
            import('@/lib/toast-notifications').then(({ toastNotifications }) => {
              toastNotifications.syncError(`Limite atteinte : maximum ${MAX_PLANS} plans`);
            });
          }
          return '';
        }

        const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const emptyResults: CalculatedResults = {
          totalIncome: 0,
          totalExpenses: 0,
          availableAmount: 0,
          totalEnvelopes: 0,
          finalBalance: 0,
          lastCalculated: new Date().toISOString(),
        };

        const newPlan: MonthlyPlan = {
          id: planId,
          name,
          fixedIncomes: [],
          fixedExpenses: [],
          envelopes: [],
          calculatedResults: emptyResults,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Créer le plan localement immédiatement
        set((state) => ({
          monthlyPlans: [...state.monthlyPlans, newPlan],
          currentMonthId: newPlan.id,
        }));

        // Upload vers le cloud (sauf si sync en pause)
        const user = get().user;
        if (user && !get().syncPaused) {
          import('@/lib/neon/sync').then(({ uploadPlanToCloudWithRetry }) => {
            uploadPlanToCloudWithRetry(newPlan, user.id, 3, 1000)
              .then((result) => {
                if (result.success) {
                  if (typeof window !== 'undefined') {
                    import('@/lib/toast-notifications').then(({ toastNotifications }) => {
                      toastNotifications.planCreated(name);
                    });
                  }
                } else {
                  if (typeof window !== 'undefined') {
                    import('@/lib/toast-notifications').then(({ toastNotifications }) => {
                      toastNotifications.syncError('Erreur lors de la sauvegarde du plan');
                    });
                  }
                }
              })
              .catch(() => {});
          });
        }

        return newPlan.id;
      },

      updateMonthlyPlan: (id: string, plan: Partial<MonthlyPlan>) => {
        const currentPlan = get().monthlyPlans.find((p) => p.id === id);
        if (!currentPlan) return;

        set((state) => ({
          monthlyPlans: state.monthlyPlans.map((p) =>
            p.id === id
              ? { ...p, ...plan, updatedAt: new Date().toISOString() }
              : p
          ),
        }));

        // Auto-sync silencieux avec debounce (sauf si sync en pause)
        const user = get().user;
        if (user && !get().syncPaused) {
          import('@/lib/neon/sync').then(({ debouncedSync }) => {
            debouncedSync(() => {
              get().syncWithCloud(true);
            });
          });
        }
      },

      updateMonthlyPlanName: (id: string, newName: string) => {
        const currentPlan = get().monthlyPlans.find((p) => p.id === id);
        if (!currentPlan) return;

        if (!newName || newName.trim().length === 0) return;

        set((state) => ({
          monthlyPlans: state.monthlyPlans.map((p) =>
            p.id === id
              ? { ...p, name: newName.trim(), updatedAt: new Date().toISOString() }
              : p
          ),
        }));

        // Auto-sync silencieux avec debounce
        const user = get().user;
        if (user) {
          import('@/lib/neon/sync').then(({ debouncedSync }) => {
            debouncedSync(() => {
              get().syncWithCloud(true);
            });
          });
        }
      },

      deleteMonthlyPlan: (id: string) => {
        set((state) => ({
          monthlyPlans: state.monthlyPlans.filter((p) => p.id !== id),
          currentMonthId: state.currentMonthId === id ? null : state.currentMonthId,
        }));

        const user = get().user;
        if (user) {
          import('@/lib/neon/sync').then(({ deletePlanFromCloud }) => {
            deletePlanFromCloud(id).catch((error) => {
              logger.error('Erreur lors de la suppression du plan dans le cloud:', error);
            });
          });
        }
      },

      getMonthlyPlan: (id: string) => {
        return get().monthlyPlans.find((p) => p.id === id);
      },

      copyMonthlyPlan: (sourceId: string, newName?: string) => {
        const sourcePlan = get().monthlyPlans.find((p) => p.id === sourceId);
        if (!sourcePlan) return '';

        // Vérifier la limite
        const currentPlans = get().monthlyPlans.filter((p) => !p.isTutorial);
        if (currentPlans.length >= MAX_PLANS) {
          if (typeof window !== 'undefined') {
            import('@/lib/toast-notifications').then(({ toastNotifications }) => {
              toastNotifications.syncError(`Limite atteinte : maximum ${MAX_PLANS} plans`);
            });
          }
          return '';
        }

        const newPlan: MonthlyPlan = {
          ...sourcePlan,
          id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: newName || `${sourcePlan.name} (Copie)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          monthlyPlans: [...state.monthlyPlans, newPlan],
          currentMonthId: newPlan.id,
        }));

        // Upload vers le cloud
        const user = get().user;
        if (user) {
          import('@/lib/neon/sync').then(({ uploadPlanToCloudWithRetry }) => {
            uploadPlanToCloudWithRetry(newPlan, user.id, 3, 1000).catch(() => {});
          });
        }

        return newPlan.id;
      },

      setCurrentMonth: (id: string | null) => {
        set({ currentMonthId: id });
      },

      // Actions de calcul
      recalculatePlan: (id: string) => {
        const plan = get().monthlyPlans.find((p) => p.id === id);
        if (!plan) return;

        import('@/lib/plan-calculator').then(({ calculatePlanResults }) => {
          const calculatedResults = calculatePlanResults(plan);

          set((state) => ({
            monthlyPlans: state.monthlyPlans.map((p) =>
              p.id === id ? { ...p, calculatedResults } : p
            ),
          }));
        });
      },

      normalizeEnvelopesForPlan: (id: string) => {
        const plan = get().monthlyPlans.find((p) => p.id === id);
        if (!plan) return;

        const settings = get().userSettings;
        if (!settings.autoAdjustPercentages) return;

        import('@/lib/monthly-plan').then(({ normalizeEnvelopePercentages, recalculateEnvelopeAmounts, calculateAvailableAmount }) => {
          const normalizedEnvelopes = normalizeEnvelopePercentages(plan.envelopes);
          const availableAmount = calculateAvailableAmount(plan.fixedIncomes, plan.fixedExpenses);
          const updatedEnvelopes = recalculateEnvelopeAmounts(normalizedEnvelopes, availableAmount);

          set((state) => ({
            monthlyPlans: state.monthlyPlans.map((p) =>
              p.id === id ? { ...p, envelopes: updatedEnvelopes } : p
            ),
          }));

          get().recalculatePlan(id);
        });
      },

      // Paramètres utilisateur
      updateUserSettings: (settings: Partial<UserSettings>) => {
        set((state) => ({
          userSettings: { ...state.userSettings, ...settings },
        }));
      },

      // Authentification
      setUser: (user: User | null) => {
        set({ user });
      },

      logout: async () => {
        try {
          const { cancelPendingSync } = await import('@/lib/neon/sync');
          cancelPendingSync();

          const res = await fetch('/api/auth/logout', { method: 'POST' });
          const data = await res.json();

          if (data.success) {
            set({ user: null, monthlyPlans: [], currentMonthId: null });
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }
        } catch (error) {
          logger.error('Erreur lors de la déconnexion:', error);
        }
      },

      // Cloud
      setSyncStatus: (status: Partial<SyncStatus>) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, ...status },
        }));
      },

      pauseSync: () => {
        set({ syncPaused: true });
        import('@/lib/neon/sync').then(({ cancelPendingSync }) => {
          cancelPendingSync();
        });
      },

      resumeSync: () => {
        set({ syncPaused: false });
        const user = get().user;
        if (user) {
          get().syncWithCloud(true);
        }
      },

      loadPlansFromCloud: async () => {
        const state = get();
        const user = state.user;
        if (!user) return;

        state.setSyncStatus({ isSyncing: true, error: null });

        try {
          const { downloadPlansFromCloud } = await import('@/lib/neon/sync');
          const result = await downloadPlansFromCloud();

          if (result.success && result.plans) {
            // Migration one-shot : si on a des plans locaux en IndexedDB, les uploader
            const localPlans = state.monthlyPlans.filter((p) => !p.isTutorial);
            if (localPlans.length > 0 && result.plans.length === 0) {
              // L'utilisateur avait des plans locaux, pas de plans cloud → migration
              const { uploadPlanToCloud } = await import('@/lib/neon/sync');
              for (const plan of localPlans) {
                await uploadPlanToCloud(plan, user.id);
              }
              // Les plans locaux deviennent les plans cloud
              set({
                syncStatus: {
                  isSyncing: false,
                  lastSyncAt: new Date().toISOString(),
                  error: null,
                },
              });
              if (typeof window !== 'undefined') {
                import('@/lib/toast-notifications').then(({ toastNotifications }) => {
                  toastNotifications.syncSuccess(localPlans.length);
                });
              }
              return;
            }

            set({
              monthlyPlans: result.plans,
              syncStatus: {
                isSyncing: false,
                lastSyncAt: new Date().toISOString(),
                error: null,
              },
            });
          } else {
            state.setSyncStatus({
              isSyncing: false,
              error: result.error?.message || 'Erreur inconnue',
            });
          }
        } catch (error) {
          state.setSyncStatus({
            isSyncing: false,
            error: 'Erreur lors du chargement des plans',
          });
        }
      },

      syncWithCloud: async (silent = false) => {
        const state = get();
        const user = state.user;
        if (!user) return;
        if (state.syncStatus.isSyncing) return;

        state.setSyncStatus({ isSyncing: true, error: null });

        try {
          const { syncAllPlans } = await import('@/lib/neon/sync');
          const result = await syncAllPlans(state.monthlyPlans, user.id);

          if (result.success && result.plans) {
            // Merge intelligent
            set((currentState) => {
              const localPlansMap = new Map(
                currentState.monthlyPlans.map((p) => [p.id, p])
              );

              const mergedPlans = result.plans!.map((cloudPlan) => {
                const localPlan = localPlansMap.get(cloudPlan.id);
                if (!localPlan) return cloudPlan;

                const localHasData =
                  localPlan.fixedIncomes.length > 0 ||
                  localPlan.fixedExpenses.length > 0 ||
                  localPlan.envelopes.length > 0;
                const cloudHasData =
                  cloudPlan.fixedIncomes.length > 0 ||
                  cloudPlan.fixedExpenses.length > 0 ||
                  cloudPlan.envelopes.length > 0;

                if (localHasData && !cloudHasData) return localPlan;

                const localTime = new Date(localPlan.updatedAt).getTime();
                const cloudTime = new Date(cloudPlan.updatedAt).getTime();
                if (localTime > cloudTime) return localPlan;

                return cloudPlan;
              });

              for (const [id, localPlan] of localPlansMap) {
                if (!result.plans!.find((p) => p.id === id)) {
                  mergedPlans.push(localPlan);
                }
              }

              return {
                monthlyPlans: mergedPlans,
                syncStatus: {
                  isSyncing: false,
                  lastSyncAt: new Date().toISOString(),
                  error: null,
                },
              };
            });

            if (!silent && typeof window !== 'undefined') {
              import('@/lib/toast-notifications').then(({ toastNotifications }) => {
                toastNotifications.syncSuccess(result.synced || 0);
              });
            }
          } else {
            const errorMessage = result.error?.message || 'Erreur inconnue';
            state.setSyncStatus({ isSyncing: false, error: errorMessage });

            if (typeof window !== 'undefined') {
              import('@/lib/toast-notifications').then(({ toastNotifications }) => {
                toastNotifications.syncError(errorMessage);
              });
            }
          }
        } catch (error) {
          const errorMessage = 'Erreur lors de la synchronisation';
          state.setSyncStatus({ isSyncing: false, error: errorMessage });

          if (typeof window !== 'undefined') {
            import('@/lib/toast-notifications').then(({ toastNotifications }) => {
              toastNotifications.syncError(errorMessage);
            });
          }
        }
      },

      // Budget
      setMonthlyBudget: (budget) => {
        set({ monthlyBudget: budget });
      },

      // Réhydratation
      _setHasHydrated: (value) => {
        set({ _hasHydrated: value });
      },

      // Utilitaires
      clearAllData: () => {
        set({
          transactions: [],
          categories: defaultCategories,
          monthlyBudget: 0,
          monthlyPlans: [],
          currentMonthId: null,
          userSettings: defaultUserSettings,
          user: null,
        });
      },
    }),
    {
      name: 'moneto-settings',
      storage: createJSONStorage(() => customStorage),
      // Ne persister QUE les settings, pas les plans
      partialize: (state) => ({
        userSettings: state.userSettings,
        categories: state.categories,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state._setHasHydrated(true);
      },
    }
  )
);
