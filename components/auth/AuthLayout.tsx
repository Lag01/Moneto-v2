'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  benefits?: string[];
  footerText?: string;
  footerLink?: { text: string; href: string };
}

/**
 * Layout minimaliste élégant pour les pages d'authentification.
 *
 * Design inspiré de Stripe/Linear/Apple :
 * - Espace blanc généreux
 * - Typographie claire
 * - Animations subtiles
 * - Hiérarchie visuelle forte
 */
export default function AuthLayout({
  children,
  title,
  subtitle,
  benefits,
  footerText,
  footerLink,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Pattern de fond subtil */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] dark:opacity-[0.03]" />

      <div className="relative min-h-screen flex">
        {/* Colonne gauche : Branding + Bénéfices (desktop uniquement) */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 xl:p-16">
          {/* Logo et tagline */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="inline-block group">
              <h1 className="text-4xl xl:text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Moneto
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Gestion financière par enveloppes
              </p>
            </Link>
          </motion.div>

          {/* Bénéfices (si fournis) */}
          {benefits && benefits.length > 0 && (
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                Pourquoi créer un compte ?
              </h2>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {benefit}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer infos */}
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p>© 2025 Moneto. Tous droits réservés.</p>
          </div>
        </div>

        {/* Colonne droite : Formulaire */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Logo mobile */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-block">
                <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  Moneto
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Gestion financière par enveloppes
                </p>
              </Link>
            </div>

            {/* Carte du formulaire */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 sm:p-10">
              {/* Titre et sous-titre */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                  {title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>
              </div>

              {/* Formulaire Stack Auth */}
              {children}

              {/* Footer */}
              {footerText && footerLink && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {footerText}{' '}
                    <Link
                      href={footerLink.href}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
                    >
                      {footerLink.text}
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Lien retour */}
            <div className="mt-6 text-center">
              <Link
                href="/dashboard"
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
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
                Continuer sans compte (mode local uniquement)
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
