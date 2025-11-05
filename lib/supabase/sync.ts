import { supabase, isSupabaseConfigured } from './client';
import type { MonthlyPlan } from '@/store';
import { monthlyPlanToRow, rowToMonthlyPlan } from './types';

/**
 * Résultat d'une opération de synchronisation
 */
export interface SyncResult {
  success: boolean;
  error?: string;
  synced?: number;
}

/**
 * Résultat d'un téléchargement de plans
 */
export interface DownloadResult {
  success: boolean;
  plans?: MonthlyPlan[];
  error?: string;
}

/**
 * Configuration du debouncing
 */
let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 2000; // 2 secondes de délai

/**
 * Upload un plan mensuel vers Supabase
 *
 * @param plan - Le plan à uploader
 * @param userId - L'ID de l'utilisateur
 * @returns Résultat de l'opération
 */
export async function uploadPlanToCloud(
  plan: MonthlyPlan,
  userId: string
): Promise<SyncResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'La synchronisation cloud n\'est pas configurée',
    };
  }

  try {
    // Convertir le plan au format DB
    const planRow = monthlyPlanToRow(plan, userId);

    // Vérifier si le plan existe déjà
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase
      .from('monthly_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_id', plan.id)
      .single() as any);

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = pas de résultat, c'est OK
      console.error('Erreur lors de la vérification du plan existant:', fetchError);
      return {
        success: false,
        error: 'Erreur lors de la vérification du plan existant',
      };
    }

    if (existing) {
      // Mise à jour du plan existant
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('monthly_plans') as any)
        .update({
          name: planRow.name,
          data: planRow.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du plan:', updateError);
        return {
          success: false,
          error: 'Erreur lors de la mise à jour du plan',
        };
      }
    } else {
      // Insertion d'un nouveau plan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('monthly_plans') as any)
        .insert(planRow);

      if (insertError) {
        console.error('Erreur lors de l\'insertion du plan:', insertError);
        return {
          success: false,
          error: 'Erreur lors de l\'insertion du plan',
        };
      }
    }

    return {
      success: true,
      synced: 1,
    };
  } catch (error) {
    console.error('Erreur inattendue lors de l\'upload:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de l\'upload',
    };
  }
}

/**
 * Télécharge tous les plans de l'utilisateur depuis Supabase
 *
 * @param userId - L'ID de l'utilisateur
 * @returns Les plans téléchargés
 */
export async function downloadPlansFromCloud(
  userId: string
): Promise<DownloadResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'La synchronisation cloud n\'est pas configurée',
    };
  }

  try {
    const { data, error } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du téléchargement des plans:', error);
      return {
        success: false,
        error: 'Erreur lors du téléchargement des plans',
      };
    }

    // Convertir les rows en plans
    const plans = (data || []).map(rowToMonthlyPlan);

    return {
      success: true,
      plans,
    };
  } catch (error) {
    console.error('Erreur inattendue lors du téléchargement:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors du téléchargement',
    };
  }
}

/**
 * Synchronise un plan avec gestion des conflits (last-write-wins)
 * Compare les timestamps updated_at pour décider quelle version garder
 *
 * @param localPlan - Le plan local
 * @param userId - L'ID de l'utilisateur
 * @returns Le plan à utiliser (local ou distant) et le résultat de la sync
 */
export async function syncPlan(
  localPlan: MonthlyPlan,
  userId: string
): Promise<{ success: boolean; plan?: MonthlyPlan; error?: string; conflict?: boolean }> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'La synchronisation cloud n\'est pas configurée',
    };
  }

  try {
    // Récupérer le plan distant
    const { data: remotePlanRow, error: fetchError } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_id', localPlan.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération du plan distant:', fetchError);
      return {
        success: false,
        error: 'Erreur lors de la récupération du plan distant',
      };
    }

    // Si le plan n'existe pas sur le cloud, on l'upload
    if (!remotePlanRow) {
      const uploadResult = await uploadPlanToCloud(localPlan, userId);
      return {
        success: uploadResult.success,
        plan: localPlan,
        error: uploadResult.error,
      };
    }

    // Convertir le plan distant
    const remotePlan = rowToMonthlyPlan(remotePlanRow);

    // Comparer les timestamps pour détecter un conflit
    const localUpdatedAt = new Date(localPlan.updatedAt).getTime();
    const remoteUpdatedAt = new Date(remotePlan.updatedAt).getTime();

    // Last-write-wins : garder le plus récent
    if (remoteUpdatedAt > localUpdatedAt) {
      // Le plan distant est plus récent, on le retourne
      console.log(`Conflit détecté pour le plan ${localPlan.id} : version distante plus récente`);
      return {
        success: true,
        plan: remotePlan,
        conflict: true,
      };
    } else if (localUpdatedAt > remoteUpdatedAt) {
      // Le plan local est plus récent, on l'upload
      console.log(`Conflit détecté pour le plan ${localPlan.id} : version locale plus récente`);
      const uploadResult = await uploadPlanToCloud(localPlan, userId);
      return {
        success: uploadResult.success,
        plan: localPlan,
        error: uploadResult.error,
        conflict: true,
      };
    } else {
      // Timestamps identiques, pas de conflit
      return {
        success: true,
        plan: localPlan,
      };
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la sync du plan:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de la sync',
    };
  }
}

/**
 * Supprime un plan du cloud
 *
 * @param planId - L'ID du plan à supprimer
 * @param userId - L'ID de l'utilisateur
 * @returns Résultat de l'opération
 */
export async function deletePlanFromCloud(
  planId: string,
  userId: string
): Promise<SyncResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'La synchronisation cloud n\'est pas configurée',
    };
  }

  try {
    const { error } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('user_id', userId)
      .eq('plan_id', planId);

    if (error) {
      console.error('Erreur lors de la suppression du plan:', error);
      return {
        success: false,
        error: 'Erreur lors de la suppression du plan',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de la suppression',
    };
  }
}

/**
 * Synchronise tous les plans locaux avec le cloud
 * Gère les conflits avec la stratégie last-write-wins
 *
 * @param localPlans - Les plans locaux à synchroniser
 * @param userId - L'ID de l'utilisateur
 * @returns Résultat global de la synchronisation et les plans mis à jour
 */
export async function syncAllPlans(
  localPlans: MonthlyPlan[],
  userId: string
): Promise<{
  success: boolean;
  plans?: MonthlyPlan[];
  synced?: number;
  conflicts?: number;
  error?: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'La synchronisation cloud n\'est pas configurée',
    };
  }

  try {
    const updatedPlans: MonthlyPlan[] = [];
    let syncedCount = 0;
    let conflictCount = 0;

    // Synchroniser chaque plan
    for (const plan of localPlans) {
      const result = await syncPlan(plan, userId);

      if (result.success && result.plan) {
        updatedPlans.push(result.plan);
        syncedCount++;
        if (result.conflict) {
          conflictCount++;
        }
      } else {
        // En cas d'erreur, garder le plan local
        console.error(`Erreur lors de la sync du plan ${plan.id}:`, result.error);
        updatedPlans.push(plan);
      }
    }

    // Télécharger les plans qui n'existent que sur le cloud
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
    console.error('Erreur inattendue lors de la sync globale:', error);
    return {
      success: false,
      error: 'Erreur inattendue lors de la synchronisation',
    };
  }
}

/**
 * Synchronise avec debouncing
 * Retarde la synchronisation pour éviter trop d'appels successifs
 *
 * @param callback - Fonction à appeler après le délai
 */
export function debouncedSync(callback: () => void): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    callback();
    syncTimeout = null;
  }, SYNC_DEBOUNCE_MS);
}
