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

  const {
    statusFilter,
    severityFilter,
    timeFilter,
    organizationFilter,
    userFilter,
    siteFilter,
    setStatusFilter,
    setSeverityFilter,
    setTimeFilter,
    setOrganizationFilter,
    setUserFilter,
    setSiteFilter,
  } = useAlertsFilters();

  const { organizations } = useOrganizations();
  const { users } = useUsers(organizationFilter, isSuperAdmin, isAdmin, user);
  const { sites } = useSites(organizationFilter, isSuperAdmin, isAdmin, isOperator, user);

  const { alerts, loading, handleAcknowledge } = useAlertsData({
    statusFilter,
    severityFilter,
    timeFilter,
    organizationFilter,
    userFilter,
    siteFilter,
  });

  // Reset site filter when organization changes
  useEffect(() => {
    setSiteFilter('all');
  }, [organizationFilter, setSiteFilter]);

  // Reset user filter when organization changes
  useEffect(() => {
    if (isSuperAdmin && organizationFilter !== 'all') {
      setUserFilter('all');
    }
  }, [organizationFilter, isSuperAdmin, setUserFilter]);

  return (
    <div className="min-h-screen bg-background p-6">
      {/*<AlertsHeader />*/}

      <AlertsFilters
        isSuperAdmin={isSuperAdmin}
        isAdmin={isAdmin}
        organizations={organizations}
        users={users}
        sites={sites}
        statusFilter={statusFilter}
        severityFilter={severityFilter}
        timeFilter={timeFilter}
        organizationFilter={organizationFilter}
        userFilter={userFilter}
        siteFilter={siteFilter}
        setStatusFilter={setStatusFilter}
        setSeverityFilter={setSeverityFilter}
        setTimeFilter={setTimeFilter}
        setOrganizationFilter={setOrganizationFilter}
        setUserFilter={setUserFilter}
        setSiteFilter={setSiteFilter}
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
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
