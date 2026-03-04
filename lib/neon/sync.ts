import { executeOperation } from './client';
import type { MonthlyPlan } from '@/store';
import type { SyncError } from './types';
import { monthlyPlanToRow, rowToMonthlyPlan } from './types';

export type { SyncError } from './types';

export interface SyncResult {
  success: boolean;
  error?: SyncError;
  synced?: number;
}

export interface DownloadResult {
  success: boolean;
  plans?: MonthlyPlan[];
  error?: SyncError;
}

let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 500;

/**
 * Annule tout timer de sync en attente.
 * DOIT être appelé au logout pour éviter les race conditions entre sessions.
 */
export function cancelPendingSync(): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
}

/**
 * Upload avec retry automatique (3 tentatives, backoff exponentiel).
 */
export async function uploadPlanToCloudWithRetry(
  plan: MonthlyPlan,
  userId: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<SyncResult> {
  let lastError: SyncError | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadPlanToCloud(plan, userId);

      if (result.success) {
        return result;
      }

      lastError = result.error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      }
    } catch (error) {
      lastError = {
        code: 'UNKNOWN',
        message: 'Erreur inattendue',
        details: error,
      };

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      }
    }
  }

  return {
    success: false,
    error: lastError,
  };
}

export async function uploadPlanToCloud(
  plan: MonthlyPlan,
  userId: string
): Promise<SyncResult> {
  try {
    const planRow = monthlyPlanToRow(plan, userId);

    // Vérifier si le plan existe
    const checkResult = await executeOperation<Array<{ id: string }>>(
      'SELECT_PLAN_BY_ID',
      { plan_id: plan.id }
    );

    if (!checkResult.success) {
      return { success: false, error: checkResult.error };
    }

    const existing =
      checkResult.data && checkResult.data.length > 0
        ? checkResult.data[0]
        : null;

    if (existing) {
      // Update
      const updateResult = await executeOperation('UPDATE_PLAN', {
        plan_id: plan.id,
        name: planRow.name,
        data: JSON.stringify(planRow.data),
      });
      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }
    } else {
      // Insert
      const insertResult = await executeOperation('INSERT_PLAN', {
        plan_id: planRow.plan_id,
        name: planRow.name,
        data: JSON.stringify(planRow.data),
        created_at: planRow.created_at,
        updated_at: planRow.updated_at,
      });
      if (!insertResult.success) {
        return { success: false, error: insertResult.error };
      }
    }

    return { success: true, synced: 1 };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Erreur upload',
        details: error,
      },
    };
  }
}

export async function downloadPlansFromCloud(
  _userId: string
): Promise<DownloadResult> {
  try {
    const result = await executeOperation('SELECT_ALL_PLANS');

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const plans = (result.data || []).map(rowToMonthlyPlan);
    return { success: true, plans };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: msg,
        details: error,
      },
    };
  }
}

export async function syncPlan(
  localPlan: MonthlyPlan,
  userId: string
): Promise<{
  success: boolean;
  plan?: MonthlyPlan;
  error?: SyncError;
  conflict?: boolean;
}> {
  try {
    const result = await executeOperation('SELECT_PLAN_BY_ID', {
      plan_id: localPlan.id,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const remotePlanRow =
      result.data && result.data.length > 0 ? result.data[0] : null;

    if (!remotePlanRow) {
      const uploadResult = await uploadPlanToCloud(localPlan, userId);
      return {
        success: uploadResult.success,
        plan: localPlan,
        error: uploadResult.error,
      };
    }

    const remotePlan = rowToMonthlyPlan(remotePlanRow);
    const localUpdatedAt = new Date(localPlan.updatedAt).getTime();
    const remoteUpdatedAt = new Date(remotePlan.updatedAt).getTime();

    // Last-write-wins avec notification
    if (remoteUpdatedAt > localUpdatedAt) {
      // Notification de conflit (client-side uniquement)
      if (typeof window !== 'undefined') {
        import('@/lib/toast-notifications').then(({ toastNotifications }) => {
          toastNotifications.conflictResolved(remotePlan.name, 'remote');
        });
      }

      return { success: true, plan: remotePlan, conflict: true };
    } else if (localUpdatedAt > remoteUpdatedAt) {
      // Notification de conflit (client-side uniquement)
      if (typeof window !== 'undefined') {
        import('@/lib/toast-notifications').then(({ toastNotifications }) => {
          toastNotifications.conflictResolved(localPlan.name, 'local');
        });
      }

      const uploadResult = await uploadPlanToCloud(localPlan, userId);
      return {
        success: uploadResult.success,
        plan: localPlan,
        error: uploadResult.error,
        conflict: true,
      };
    } else {
      return { success: true, plan: localPlan };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Erreur sync',
        details: error,
      },
    };
  }
}

export async function deletePlanFromCloud(
  planId: string,
  _userId: string
): Promise<SyncResult> {
  try {
    const result = await executeOperation('DELETE_PLAN', {
      plan_id: planId,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Erreur delete',
        details: error,
      },
    };
  }
}

export async function syncAllPlans(
  localPlans: MonthlyPlan[],
  userId: string
): Promise<{
  success: boolean;
  plans?: MonthlyPlan[];
  synced?: number;
  conflicts?: number;
  error?: SyncError;
}> {
  try {
    // Filtrer les plans tutoriels AVANT la synchronisation
    const plansToSync = localPlans.filter((plan) => !plan.isTutorial);

    if (plansToSync.length === 0) {
      return {
        success: true,
        plans: localPlans,
        synced: 0,
        conflicts: 0,
      };
    }

    // Map pour tracker les plans locaux non encore synchronisés
    const localPlansMap = new Map<string, MonthlyPlan>(
      plansToSync.map((p) => [p.id, p])
    );

    const updatedPlans: MonthlyPlan[] = [];
    let syncedCount = 0;
    let conflictCount = 0;

    // Batching : traiter les plans par groupes de 5 en parallèle
    const BATCH_SIZE = 5;
    for (let i = 0; i < plansToSync.length; i += BATCH_SIZE) {
      const batch = plansToSync.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((plan) => syncPlan(plan, userId))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.success && result.plan) {
          updatedPlans.push(result.plan);
          localPlansMap.delete(result.plan.id);
          syncedCount++;
          if (result.conflict) conflictCount++;
        } else {
          // En cas d'erreur, garder la version locale via l'index du batch
          const failedPlan = batch[j];
          updatedPlans.push(failedPlan);
          localPlansMap.delete(failedPlan.id);
        }
      }
    }

    // Ajouter les plans locaux non encore uploadés
    const unsyncedLocalPlans = Array.from(localPlansMap.values());
    if (unsyncedLocalPlans.length > 0) {
      updatedPlans.push(...unsyncedLocalPlans);
    }

    // Télécharger les plans cloud uniquement
    const downloadResult = await downloadPlansFromCloud(userId);
    if (downloadResult.success && downloadResult.plans) {
      const localPlanIds = new Set(plansToSync.map((p) => p.id));
      const cloudOnlyPlans = downloadResult.plans.filter(
        (p) => !localPlanIds.has(p.id)
      );

      if (cloudOnlyPlans.length > 0) {
        updatedPlans.push(...cloudOnlyPlans);
      }
    }

    // Ajouter les plans tutoriels locaux (non synchronisés)
    const tutorialPlans = localPlans.filter((p) => p.isTutorial);
    if (tutorialPlans.length > 0) {
      updatedPlans.push(...tutorialPlans);
    }

    return {
      success: true,
      plans: updatedPlans,
      synced: syncedCount,
      conflicts: conflictCount,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Erreur sync globale',
        details: error,
      },
    };
  }
}

export function debouncedSync(callback: () => void): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    callback();
    syncTimeout = null;
  }, SYNC_DEBOUNCE_MS);
}
