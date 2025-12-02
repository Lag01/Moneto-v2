'use client';

import { SignIn } from '@stackframe/stack';
import Link from 'next/link';

export default function LoginForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Connexion
        </h2>

        <SignIn />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pas encore de compte ?{' '}
            <Link
              href="/auth/signup"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
