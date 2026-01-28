'use client';

import { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTranslationApi } from '@/hooks/use-translation-api';
import type { Translation } from '@/schemas/translation.schema';

interface AppContextType {
  locale: string;
  isRTL: boolean;
  user: any;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  userOrganization: any;
  translationMap: Record<string, string>;
  translationsLoaded: boolean;
  translateEntity: (entity: string, entityId: string, field: string, fallback?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const locale = useLocale();
  const isRTL = locale === 'he' || locale === 'ar';
  const { user, isSuperAdmin, isAdmin, isOperator, isLoading: isUserLoading } = useCurrentUser();
  const userOrganization = user?.organization || null;
  const { getList: getTranslations } = useTranslationApi();
  const [translationMap, setTranslationMap] = useState<Record<string, string>>({});
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  const translationEntities = useMemo(() => ['commodity_type'], []);

  useEffect(() => {
    let isActive = true;
    const loadTranslations = async () => {
      if (isUserLoading || !user) return;
      setTranslationsLoaded(false);
      try {
        const responses = await Promise.all(
          translationEntities.map((entity) =>
            getTranslations({ entity, locale })
          )
        );
        const nextMap: Record<string, string> = {};
        responses.forEach((response) => {
          const items = response?.data ?? [];
          items.forEach((translation: Translation) => {
            const key = `${translation.entity}::${translation.entityId}::${translation.field}`;
            nextMap[key] = translation.text;
          });
        });
        if (isActive) {
          setTranslationMap(nextMap);
          setTranslationsLoaded(true);
        }
      } catch (error) {
        if (isActive) {
          setTranslationMap({});
          setTranslationsLoaded(true);
        }
      }
    };

    loadTranslations();
    return () => {
      isActive = false;
    };
  }, [getTranslations, isUserLoading, locale, translationEntities, user]);

  const translateEntity = (entity: string, entityId: string, field: string, fallback?: string) => {
    const key = `${entity}::${entityId}::${field}`;
    return translationMap[key] ?? fallback ?? '';
  };

  const value: AppContextType = {
    locale,
    isRTL,
    user,
    isSuperAdmin,
    isAdmin,
    isOperator,
    userOrganization,
    translationMap,
    translationsLoaded,
    translateEntity,
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
