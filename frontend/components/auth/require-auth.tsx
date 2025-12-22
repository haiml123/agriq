'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthLoading } from './auth-loading';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return <AuthLoading />;
  }

  // Don't render anything while redirecting
  if (status === 'unauthenticated') {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
