import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StatusFilter, SeverityFilter, TimeFilter } from './types';
import { AlertStatusEnum, SeverityEnum } from './types';

interface AlertsFiltersProps {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  organizations: any[];
  users: any[];
  sites: any[];
  statusFilter: StatusFilter;
  severityFilter: SeverityFilter;
  timeFilter: TimeFilter;
  organizationFilter: string;
  userFilter: string;
  siteFilter: string;
  setStatusFilter: (value: StatusFilter) => void;
  setSeverityFilter: (value: SeverityFilter) => void;
  setTimeFilter: (value: TimeFilter) => void;
  setOrganizationFilter: (value: string) => void;
  setUserFilter: (value: string) => void;
  setSiteFilter: (value: string) => void;
}

export function AlertsFilters({
  isSuperAdmin,
  isAdmin,
  organizations,
  users,
  sites,
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
}: AlertsFiltersProps) {
  const t = useTranslations('pages.alerts');
  const tSeverity = useTranslations('severity');
  const tStatus = useTranslations('alertStatus');

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3 mb-4">
          {isSuperAdmin && (
            <div className="flex flex-col w-48">
              <label className="text-sm font-medium mb-2">{t('organization')}</label>
              <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allOrganizations')}</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col w-48">
            <label className="text-sm font-medium mb-2">{t('site')}</label>
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allSites')}</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(isSuperAdmin || isAdmin) && (
            <div className="flex flex-col w-48">
              <label className="text-sm font-medium mb-2">{t('user')}</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allUsers')}</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col w-44">
            <label className="text-sm font-medium mb-2">{t('severity')}</label>
            <Select value={severityFilter} onValueChange={(val) => setSeverityFilter(val as SeverityFilter)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allSeverities')}</SelectItem>
                <SelectItem value={SeverityEnum.CRITICAL}>{tSeverity('CRITICAL')}</SelectItem>
                <SelectItem value={SeverityEnum.HIGH}>{tSeverity('HIGH')}</SelectItem>
                <SelectItem value={SeverityEnum.MEDIUM}>{tSeverity('MEDIUM')}</SelectItem>
                <SelectItem value={SeverityEnum.LOW}>{tSeverity('LOW')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col w-40">
            <label className="text-sm font-medium mb-2">{t('timeRange')}</label>
            <Select value={timeFilter} onValueChange={(val) => setTimeFilter(val as TimeFilter)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTime')}</SelectItem>
                <SelectItem value="24h">{t('last24Hours')}</SelectItem>
                <SelectItem value="7d">{t('last7Days')}</SelectItem>
                <SelectItem value="30d">{t('last30Days')}</SelectItem>
                <SelectItem value="90d">{t('last90Days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            {t('allAlerts')}
          </Button>
          <Button
            variant={statusFilter === AlertStatusEnum.OPEN ? 'default' : 'outline'}
            onClick={() => setStatusFilter(AlertStatusEnum.OPEN as StatusFilter)}
            size="sm"
          >
            {tStatus(AlertStatusEnum.OPEN)}
          </Button>
          <Button
            variant={statusFilter === AlertStatusEnum.ACKNOWLEDGED ? 'default' : 'outline'}
            onClick={() => setStatusFilter(AlertStatusEnum.ACKNOWLEDGED as StatusFilter)}
            size="sm"
          >
            {tStatus(AlertStatusEnum.ACKNOWLEDGED)}
          </Button>
          <Button
            variant={statusFilter === AlertStatusEnum.IN_PROGRESS ? 'default' : 'outline'}
            onClick={() => setStatusFilter(AlertStatusEnum.IN_PROGRESS as StatusFilter)}
            size="sm"
          >
            {tStatus(AlertStatusEnum.IN_PROGRESS)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
