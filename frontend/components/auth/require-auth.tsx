'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthLoading } from './auth-loading';
import { useLocale } from 'next-intl';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const locale = useLocale();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace(`/${locale}/login`);
    },
  });

  // Show loading state while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return <AuthLoading />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
