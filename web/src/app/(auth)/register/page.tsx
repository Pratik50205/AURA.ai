'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    // Redirect to login page with register mode
    router.push(`/login?mode=register&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [router, callbackUrl]);

  return null;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="flex items-center gap-3 text-muted">
          <div className="w-6 h-6 border-2 border-aura-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Redirecting...</span>
        </div>
      </div>
    }>
      <RegisterRedirect />
    </Suspense>
  );
}