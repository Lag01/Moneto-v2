'use client';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }; // eslint-disable-line @typescript-eslint/no-unused-vars
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Erreur d&apos;authentification
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Un problème est survenu lors de l&apos;authentification. Veuillez réessayer.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors min-h-[44px]"
          >
            Réessayer
          </button>
          <a
            href="/auth/login"
            className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px] flex items-center justify-center"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
