'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { useCurrentUser } from '@/hooks/use-current-user';

interface AppContextType {
  locale: string;
  isRTL: boolean;
  user: any;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  userOrganization: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const locale = useLocale();
  const isRTL = locale === 'he' || locale === 'ar';
  const { user, isSuperAdmin, isAdmin, isOperator } = useCurrentUser();
  const userOrganization = user?.organization || null;

  const value: AppContextType = {
    locale,
    isRTL,
    user,
    isSuperAdmin,
    isAdmin,
    isOperator,
    userOrganization,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
