'use client';

import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium shadow-md md:ml-64">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728m2.828 9.9a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072" />
        </svg>
        <span>Vous êtes hors-ligne — les modifications seront synchronisées à la reconnexion</span>
      </div>
    </div>
  );
}
