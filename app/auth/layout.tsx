'use client';
import { Suspense, useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';

function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return <AuthLoadingFallback />;
  }

  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
