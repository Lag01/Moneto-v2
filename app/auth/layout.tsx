'use client';
import { Suspense } from 'react';

function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AuthLoadingFallback />}>{children}</Suspense>;
}
