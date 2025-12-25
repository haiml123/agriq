"use client";

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useApp } from '@/providers/app-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertsHeader } from './alerts-header';
import { AlertsFilters } from './alerts-filters';
import { AlertsTable } from './alerts-table';
import { useAlertsFilters } from './hooks/use-alerts-filters';
import { useAlertsData, useOrganizations, useUsers, useSites } from './hooks/use-alerts-data';

export function AlertsPage() {
  const t = useTranslations('pages.alerts');
  const { user, isSuperAdmin, isAdmin, isOperator } = useApp();

  const filters = useAlertsFilters();

  const { organizations } = useOrganizations();
  const { users } = useUsers(filters.organizationFilter, isSuperAdmin, isAdmin, user);
  const { sites } = useSites(filters.organizationFilter, isSuperAdmin, isAdmin, isOperator, user);

  const { alerts, loading, handleAcknowledge, handleStatusChange } = useAlertsData({
    statusFilter: filters.statusFilter,
    severityFilter: filters.severityFilter,
    timeFilter: filters.timeFilter,
    organizationFilter: filters.organizationFilter,
    userFilter: filters.userFilter,
    siteFilter: filters.siteFilter,
  });

  // Reset site filter when organization changes
  useEffect(() => {
    filters.setSiteFilter('all');
  }, [filters.organizationFilter]);

  // Reset user filter when organization changes
  useEffect(() => {
    if (isSuperAdmin && filters.organizationFilter !== 'all') {
      filters.setUserFilter('all');
    }
  }, [filters.organizationFilter, isSuperAdmin]);

  return (
    <div className="min-h-screen bg-background p-6">
      <AlertsHeader />

      <AlertsFilters
        isSuperAdmin={isSuperAdmin}
        isAdmin={isAdmin}
        organizations={organizations}
        users={users}
        sites={sites}
        {...filters}
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('noAlerts')}
            </div>
          ) : (
            <AlertsTable
              alerts={alerts}
              onAcknowledge={handleAcknowledge}
              onStatusChange={handleStatusChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
