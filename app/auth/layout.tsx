'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stackClientApp } from '@/stack/client';

function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    stackClientApp.getUser().then((user) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setReady(true);
      }
    });
  }, [router]);

  if (!ready) {
    return <AuthLoadingFallback />;
  }

  return <>{children}</>;
}
