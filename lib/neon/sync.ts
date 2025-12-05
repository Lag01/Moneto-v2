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

/**
 * Upload avec retry automatique (3 tentatives, backoff exponentiel).
 *
 * Cette fonction est utilisée lors de la création d'un nouveau plan pour garantir
 * que l'upload vers le cloud réussisse même en cas de problème réseau temporaire.
 *
 * @param plan - Le plan mensuel à uploader
 * @param userId - L'ID de l'utilisateur
 * @param maxRetries - Nombre maximum de tentatives (défaut: 3)
 * @param delayMs - Délai initial entre les tentatives en ms (défaut: 1000)
 * @returns Résultat de la synchronisation
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
        if (attempt > 1) {
          console.log(
            `[Upload] Réussi après ${attempt} tentatives pour plan "${plan.name}"`
          );
        }
        return result;
      }

      lastError = result.error;

      if (attempt < maxRetries) {
        console.warn(
          `[Upload] Tentative ${attempt}/${maxRetries} échouée pour plan "${plan.name}", retry dans ${delayMs}ms`,
          lastError
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    } catch (error) {
      console.error(
        `[Upload] Erreur inattendue tentative ${attempt} pour plan "${plan.name}":`,
        error
      );
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

  // Toutes les tentatives ont échoué
  console.error(
    `[Upload] Échec définitif après ${maxRetries} tentatives pour plan "${plan.name}"`
  );
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
  userId: string
): Promise<DownloadResult> {
  console.log('[Neon] downloadPlansFromCloud userId:', userId);

  try {
    const query = `SELECT * FROM public.monthly_plans
                   WHERE user_id = $1 ORDER BY created_at DESC`;
    const result = await executeQuery(query, [userId]);

    console.log('[Neon] executeQuery result:', {
      success: result.success,
      dataLength: result.data?.length ?? 0,
      error: result.error,
    });

    if (!result.success) {
      const errorMsg =
        typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Erreur inconnue';
      console.error('[Neon] Query failed:', errorMsg);
      return { success: false, error: result.error };
    }

    const plans = (result.data || []).map(rowToMonthlyPlan);
    console.log('[Neon] Plans converted:', plans.length);
    return { success: true, plans };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Neon] Exception:', msg, error);
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
          toastNotifications.conflictResolved(remotePlan.name, 'remote');
        });
      }

      return { success: true, plan: remotePlan, conflict: true };
    } else if (localUpdatedAt > remoteUpdatedAt) {
      console.log(`Conflit : version locale plus récente`);

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
    console.error('Erreur sync plan:', error);
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
    // ⚠️ IMPORTANT : Filtrer les plans tutoriels AVANT la synchronisation
    // Les plans tutoriels ne doivent JAMAIS être uploadés vers le cloud
    const plansToSync = localPlans.filter((plan) => !plan.isTutorial);

    if (plansToSync.length === 0) {
      console.log('[Sync] Aucun plan à synchroniser (plans tutoriels exclus)');
      return {
        success: true,
        plans: localPlans, // Retourner tous les plans locaux (y compris tutoriels)
        synced: 0,
        conflicts: 0,
      };
    }

    console.log(
      `[Sync] Synchronisation de ${plansToSync.length} plans (${localPlans.length - plansToSync.length} tutoriels exclus)`
    );

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

      for (const result of results) {
        if (result.success && result.plan) {
          updatedPlans.push(result.plan);
          localPlansMap.delete(result.plan.id); // Retirer du Map (déjà synchronisé)
          syncedCount++;
          if (result.conflict) conflictCount++;
        } else {
          console.error(`Erreur sync plan:`, result.error);
          // En cas d'erreur, garder la version locale
          const failedPlan = batch.find((p) => p.id === result.plan?.id);
          if (failedPlan) {
            updatedPlans.push(failedPlan);
            localPlansMap.delete(failedPlan.id); // Retirer du Map (déjà traité)
          }
        }
      }
    }

    // Ajouter les plans locaux non encore uploadés
    const unsyncedLocalPlans = Array.from(localPlansMap.values());
    if (unsyncedLocalPlans.length > 0) {
      console.log(
        `[Sync] ${unsyncedLocalPlans.length} plans locaux non synchronisés conservés :`,
        unsyncedLocalPlans.map((p) => p.name).join(', ')
      );
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
        console.log(
          `[Sync] ${cloudOnlyPlans.length} nouveaux plans depuis le cloud :`,
          cloudOnlyPlans.map((p) => p.name).join(', ')
        );
      }

      updatedPlans.push(...cloudOnlyPlans);
    }

    // ⚠️ IMPORTANT : Ajouter les plans tutoriels locaux (non synchronisés)
    const tutorialPlans = localPlans.filter((p) => p.isTutorial);
    if (tutorialPlans.length > 0) {
      console.log(
        `[Sync] ${tutorialPlans.length} plans tutoriels conservés localement`
      );
      updatedPlans.push(...tutorialPlans);
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
