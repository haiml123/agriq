'use client';

import { useDashboardData } from './hooks/use-dashboard-data';
import { ActiveAlertsSection } from './sections/active-alerts-section';
import { RecentCommoditiesSection } from './sections/recent-commodities-section';

export function DashboardPage() {
  const { activeAlerts, recentCommodities, isLoadingAlerts, isLoadingTrades } = useDashboardData();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <ActiveAlertsSection alerts={activeAlerts} isLoading={isLoadingAlerts} />
        <RecentCommoditiesSection commodities={recentCommodities} isLoading={isLoadingTrades} />
      </div>
    </div>
  );
}
