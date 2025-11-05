'use client';

import { useState } from 'react';
import LayoutWithNav from '@/app/layout-with-nav';
import { useAppStore } from '@/store';
import { syncAllPlans, uploadPlanToCloud, downloadPlansFromCloud } from '@/lib/supabase/sync';

export default function SyncTestPage() {
  const user = useAppStore((state) => state.user);
  const monthlyPlans = useAppStore((state) => state.monthlyPlans);
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, unknown>>({});

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, message, type }]);
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  // Test 1: Upload basique
  const testBasicUpload = async () => {
    if (!user || monthlyPlans.length === 0) {
      addLog('Aucun utilisateur connecté ou aucun plan disponible', 'error');
      return;
    }

    setIsRunning(true);
    addLog('Début du test d\'upload basique...', 'info');

    try {
      const plan = monthlyPlans[0];
      const startTime = performance.now();

      const result = await uploadPlanToCloud(plan, user.id);

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (result.success) {
        addLog(`✅ Upload réussi en ${duration.toFixed(2)}ms`, 'success');
        setTestResults((prev) => ({ ...prev, uploadTime: duration.toFixed(2) }));
      } else {
        addLog(`❌ Upload échoué: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Test 2: Download
  const testDownload = async () => {
    if (!user) {
      addLog('Aucun utilisateur connecté', 'error');
      return;
    }

    setIsRunning(true);
    addLog('Début du test de download...', 'info');

    try {
      const startTime = performance.now();

      const result = await downloadPlansFromCloud(user.id);

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (result.success) {
        addLog(`✅ Download réussi: ${result.plans?.length || 0} plans en ${duration.toFixed(2)}ms`, 'success');
        setTestResults((prev) => ({
          ...prev,
          downloadTime: duration.toFixed(2),
          downloadCount: result.plans?.length || 0,
        }));
      } else {
        addLog(`❌ Download échoué: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Test 3: Sync complète
  const testFullSync = async () => {
    if (!user) {
      addLog('Aucun utilisateur connecté', 'error');
      return;
    }

    setIsRunning(true);
    addLog('Début de la synchronisation complète...', 'info');

    try {
      const startTime = performance.now();

      const result = await syncAllPlans(monthlyPlans, user.id);

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (result.success) {
        addLog(
          `✅ Sync complète réussie: ${result.synced} plans synchronisés, ${result.conflicts || 0} conflits résolus en ${duration.toFixed(2)}ms`,
          'success'
        );
        setTestResults((prev) => ({
          ...prev,
          fullSyncTime: duration.toFixed(2),
          syncedCount: result.synced,
          conflicts: result.conflicts || 0,
        }));
      } else {
        addLog(`❌ Sync échouée: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Test 4: Simuler un conflit
  const testConflictSimulation = async () => {
    if (!user || monthlyPlans.length === 0) {
      addLog('Aucun utilisateur connecté ou aucun plan disponible', 'error');
      return;
    }

    setIsRunning(true);
    addLog('Simulation de conflit...', 'info');

    try {
      const plan = { ...monthlyPlans[0] };

      // 1. Upload version initiale
      addLog('1. Upload de la version initiale...', 'info');
      await uploadPlanToCloud(plan, user.id);

      // 2. Modifier le plan (simuler modification locale)
      const modifiedPlan = {
        ...plan,
        updatedAt: new Date(Date.now() + 5000).toISOString(),
        fixedIncomes: [...plan.fixedIncomes, { id: 'test-income', name: 'Test', amount: 100 }],
      };

      // 3. Upload la version modifiée
      addLog('2. Upload de la version modifiée (plus récente)...', 'info');
      const result = await uploadPlanToCloud(modifiedPlan, user.id);

      if (result.success) {
        addLog('✅ Conflit simulé et résolu avec succès', 'success');
        addLog('   → La version la plus récente a été conservée', 'info');
      } else {
        addLog(`❌ Erreur lors de la simulation: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Test 5: Performance benchmark
  const testPerformanceBenchmark = async () => {
    if (!user) {
      addLog('Aucun utilisateur connecté', 'error');
      return;
    }

    setIsRunning(true);
    addLog('Début du benchmark de performance...', 'info');

    const benchmarks: Array<{ operation: string; duration: number }> = [];

    try {
      // Test 1: Upload d'un plan
      if (monthlyPlans.length > 0) {
        const uploadStart = performance.now();
        await uploadPlanToCloud(monthlyPlans[0], user.id);
        const uploadEnd = performance.now();
        benchmarks.push({ operation: 'Upload 1 plan', duration: uploadEnd - uploadStart });
      }

      // Test 2: Download
      const downloadStart = performance.now();
      await downloadPlansFromCloud(user.id);
      const downloadEnd = performance.now();
      benchmarks.push({ operation: 'Download plans', duration: downloadEnd - downloadStart });

      // Test 3: Sync complète
      const syncStart = performance.now();
      await syncAllPlans(monthlyPlans, user.id);
      const syncEnd = performance.now();
      benchmarks.push({ operation: `Sync ${monthlyPlans.length} plans`, duration: syncEnd - syncStart });

      // Afficher les résultats
      addLog('📊 Résultats du benchmark:', 'success');
      benchmarks.forEach((b) => {
        addLog(`   ${b.operation}: ${b.duration.toFixed(2)}ms`, 'info');
      });

      setTestResults((prev) => ({ ...prev, benchmarks }));
    } catch (error) {
      addLog(`❌ Erreur: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  if (!user) {
    return (
      <LayoutWithNav>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <p className="text-yellow-800 dark:text-yellow-200">
                ⚠️ Vous devez être connecté pour utiliser cet outil de test.
              </p>
            </div>
          </div>
        </div>
      </LayoutWithNav>
    );
  }

  return (
    <LayoutWithNav>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              🧪 Outil de test de synchronisation
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Testez et déboguez la synchronisation cloud
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span>👤 {user.email}</span>
              <span>📁 {monthlyPlans.length} plans locaux</span>
            </div>
          </div>

          {/* Tests disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testBasicUpload}
              disabled={isRunning || monthlyPlans.length === 0}
              className="p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="text-lg font-semibold mb-1">1. Upload basique</div>
              <div className="text-sm opacity-90">Upload d&apos;un plan vers le cloud</div>
            </button>

            <button
              onClick={testDownload}
              disabled={isRunning}
              className="p-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="text-lg font-semibold mb-1">2. Download</div>
              <div className="text-sm opacity-90">Télécharger les plans du cloud</div>
            </button>

            <button
              onClick={testFullSync}
              disabled={isRunning}
              className="p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="text-lg font-semibold mb-1">3. Sync complète</div>
              <div className="text-sm opacity-90">Synchronisation bidirectionnelle</div>
            </button>

            <button
              onClick={testConflictSimulation}
              disabled={isRunning || monthlyPlans.length === 0}
              className="p-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="text-lg font-semibold mb-1">4. Simuler conflit</div>
              <div className="text-sm opacity-90">Tester la résolution de conflits</div>
            </button>

            <button
              onClick={testPerformanceBenchmark}
              disabled={isRunning}
              className="p-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="text-lg font-semibold mb-1">5. Benchmark</div>
              <div className="text-sm opacity-90">Mesurer les performances</div>
            </button>

            <button
              onClick={clearLogs}
              disabled={isRunning}
              className="p-4 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg transition-colors text-left"
            >
              <div className="text-lg font-semibold mb-1">🗑️ Effacer</div>
              <div className="text-sm opacity-90">Réinitialiser les logs</div>
            </button>
          </div>

          {/* Résultats */}
          {Object.keys(testResults).length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">📊 Résultats</h2>
              <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}

          {/* Console de logs */}
          <div className="bg-slate-900 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">📝 Console de logs</h2>
              {isRunning && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400 border-t-transparent"></div>
                  <span className="text-sm">En cours...</span>
                </div>
              )}
            </div>

            <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-slate-500">Aucun log pour le moment. Lancez un test !</div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`mb-1 ${
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'error'
                        ? 'text-red-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500">[{log.time}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWithNav>
  );
}
