'use client';

import Navigation from '@/components/Navigation';
import MobileNav from '@/components/MobileNav';
import { useTutorialContext } from '@/context/TutorialContext';

export default function LayoutWithNav({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isActive, isBannerExpanded } = useTutorialContext();

  // Ajuster le padding-bottom en fonction du bandeau de tutoriel
  // - Tutoriel inactif ou bandeau rétracté : pb-20 (80px)
  // - Tutoriel actif et bandeau étendu : pb-72 (~288px)
  const paddingBottom = isActive && isBannerExpanded ? 'pb-72' : 'pb-20';

  return (
    <div className="min-h-screen">
      {/* Navigation desktop (fixe, cachée sur mobile) */}
      <Navigation />

      {/* Navigation mobile (drawer + header) */}
      <MobileNav />

      {/* Main content - margin pour desktop, padding-top pour mobile */}
      <main className={`min-h-screen md:h-screen overflow-y-auto bg-slate-50 dark:bg-slate-900 pt-14 ${paddingBottom} md:pt-0 md:pb-0 md:ml-64`}>
        {children}
      </main>
    </div>
  );
}
