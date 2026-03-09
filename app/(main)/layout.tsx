'use client';

import { TutorialProvider } from '@/context/TutorialContext';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import SyncIndicator from '@/components/sync/SyncIndicator';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TutorialProvider>
      {children}
      <TutorialOverlay />
      <SyncIndicator />
    </TutorialProvider>
  );
}
