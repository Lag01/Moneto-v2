/**
 * Client Neon avec proxy sécurisé
 *
 * Ce module détecte automatiquement si le code s'exécute côté client ou serveur :
 * - Côté CLIENT (browser) : utilise le proxy API /api/neon-proxy (sécurisé par Stack Auth)
 * - Côté SERVEUR : utilise Neon directement (pour API Routes et scripts)
 */

import type { NeonProxyRequest, NeonProxyResponse } from '@/app/api/neon-proxy/route';

export interface SyncError {
  code: 'NETWORK' | 'AUTH' | 'SERVER' | 'CONFLICT' | 'UNKNOWN';
  message: string;
  details?: unknown;
}

const isClient = typeof window !== 'undefined';

export function isNeonConfigured(): boolean {
  // Toujours utiliser le proxy API, même côté serveur
  return true;
}

/**
 * Exécute une requête SQL via le proxy sécurisé (client) ou directement (serveur)
 *
 * @param query - Requête SQL avec placeholders $1, $2, etc.
 * @param params - Paramètres de la requête. Utiliser '__USER_ID__' pour user_id (remplacé automatiquement)
 * @returns Résultat de la requête ou erreur
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<{ success: boolean; data?: T; error?: SyncError }> {
  // --- Utiliser TOUJOURS le proxy API (client ET serveur) ---
  // Cela simplifie l'architecture et évite les problèmes de bundling
  try {
    // Côté serveur, utiliser l'URL absolue
    const baseUrl = isClient ? '' : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/neon-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        params,
      } as NeonProxyRequest),
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
    console.error('[Neon Client] Erreur proxy:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK',
        message: error instanceof Error ? error.message : 'Erreur réseau',
        details: error,
      },
    };
  }
}
