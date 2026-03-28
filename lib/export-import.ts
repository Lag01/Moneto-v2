import type { MonthlyPlan, UserSettings, Category } from '@/store';

interface ExportEnvelope {
  version: number;
  exportedAt: string;
  data: {
    monthlyPlans: MonthlyPlan[];
    userSettings: UserSettings;
    categories: Category[];
  };
}

export interface ImportResult {
  success: boolean;
  data?: ExportEnvelope['data'];
  error?: string;
}

/**
 * Exporte toutes les données utilisateur en JSON
 */
export function exportAllData(
  monthlyPlans: MonthlyPlan[],
  userSettings: UserSettings,
  categories: Category[]
): void {
  const envelope: ExportEnvelope = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      monthlyPlans: monthlyPlans.filter((p) => !p.isTutorial),
      userSettings,
      categories,
    },
  };

  const json = JSON.stringify(envelope, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `moneto-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Valide la structure d'un fichier importé
 */
function validateImportData(parsed: unknown): parsed is ExportEnvelope {
  if (typeof parsed !== 'object' || parsed === null) return false;

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.version !== 'number' || obj.version < 1) return false;
  if (typeof obj.data !== 'object' || obj.data === null) return false;

  const data = obj.data as Record<string, unknown>;
  if (!Array.isArray(data.monthlyPlans)) return false;
  if (typeof data.userSettings !== 'object' || data.userSettings === null) return false;
  if (!Array.isArray(data.categories)) return false;

  return true;
}

/**
 * Importe des données depuis un fichier JSON
 */
export function importData(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);

        if (!validateImportData(parsed)) {
          resolve({
            success: false,
            error: 'Format de fichier invalide. Assurez-vous d\'utiliser un fichier exporté par Moneto.',
          });
          return;
        }

        resolve({ success: true, data: parsed.data });
      } catch {
        resolve({
          success: false,
          error: 'Impossible de lire le fichier. Vérifiez qu\'il s\'agit d\'un fichier JSON valide.',
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, error: 'Erreur lors de la lecture du fichier.' });
    };

    reader.readAsText(file);
  });
}
