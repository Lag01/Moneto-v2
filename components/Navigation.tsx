'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import TutorialSidebar from './tutorial/TutorialSidebar';
import { useTutorialContext } from '@/context/TutorialContext';
import { useAppStore } from '@/store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/onboarding', label: 'Entrées / Sorties' },
  { href: '/repartition', label: 'Répartition' },
  { href: '/visualisation', label: 'Visualisation' },
  { href: '/settings', label: 'Paramètres' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { isActive: isTutorialActive } = useTutorialContext();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  return (
    <nav className="hidden md:flex bg-slate-800 dark:bg-slate-950 text-white w-64 min-h-screen p-6 flex-col fixed left-0 top-0 bottom-0 z-30 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-400 dark:text-emerald-300">Moneto</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Gestion financière</p>
      </div>

      {/* Panneau de tutoriel en overlay full-size (masque tout quand actif) */}
      <TutorialSidebar />

      {/* Navigation normale - cachée pendant le tutoriel */}
      {!isTutorialActive && (
        <>
          <ul className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-600 dark:bg-emerald-700 text-white font-medium'
                        : 'text-slate-300 dark:text-slate-400 hover:bg-slate-700 dark:hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="space-y-3">
            {/* Theme Toggle */}
            <div className="px-2">
              <ThemeToggle />
            </div>

            {/* Section authentification */}
            <div className="pt-3 border-t border-slate-700 dark:border-slate-800">
              {user ? (
                <div className="space-y-2">
                  {/* Carte utilisateur cliquable vers profil */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                        {user.email}
                      </p>
                      {user.isPremium && (
                        <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-emerald-600 dark:bg-emerald-700 text-white rounded">
                          Premium
                        </span>
                      )}
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>

                  {/* Bouton déconnexion compact */}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-red-400 dark:hover:text-red-400 hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 mx-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Se connecter
                </Link>
              )}
            </div>

            {/* Signaler un bug */}
            <Link
              href="/report-bug"
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-white hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Signaler un bug
            </Link>

            {/* Retour accueil */}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-white hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Retour accueil
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}
