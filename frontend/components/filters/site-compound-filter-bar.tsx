'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CellSelectSite } from '@/components/ui/cell-select';
import type { ReactNode } from 'react';
import { resolveLocaleText } from '@/utils/locale';

interface SiteCompoundFilterBarProps {
  sites: CellSelectSite[];
  selectedSiteId: string;
  selectedCompoundId: string;
  onSiteChange: (siteId: string) => void;
  onCompoundChange: (compoundId: string) => void;
  includeAllSites?: boolean;
  children?: ReactNode;
}

export function SiteCompoundFilterBar({
  sites,
  selectedSiteId,
  selectedCompoundId,
  onSiteChange,
  onCompoundChange,
  includeAllSites = false,
  children,
}: SiteCompoundFilterBarProps) {
  const t = useTranslations('sites');
  const locale = useLocale();
  const selectedSite = sites.find((site) => site.id === selectedSiteId);
  const compounds = selectedSite?.compounds || [];

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="space-y-2 w-full lg:w-56">
          <label className="text-sm font-medium">{t('site')}</label>
          <Select value={selectedSiteId} onValueChange={onSiteChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('selectSite')} />
            </SelectTrigger>
            <SelectContent>
              {includeAllSites && (
                <SelectItem value="all">{t('allSites')}</SelectItem>
              )}
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {resolveLocaleText(site.locale, locale, site.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 w-full lg:w-56">
          <label className="text-sm font-medium">{t('compound')}</label>
          <Select
            value={selectedCompoundId}
            onValueChange={onCompoundChange}
            disabled={!selectedSiteId || selectedSiteId === 'all'}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('selectCompound')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allCompounds')}</SelectItem>
              {compounds.map((compound) => (
                <SelectItem key={compound.id} value={compound.id}>
                  {resolveLocaleText(compound.locale, locale, compound.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {children}
      </div>
    </div>
  );
}
