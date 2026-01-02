'use client';

import { useEffect, useState } from 'react';
import { useDashboardData } from './hooks/use-dashboard-data';
import { ActiveAlertsSection } from './sections/active-alerts-section';
import { RecentCommoditiesSection } from './sections/recent-commodities-section';
import { SiteCompoundFilterBar } from '@/components/filters/site-compound-filter-bar';
import { useSitesData } from '@/components/sites/hooks/use-sites-data';

export function DashboardPage() {
  const { sites } = useSitesData();
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedCompoundId, setSelectedCompoundId] = useState('all');
  const { activeAlerts, recentCommodities, isLoadingAlerts, isLoadingTrades } = useDashboardData({
    siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
    compoundId: selectedCompoundId !== 'all' ? selectedCompoundId : undefined,
  });

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    setSelectedCompoundId('all');
  };

  useEffect(() => {
    if (selectedSiteId === 'all') {
      setSelectedCompoundId('all');
    }
  }, [selectedSiteId]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <SiteCompoundFilterBar
          sites={sites}
          selectedSiteId={selectedSiteId}
          selectedCompoundId={selectedCompoundId}
          onSiteChange={handleSiteChange}
          onCompoundChange={setSelectedCompoundId}
          includeAllSites={true}
        />
        <ActiveAlertsSection alerts={activeAlerts} isLoading={isLoadingAlerts} />
        <RecentCommoditiesSection commodities={recentCommodities} isLoading={isLoadingTrades} />
      </div>
    </div>
  );
}
