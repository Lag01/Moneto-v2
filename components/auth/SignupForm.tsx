'use client';

import { SignUp } from '@stackframe/stack';
import Link from 'next/link';

export default function SignupForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Créer un compte
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Sauvegardez et synchronisez vos données sur tous vos appareils
        </p>

        <SignUp />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Déjà un compte ?{' '}
            <Link
              href="/auth/login"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
