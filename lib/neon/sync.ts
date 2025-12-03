import { executeQuery } from './client';
import type { MonthlyPlan } from '@/store';
import { monthlyPlanToRow, rowToMonthlyPlan } from './types';

export interface SyncError {
  code: 'NETWORK' | 'AUTH' | 'SERVER' | 'CONFLICT' | 'UNKNOWN';
  message: string;
  details?: unknown;
}

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

export async function uploadPlanToCloud(
  plan: MonthlyPlan,
  userId: string
): Promise<SyncResult> {
  try {
    const planRow = monthlyPlanToRow(plan, userId);

    // Vérifier si le plan existe
    const checkQuery = `SELECT id FROM public.monthly_plans
                        WHERE user_id = $1 AND plan_id = $2 LIMIT 1`;
    const checkResult = await executeQuery<Array<{ id: string }>>(
      checkQuery,
      [userId, plan.id]
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
      const updateQuery = `UPDATE public.monthly_plans
                           SET name = $1, data = $2, updated_at = NOW()
                           WHERE id = $3`;
      const updateResult = await executeQuery(updateQuery, [
        planRow.name,
        JSON.stringify(planRow.data),
        existing.id,
      ]);
      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }
    } else {
      // Insert
      const insertQuery = `INSERT INTO public.monthly_plans
                           (user_id, plan_id, name, data, created_at, updated_at)
                           VALUES ($1, $2, $3, $4, $5, $6)`;
      const insertResult = await executeQuery(insertQuery, [
        planRow.user_id,
        planRow.plan_id,
        planRow.name,
        JSON.stringify(planRow.data),
        planRow.created_at,
        planRow.updated_at,
      ]);
      if (!insertResult.success) {
        return { success: false, error: insertResult.error };
      }
    }

    return { success: true, synced: 1 };
  } catch (error) {
    console.error('Erreur upload:', error);
    return { success: false, error: 'Erreur upload' };
  }
}

export async function downloadPlansFromCloud(
  userId: string
): Promise<DownloadResult> {
  try {
    const query = `SELECT * FROM public.monthly_plans
                   WHERE user_id = $1 ORDER BY created_at DESC`;
    const result = await executeQuery(query, [userId]);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const plans = (result.data || []).map(rowToMonthlyPlan);
    return { success: true, plans };
  } catch (error) {
    console.error('Erreur download:', error);
    return { success: false, error: 'Erreur download' };
  }
}

export async function syncPlan(
  localPlan: MonthlyPlan,
  userId: string
): Promise<{
  success: boolean;
  plan?: MonthlyPlan;
  error?: string;
  conflict?: boolean;
}> {
  try {
    const query = `SELECT * FROM public.monthly_plans
                   WHERE user_id = $1 AND plan_id = $2 LIMIT 1`;
    const result = await executeQuery(query, [userId, localPlan.id]);

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
      console.log(`Conflit : version distante plus récente`);

      // Notification de conflit (client-side uniquement)
      if (typeof window !== 'undefined') {
        import('@/lib/toast-notifications').then(({ toastNotifications }) => {
          toastNotifications.conflictResolved(remotePlan.month, 'remote');
        });
      }

      return { success: true, plan: remotePlan, conflict: true };
    } else if (localUpdatedAt > remoteUpdatedAt) {
      console.log(`Conflit : version locale plus récente`);

      // Notification de conflit (client-side uniquement)
      if (typeof window !== 'undefined') {
        import('@/lib/toast-notifications').then(({ toastNotifications }) => {
          toastNotifications.conflictResolved(localPlan.month, 'local');
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
    console.error('Erreur sync plan:', error);
    return { success: false, error: 'Erreur sync' };
  }
}

export async function deletePlanFromCloud(
  planId: string,
  userId: string
): Promise<SyncResult> {
  try {
    const query = `DELETE FROM public.monthly_plans
                   WHERE user_id = $1 AND plan_id = $2`;
    const result = await executeQuery(query, [userId, planId]);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur delete:', error);
    return { success: false, error: 'Erreur delete' };
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
    const updatedPlans: MonthlyPlan[] = [];
    let syncedCount = 0;
    let conflictCount = 0;

    // Batching : traiter les plans par groupes de 5 en parallèle
    const BATCH_SIZE = 5;
    for (let i = 0; i < localPlans.length; i += BATCH_SIZE) {
      const batch = localPlans.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((plan) => syncPlan(plan, userId))
      );

      for (const result of results) {
        if (result.success && result.plan) {
          updatedPlans.push(result.plan);
          syncedCount++;
          if (result.conflict) conflictCount++;
        } else {
          console.error(`Erreur sync plan:`, result.error);
          // En cas d'erreur, garder la version locale
          const failedPlan = batch.find((p) => p.id === result.plan?.id);
          if (failedPlan) updatedPlans.push(failedPlan);
        }
      }
    }

    const downloadResult = await downloadPlansFromCloud(userId);
    if (downloadResult.success && downloadResult.plans) {
      const localPlanIds = new Set(localPlans.map((p) => p.id));
      const cloudOnlyPlans = downloadResult.plans.filter(
        (p) => !localPlanIds.has(p.id)
      );
      updatedPlans.push(...cloudOnlyPlans);
    }

    return {
      success: true,
      plans: updatedPlans,
      synced: syncedCount,
      conflicts: conflictCount,
    };
  } catch (error) {
    console.error('Erreur sync globale:', error);
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
