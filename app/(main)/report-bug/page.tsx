'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ReportBugPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Récupérer les informations techniques
      const userAgent = window.navigator.userAgent;
      const url = window.location.href;

      const response = await fetch('/api/report-bug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userAgent,
          url,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Votre signalement a été envoyé avec succès ! Merci pour votre contribution.',
        });
        // Réinitialiser le formulaire
        setFormData({
          name: '',
          email: '',
          subject: '',
          description: '',
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Une erreur est survenue lors de l\'envoi.',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Une erreur est survenue. Veuillez vérifier votre connexion et réessayer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* En-tête */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Retour à l&apos;accueil
          </Link>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Signaler un bug
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Aidez-nous à améliorer Moneto en signalant les problèmes que vous rencontrez.
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 md:p-8 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom (optionnel) */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Nom (optionnel)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-colors"
                placeholder="Votre nom"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-colors"
                placeholder="votre@email.com"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pour pouvoir vous répondre si nécessaire
              </p>
            </div>

            {/* Sujet */}
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Sujet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-colors"
                placeholder="Résumé du problème"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Description du problème <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-colors resize-none"
                placeholder="Décrivez le problème en détail :&#10;- Que faisiez-vous quand le bug est survenu ?&#10;- Quel était le comportement attendu ?&#10;- Quel a été le comportement observé ?&#10;- Comment reproduire le problème ?"
              />
            </div>

            {/* Message de statut */}
            {submitStatus.type && (
              <div
                className={`p-4 rounded-lg ${
                  submitStatus.type === 'success'
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
                }`}
              >
                <div className="flex items-start">
                  <svg
                    className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      submitStatus.type === 'success'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {submitStatus.type === 'success' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                  <p>{submitStatus.message}</p>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer le signalement'
                )}
              </button>

              <Link
                href="/dashboard"
                className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-center"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Informations utiles
          </h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Plus vous fournirez de détails, plus il sera facile de reproduire et corriger le bug
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Les informations techniques (navigateur, URL) sont collectées automatiquement
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>
                Vous recevrez une réponse par email si des précisions sont nécessaires
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
