'use client';

import { Suspense } from 'react';
import AuthProvider from '@/components/auth/AuthProvider';
import { TutorialProvider } from '@/context/TutorialContext';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import SyncIndicator from '@/components/sync/SyncIndicator';

function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <AuthProvider>
        <TutorialProvider>
          {children}
          <TutorialOverlay />
          <SyncIndicator />
        </TutorialProvider>
      </AuthProvider>
    </Suspense>
  );
}
