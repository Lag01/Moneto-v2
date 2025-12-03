'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAppStore } from '@/store';
import { getCurrentMonthStatus } from '@/lib/notifications';
import NotificationBanner from '@/components/NotificationBanner';

export default function Home() {
  const { monthlyPlans } = useAppStore();
  const { notifications } = getCurrentMonthStatus(monthlyPlans);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  const visibleNotifications = notifications.filter(
    (n) => !dismissedNotifications.includes(n.id)
  );

  const handleDismiss = (id: string) => {
    setDismissedNotifications([...dismissedNotifications, id]);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl w-full">
        {/* Notifications */}
        {visibleNotifications.length > 0 && (
          <div className="mb-8 space-y-3">
            {visibleNotifications.map((notification) => (
              <NotificationBanner
                key={notification.id}
                notification={notification}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}

        {/* Contenu principal */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Bienvenue sur Moneto
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
            Votre application de gestion financière personnelle
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                Planification simple
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                Définissez vos revenus et dépenses fixes, puis répartissez votre budget dans différentes enveloppes
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-3">
                Visualisation claire
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                Analysez vos finances avec un diagramme Sankey interactif pour comprendre vos flux d&apos;argent
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-emerald-600 dark:bg-emerald-700 text-white text-lg font-semibold rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shadow-lg"
          >
            Accéder au Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
