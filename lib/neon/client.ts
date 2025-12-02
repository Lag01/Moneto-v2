import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

export function isNeonConfigured(): boolean {
  return !!databaseUrl;
}

export const sql = isNeonConfigured() && databaseUrl ? neon(databaseUrl) : null;

export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!sql) {
    return { success: false, error: 'Base de données non configurée' };
  }

  try {
    const result = await sql(query, params);
    return { success: true, data: result as T };
  } catch (error) {
    console.error('Erreur requête:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
