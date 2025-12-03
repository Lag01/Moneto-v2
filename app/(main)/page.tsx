'use client';

import Link from 'next/link';
import FeatureCard from '@/components/landing/FeatureCard';
import StepCard from '@/components/landing/StepCard';
import ModeCard from '@/components/landing/ModeCard';
import DemoSankeyChart from '@/components/landing/DemoSankeyChart';

export default function PresentationPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative px-6 md:px-12 lg:px-24 pt-20 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-8">
              <img
                src="/icons/icon-192x192.png"
                alt="Moneto"
                className="w-24 h-24 md:w-32 md:h-32 rounded-3xl shadow-2xl ring-4 ring-emerald-500 dark:ring-emerald-600 relative z-10"
              />
            </div>

            {/* Titre principal */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
              Maîtrisez vos finances avec<br />
              <span className="text-emerald-600 dark:text-emerald-400">
                la méthode des enveloppes
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              L&apos;application de gestion budgétaire moderne qui vous aide à prendre le contrôle de vos dépenses
              et à atteindre vos objectifs financiers
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-semibold">
                100% Gratuit
              </span>
              <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
                Open-source
              </span>
              <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-semibold">
                Données privées
              </span>
            </div>

            {/* CTA principal */}
            <Link
              href="/home"
              className="inline-flex items-center gap-3 px-8 md:px-12 py-4 md:py-5 bg-emerald-600 hover:bg-emerald-700 text-white text-lg md:text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
            >
              <span>Commencer gratuitement</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            <p className="text-slate-500 dark:text-slate-400 mt-6 text-sm">
              Aucune carte bancaire • Aucun engagement • Installation en 2 clics
            </p>
          </div>
        </div>
      </section>

      {/* Section : La méthode des enveloppes expliquée */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-white dark:bg-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Qu&apos;est-ce que la méthode des enveloppes ?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
              Une approche simple et efficace pour gérer votre budget : vous divisez votre argent disponible
              en différentes &quot;enveloppes&quot; selon vos besoins et priorités.
            </p>
          </div>

          {/* Schéma visuel */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 md:p-12 mb-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
              {/* Revenus */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-600 dark:bg-emerald-700 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Revenus</p>
              </div>

              {/* Flèche */}
              <svg className="w-8 h-8 text-slate-400 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>

              {/* Dépenses fixes */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-red-600 dark:bg-red-700 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dépenses fixes</p>
              </div>

              {/* Égal */}
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>

              {/* Disponible */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-600 dark:bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Disponible</p>
              </div>

              {/* Flèche */}
              <svg className="w-8 h-8 text-slate-400 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>

              {/* Enveloppes */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-purple-600 dark:bg-purple-700 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enveloppes</p>
              </div>
            </div>
          </div>

          {/* Explication */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-700 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Calculez votre reste</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Soustrayez vos dépenses fixes (loyer, assurances...) de vos revenus mensuels
              </p>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Créez vos enveloppes</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Définissez vos catégories de dépenses : courses, loisirs, épargne, shopping...
              </p>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Répartissez votre budget</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Allouez un pourcentage ou un montant fixe à chaque enveloppe selon vos priorités
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section : Comment ça marche (4 étapes) */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Comment ça marche ?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Créez votre premier plan budgétaire en 4 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <StepCard
              number={1}
              title="Définissez vos revenus et dépenses fixes"
              description="Commencez par entrer vos sources de revenus mensuels (salaire, allocations...) et vos dépenses fixes récurrentes (loyer, assurances, abonnements...)."
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-700 dark:text-slate-300">💰 Salaire</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">2 500 €</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-700 dark:text-slate-300">🏠 Loyer</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">-800 €</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-700 dark:text-slate-300">🚗 Assurance auto</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">-150 €</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">💵 Disponible</span>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">1 550 €</span>
                </div>
              </div>
            </StepCard>

            <StepCard
              number={2}
              title="Créez vos enveloppes personnalisées"
              description="Définissez les catégories qui correspondent à votre style de vie : alimentation, loisirs, épargne, shopping, santé, transport..."
            >
              <div className="grid grid-cols-2 gap-3">
                {['🛒 Courses', '🎮 Loisirs', '💰 Épargne', '👕 Shopping', '💊 Santé', '🚌 Transport'].map((env, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center shadow-sm">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{env}</span>
                  </div>
                ))}
              </div>
            </StepCard>

            <StepCard
              number={3}
              title="Répartissez avec les sliders interactifs"
              description="Utilisez les curseurs pour allouer un pourcentage de votre reste disponible à chaque enveloppe. Vous pouvez aussi définir des montants fixes."
            >
              <div className="space-y-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-orange-500">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      🛒 Courses
                      <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">Montant fixe</span>
                    </span>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">400 €</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Budget fixe mensuel pour les courses alimentaires</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300">🎮 Loisirs</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">20% • 230 €</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: '20%' }}></div>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300">💰 Épargne</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">50% • 575 €</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300">👕 Shopping</span>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">30% • 345 €</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </StepCard>

            <StepCard
              number={4}
              title="Visualisez vos flux avec le diagramme Sankey"
              description="Voyez instantanément où va chaque euro grâce au diagramme de flux interactif qui montre le parcours de votre argent."
            >
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center">
                <svg className="w-full h-32 mx-auto" viewBox="0 0 400 150">
                  {/* Revenus */}
                  <rect x="10" y="50" width="30" height="50" fill="#10b981" rx="4" />
                  <text x="50" y="75" fill="currentColor" className="text-xs fill-slate-700 dark:fill-slate-300">Revenus</text>

                  {/* Flux vers disponible */}
                  <path d="M 40 75 Q 120 75 180 75" fill="none" stroke="#3b82f6" strokeWidth="20" opacity="0.4" />

                  {/* Disponible */}
                  <rect x="180" y="50" width="30" height="50" fill="#3b82f6" rx="4" />
                  <text x="220" y="75" fill="currentColor" className="text-xs fill-slate-700 dark:fill-slate-300">Dispo.</text>

                  {/* Flux vers enveloppes */}
                  <path d="M 210 60 Q 280 30 340 30" fill="none" stroke="#8b5cf6" strokeWidth="8" opacity="0.4" />
                  <path d="M 210 75 Q 280 75 340 75" fill="none" stroke="#ec4899" strokeWidth="8" opacity="0.4" />
                  <path d="M 210 90 Q 280 120 340 120" fill="none" stroke="#f59e0b" strokeWidth="8" opacity="0.4" />

                  {/* Enveloppes */}
                  <rect x="340" y="20" width="20" height="20" fill="#8b5cf6" rx="2" />
                  <rect x="340" y="65" width="20" height="20" fill="#ec4899" rx="2" />
                  <rect x="340" y="110" width="20" height="20" fill="#f59e0b" rx="2" />
                </svg>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Aperçu simplifié du diagramme Sankey</p>
              </div>
            </StepCard>
          </div>
        </div>
      </section>

      {/* Section : Démo LIVE du diagramme Sankey */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <DemoSankeyChart />

          {/* CTA après la démo */}
          <div className="text-center mt-12">
            <Link
              href="/home"
              className="inline-flex items-center gap-3 px-8 md:px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <span>Créer mon propre budget</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">
              Testez avec vos propres chiffres en moins de 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Section : Toutes les fonctionnalités */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Toutes les fonctionnalités
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
              Un outil complet pour gérer vos finances personnelles
            </p>
          </div>

          {/* Gestion du budget */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
              <span className="text-3xl">📊</span>
              Gestion du budget
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                color="emerald"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                title="Revenus et dépenses multiples"
                description="Ajoutez autant de sources de revenus et de dépenses fixes que nécessaire pour refléter votre situation réelle."
              />
              <FeatureCard
                color="blue"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>}
                title="Enveloppes flexibles"
                description="Créez vos enveloppes en pourcentage du reste disponible ou en montant fixe selon vos besoins."
              />
              <FeatureCard
                color="purple"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                title="Normalisation automatique"
                description="Ajustez automatiquement vos pourcentages pour qu'ils totalisent 100% en un clic."
              />
              <FeatureCard
                color="pink"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Validation en temps réel"
                description="Vérification instantanée de la cohérence de votre budget pendant que vous le créez."
              />
            </div>
          </div>

          {/* Visualisation avancée */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
              <span className="text-3xl">📈</span>
              Visualisation avancée
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                color="indigo"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
                title="Diagramme Sankey interactif"
                description="Visualisez vos flux financiers avec un graphique interactif qui montre le parcours de chaque euro."
              />
              <FeatureCard
                color="emerald"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                title="Résumés financiers"
                description="Consultez des résumés clairs avec tous vos totaux : revenus, dépenses, disponible, solde final."
              />
              <FeatureCard
                color="blue"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                title="Plans mensuels multiples"
                description="Créez et gérez plusieurs plans mensuels pour suivre l'évolution de vos finances dans le temps."
              />
            </div>
          </div>

          {/* Données et sauvegarde */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
              <span className="text-3xl">💾</span>
              Données et sauvegarde
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                color="purple"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                title="Stockage local sécurisé"
                description="Vos données restent sur votre appareil avec IndexedDB, aucun serveur externe requis en mode local."
              />
              <FeatureCard
                color="blue"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                title="Synchronisation cloud gratuite"
                description="Créez un compte gratuit pour synchroniser vos plans sur tous vos appareils automatiquement."
              />
              <FeatureCard
                color="indigo"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
                title="Export/Import JSON"
                description="Exportez vos plans en JSON pour les sauvegarder ou les partager, puis réimportez-les facilement."
              />
              <FeatureCard
                color="emerald"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                title="Aucune perte de données"
                description="Vos plans sont sauvegardés automatiquement à chaque modification, impossible de perdre vos données."
              />
            </div>
          </div>

          {/* Expérience utilisateur */}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              Expérience utilisateur
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                color="pink"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                title="PWA installable"
                description="Installez l'application sur votre mobile, tablette ou ordinateur comme une app native."
              />
              <FeatureCard
                color="orange"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>}
                title="Stockage local performant"
                description="Vos données sont stockées localement sur votre appareil avec IndexedDB pour un accès instantané."
              />
              <FeatureCard
                color="indigo"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                title="Thème sombre/clair"
                description="Basculez entre le mode sombre et clair selon vos préférences et conditions de luminosité."
              />
              <FeatureCard
                color="blue"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                title="Tutoriel interactif"
                description="Un guide pas à pas pour vous accompagner lors de votre première utilisation de l'application."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section : Choisissez votre mode de sauvegarde */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Choisissez votre mode de sauvegarde
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Les deux modes sont 100% gratuits. C&apos;est vous qui décidez comment gérer vos données.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <ModeCard
              icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>}
              title="Mode local"
              description="Vos données restent sur votre appareil"
              bgColor="bg-purple-600 dark:bg-purple-700"
              features={[
                'Aucun compte requis',
                'Données 100% privées sur votre appareil',
                'Stockage local sécurisé (IndexedDB)',
                'Export/Import manuel au format JSON',
                'Confidentialité maximale',
              ]}
            />

            <ModeCard
              badge="RECOMMANDÉ"
              icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
              title="Mode cloud"
              description="Synchronisation gratuite sur tous vos appareils"
              bgColor="bg-blue-600 dark:bg-blue-700"
              features={[
                'Création de compte gratuite',
                'Synchronisation automatique multi-appareils',
                'Sauvegarde sécurisée dans le cloud',
                'Accès depuis mobile, tablette, ordinateur',
                'Aucun frais, jamais',
              ]}
            />
          </div>

          <div className="mt-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 md:p-8 border-l-4 border-emerald-500">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 mb-2">
                  Passez facilement d&apos;un mode à l&apos;autre
                </h3>
                <p className="text-emerald-800 dark:text-emerald-400 leading-relaxed">
                  Vous pouvez commencer en mode local puis créer un compte plus tard pour synchroniser vos données.
                  Lors de la création de votre compte, l&apos;application vous proposera d&apos;importer automatiquement vos plans locaux vers le cloud.
                  Vous gardez toujours le contrôle de vos données.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section : Pourquoi Moneto ? */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Pourquoi choisir Moneto ?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-600 dark:bg-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-4xl">🔒</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Confidentialité
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Vos données vous appartiennent. En mode local, elles ne quittent jamais votre appareil.
                En mode cloud, elles sont chiffrées et sécurisées.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 dark:bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                100% Gratuit
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Toutes les fonctionnalités sont gratuites, y compris la synchronisation cloud.
                Pas de pub, pas de frais cachés, jamais.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 dark:bg-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Partout
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                PWA installable sur mobile, tablette et desktop. Une seule application pour tous vos appareils.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-600 dark:bg-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-4xl">⚡</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Rapide
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Réactivité instantanée, calculs en temps réel. Interface fluide optimisée pour tous les appareils.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section : Bandeau Beta Warning */}
      <section className="px-6 md:px-12 lg:px-24 py-8 bg-yellow-50 dark:bg-yellow-900/20 border-y border-yellow-200 dark:border-yellow-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-300 mb-2">
                Application en phase de test
              </h3>
              <p className="text-yellow-800 dark:text-yellow-400 leading-relaxed">
                L&apos;application est actuellement en phase de test et subit des mises à jour fréquentes.
                Vos données locales peuvent être supprimées lors des mises à jour.
                Nous vous recommandons d&apos;exporter régulièrement vos plans au format JSON pour les sauvegarder.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final + Footer */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24 bg-emerald-600 dark:bg-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Prêt à prendre le contrôle de vos finances ?
          </h2>
          <p className="text-xl md:text-2xl text-emerald-100 mb-10 leading-relaxed">
            Commencez dès maintenant, c&apos;est gratuit et ça le restera toujours
          </p>

          <Link
            href="/home"
            className="inline-flex items-center gap-3 px-10 md:px-14 py-5 md:py-6 bg-white text-emerald-600 text-xl md:text-2xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 active:scale-95 mb-6"
          >
            <span>Commencer maintenant</span>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <p className="text-white/90 text-sm mb-12">
            Aucune carte bancaire • Aucun engagement • Installation en 2 clics
          </p>

          {/* Footer */}
          <div className="pt-8 border-t border-white/20">
            <p className="text-white/80 text-sm mb-2">
              Application créée avec passion par
            </p>
            <p className="text-xl font-bold text-white">
              Erwan GUEZINGAR
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
