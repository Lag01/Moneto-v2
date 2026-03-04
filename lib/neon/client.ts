/**
 * Client Neon avec proxy sécurisé (opérations whitelistées)
 *
 * Ce module communique avec le proxy API /api/neon-proxy
 * en envoyant des opérations prédéfinies (pas de SQL brut).
 */

import type { NeonProxyRequest, NeonProxyResponse } from '@/app/api/neon-proxy/route';
import type { SyncError } from './types';

const isClient = typeof window !== 'undefined';
const FETCH_TIMEOUT_MS = 15_000; // 15 secondes

export function isNeonConfigured(): boolean {
  return true;
}

/**
 * Exécute une opération whitelistée via le proxy sécurisé.
 *
 * @param operation - Nom de l'opération (ex: 'SELECT_ALL_PLANS')
 * @param params - Paramètres de l'opération
 * @returns Résultat ou erreur
 */
export async function executeOperation<T = any>(
  operation: NeonProxyRequest['operation'],
  params: Record<string, any> = {}
): Promise<{ success: boolean; data?: T; error?: SyncError }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const baseUrl = isClient ? '' : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/neon-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        params,
      } as NeonProxyRequest),
      signal: controller.signal,
    });

    const result = (await response.json()) as NeonProxyResponse;

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.error?.code === 'UNAUTHORIZED' ? 'AUTH' : 'SERVER',
          message: result.error?.message || 'Erreur inconnue',
          details: result.error?.details,
        },
      };
    }

    return { success: true, data: result.data as T };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'NETWORK',
          message: 'Requête expirée (timeout 15s)',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK',
        message: error instanceof Error ? error.message : 'Erreur réseau',
        details: error,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
