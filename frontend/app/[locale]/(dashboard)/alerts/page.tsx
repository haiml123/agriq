"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAlertApi } from '@/hooks/use-alert-api';
import { useOrganizationApi } from '@/hooks/use-organization-api';
import { useUserApi } from '@/hooks/use-user-api';
import { useSiteApi } from '@/hooks/use-site-api';
import { useApp } from '@/providers/app-provider';
import { format } from 'date-fns';
import { ApiAlert } from '@/schemas/alert.schema';
import { RoleTypeEnum, SeverityEnum, AlertStatusEnum } from '@/schemas/common.schema';

type StatusFilter = 'all' | 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS';
type SeverityFilter = 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TimeFilter = 'all' | '24h' | '7d' | '30d' | '90d';

export default function AlertsPage() {
  const t = useTranslations('pages.alerts');
  const tSeverity = useTranslations('severity');
  const tStatus = useTranslations('alertStatus');
  const tCommon = useTranslations('common');

  const { user, isSuperAdmin, isAdmin, isOperator, isRTL } = useApp();
  const { getList: getAlerts, acknowledge, updateStatus } = useAlertApi();
  const { getList: getOrganizations } = useOrganizationApi();
  const { getList: getUsers } = useUserApi();
  const { getSites } = useSiteApi();

  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<string>('all');

  // Data for dropdowns
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  // Load organizations (super admin only)
  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
    }
  }, [isSuperAdmin]);

  // Load users (super admin and admin)
  useEffect(() => {
    if (isSuperAdmin || isAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin, isAdmin, organizationFilter]);

  // Load sites when organization filter changes
  useEffect(() => {
    loadSites();
    // Reset site filter when organization changes
    setSiteFilter('all');
  }, [organizationFilter]);

  // Reset user filter when organization changes
  useEffect(() => {
    if (isSuperAdmin && organizationFilter !== 'all') {
      setUserFilter('all');
    }
  }, [organizationFilter, isSuperAdmin]);

  // Load alerts
  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter, timeFilter, organizationFilter, userFilter, siteFilter]);

  const loadOrganizations = async () => {
    try {
      const response = await getOrganizations();
      const orgs = response?.data?.items || [];
      setOrganizations(Array.isArray(orgs) ? orgs : []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      setOrganizations([]);
    }
  };

  const loadUsers = async () => {
    try {
      const params: any = {};
      if (isAdmin && user?.organizationId) {
        params.organizationId = user.organizationId;
      } else if (isSuperAdmin && organizationFilter !== 'all') {
        params.organizationId = organizationFilter;
      }
      const response = await getUsers(params);
      const usersData = response?.data?.items || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const loadSites = async () => {
    try {
      const response = await getSites();
      const allSites = response?.data || [];

      // Ensure allSites is an array
      if (!Array.isArray(allSites)) {
        setSites([]);
        return;
      }

      // Filter sites based on user role
      let filteredSites = allSites;

      if (isOperator && user?.siteUsers) {
        // Operator: only show sites they're registered to
        const userSiteIds = user.siteUsers.map((su: any) => su.siteId);
        filteredSites = allSites.filter((site: any) => userSiteIds.includes(site.id));
      } else if (isAdmin && user?.organizationId) {
        // Admin: only show sites in their organization
        filteredSites = allSites.filter((site: any) => site.organizationId === user.organizationId);
      } else if (isSuperAdmin && organizationFilter !== 'all') {
        // Super admin with org filter: show sites in selected org
        filteredSites = allSites.filter((site: any) => site.organizationId === organizationFilter);
      }

      setSites(filteredSites);
    } catch (error) {
      console.error('Failed to load sites:', error);
      setSites([]);
    }
  };

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params: any = {};

      // Status filter - send 'all' explicitly to show all alerts
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      } else {
        params.status = 'all';
      }

      // Severity filter
      if (severityFilter !== 'all') {
        params.severity = severityFilter;
      }

      // Time filter
      if (timeFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (timeFilter) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = now;
        }

        params.startDate = startDate.toISOString();
      }

      // Organization filter (super admin only)
      if (isSuperAdmin && organizationFilter !== 'all') {
        params.organizationId = organizationFilter;
      } else if (isAdmin && user?.organizationId) {
        params.organizationId = user.organizationId;
      }

      // User filter
      if (userFilter !== 'all') {
        params.userId = userFilter;
      }

      // Site filter
      if (siteFilter !== 'all') {
        params.siteId = siteFilter;
      } else if (isOperator && user?.siteUsers) {
        // For operators, only show alerts for their sites
        // If backend doesn't support multiple siteIds, we'll filter client-side
        const userSiteIds = user.siteUsers.map((su: any) => su.siteId);
        if (userSiteIds.length > 0) {
          // We'll filter these client-side after fetching
          params.siteId = userSiteIds.join(','); // Assuming backend can handle comma-separated
        }
      }

      const response = await getAlerts(params);
      let fetchedAlerts = response?.data || [];

      // Client-side filtering for operators if needed
      if (isOperator && user?.siteUsers && siteFilter === 'all') {
        const userSiteIds = user.siteUsers.map((su: any) => su.siteId);
        fetchedAlerts = fetchedAlerts.filter((alert: ApiAlert) => {
          // Check if alert's site is in user's sites
          return alert.site && userSiteIds.includes(alert.site.id);
        });
      }

      setAlerts(fetchedAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledge(alertId);
      // Refresh alerts
      await loadAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await updateStatus(alertId, newStatus);
      // Refresh alerts
      await loadAlerts();
    } catch (error) {
      console.error('Failed to update alert status:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 hover:bg-red-600';
      case 'HIGH':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'MEDIUM':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'LOW':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'ACKNOWLEDGED':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'IN_PROGRESS':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'RESOLVED':
        return 'bg-green-500 hover:bg-green-600';
      case 'DISMISSED':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Organization selector - Super Admin only */}
            {isSuperAdmin && (
              <div className="flex flex-col w-48">
                <label className="text-sm font-medium mb-2">{t('organization')}</label>
                <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allOrganizations')}</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Site selector */}
            <div className="flex flex-col w-48">
              <label className="text-sm font-medium mb-2">{t('site')}</label>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allSites')}</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User selector - Super Admin and Admin */}
            {(isSuperAdmin || isAdmin) && (
              <div className="flex flex-col w-48">
                <label className="text-sm font-medium mb-2">{t('user')}</label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allUsers')}</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Severity filter */}
            <div className="flex flex-col w-44">
              <label className="text-sm font-medium mb-2">{t('severity')}</label>
              <Select value={severityFilter} onValueChange={(val) => setSeverityFilter(val as SeverityFilter)}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allSeverities')}</SelectItem>
                  <SelectItem value="CRITICAL">{tSeverity('CRITICAL')}</SelectItem>
                  <SelectItem value="HIGH">{tSeverity('HIGH')}</SelectItem>
                  <SelectItem value="MEDIUM">{tSeverity('MEDIUM')}</SelectItem>
                  <SelectItem value="LOW">{tSeverity('LOW')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time filter */}
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

          {/* Status tabs */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              {t('allAlerts')}
            </Button>
            <Button
              variant={statusFilter === 'OPEN' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('OPEN')}
              size="sm"
            >
              {tStatus('OPEN')}
            </Button>
            <Button
              variant={statusFilter === 'ACKNOWLEDGED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('ACKNOWLEDGED')}
              size="sm"
            >
              {tStatus('ACKNOWLEDGED')}
            </Button>
            <Button
              variant={statusFilter === 'IN_PROGRESS' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('IN_PROGRESS')}
              size="sm"
            >
              {tStatus('IN_PROGRESS')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('noAlerts')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('severity')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('site')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('cell')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('description')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('trigger')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('created')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : ''}>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell className={isRTL ? 'text-right' : ''}>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {tSeverity(alert.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell className={isRTL ? 'text-right' : ''}>{alert.site?.name || '-'}</TableCell>
                    <TableCell className={isRTL ? 'text-right' : ''}>{alert.cell?.name || '-'}</TableCell>
                    <TableCell className={isRTL ? 'text-right max-w-md' : 'max-w-md'}>
                      <div>
                        {alert.title && <div className="font-medium">{alert.title}</div>}
                        <div className="text-sm text-muted-foreground">{alert.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className={isRTL ? 'text-right' : ''}>{alert.commodity?.name || '-'}</TableCell>
                    <TableCell className={isRTL ? 'text-right' : ''}>
                      {format(new Date(alert.startedAt), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className={isRTL ? 'text-right' : ''}>
                      <Badge className={getStatusColor(alert.status)}>
                        {tStatus(alert.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {alert.status === 'OPEN' && (
                            <>
                              <DropdownMenuItem onClick={() => handleAcknowledge(alert.id)}>
                                {t('acknowledge')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, 'IN_PROGRESS')}>
                                {t('startInvestigating')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, 'DISMISSED')}>
                                {t('dismiss')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {alert.status === 'ACKNOWLEDGED' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, 'IN_PROGRESS')}>
                                {t('startInvestigating')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, 'DISMISSED')}>
                                {t('dismiss')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {alert.status === 'IN_PROGRESS' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, 'RESOLVED')}>
                                {t('resolve')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, 'DISMISSED')}>
                                {t('dismiss')}
                              </DropdownMenuItem>
                            </>
                          )}
                          {(alert.status === 'RESOLVED' || alert.status === 'DISMISSED') && (
                            <DropdownMenuItem onClick={() => handleStatusChange(alert.id, 'OPEN')}>
                              {t('reopenAlert')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
