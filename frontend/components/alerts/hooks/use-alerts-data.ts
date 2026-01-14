import { useState, useEffect } from 'react';
import { useApp } from '@/providers/app-provider';
import { useAlertApi } from '@/hooks/use-alert-api';
import { useOrganizationApi } from '@/hooks/use-organization-api';
import { useUserApi } from '@/hooks/use-user-api';
import { useSiteApi } from '@/hooks/use-site-api';
import type { ApiAlert, StatusFilter } from '../types';
import { getTimeFilterDate } from '../utils/alert-utils';

interface UseAlertsDataParams {
  statusFilter: StatusFilter;
  severityFilter: string;
  timeFilter: string;
  organizationFilter: string;
  userFilter: string;
  siteFilter: string;
}

export function useAlertsData(filters: UseAlertsDataParams) {
  const { user, isSuperAdmin, isAdmin, isOperator } = useApp();
  const { getList: getAlerts, acknowledge } = useAlertApi();
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [
    filters.statusFilter,
    filters.severityFilter,
    filters.timeFilter,
    filters.organizationFilter,
    filters.userFilter,
    filters.siteFilter,
  ]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params: any = {};

      // Status filter
      if (filters.statusFilter === 'all') {
        params.status = 'all';
      } else {
        params.status = filters.statusFilter;
      }

      // Severity filter
      if (filters.severityFilter !== 'all') {
        params.severity = filters.severityFilter;
      }

      // Time filter
      const startDate = getTimeFilterDate(filters.timeFilter);
      if (startDate) {
        params.startDate = startDate;
      }

      // Organization filter
      if (isSuperAdmin && filters.organizationFilter !== 'all') {
        params.organizationId = filters.organizationFilter;
      } else if (isAdmin && user?.organizationId) {
        params.organizationId = user.organizationId;
      }

      // User filter
      if (filters.userFilter !== 'all') {
        params.userId = filters.userFilter;
      }

      // Site filter
      if (filters.siteFilter !== 'all') {
        params.siteId = filters.siteFilter;
      } else if (isOperator && user?.siteUsers) {
        const userSiteIds = user.siteUsers.map((su: any) => su.siteId);
        if (userSiteIds.length > 0) {
          params.siteId = userSiteIds.join(',');
        }
      }

      const response = await getAlerts(params);
      let fetchedAlerts = response?.data || [];

      // Client-side filtering for operators
      if (isOperator && user?.siteUsers && filters.siteFilter === 'all') {
        const userSiteIds = user.siteUsers.map((su: any) => su.siteId);
        fetchedAlerts = fetchedAlerts.filter((alert: ApiAlert) => {
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
      await loadAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  return {
    alerts,
    loading,
    handleAcknowledge,
    reloadAlerts: loadAlerts,
  };
}

export function useOrganizations() {
  const { getList: getOrganizations } = useOrganizationApi();
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    loadOrganizations();
  }, []);

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

  return { organizations };
}

export function useUsers(organizationFilter: string, isSuperAdmin: boolean, isAdmin: boolean, user: any) {
  const { getList: getUsers } = useUserApi();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, [organizationFilter]);

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

  return { users };
}

export function useSites(organizationFilter: string, isSuperAdmin: boolean, isAdmin: boolean, isOperator: boolean, user: any) {
  const { getSites } = useSiteApi();
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    loadSites();
  }, [organizationFilter]);

  const loadSites = async () => {
    try {
      const response = await getSites();
      const allSites = response?.data || [];

      if (!Array.isArray(allSites)) {
        setSites([]);
        return;
      }

      let filteredSites = allSites;

      if (isOperator && user?.siteUsers) {
        const userSiteIds = user.siteUsers.map((su: any) => su.siteId);
        filteredSites = allSites.filter((site: any) => userSiteIds.includes(site.id));
      } else if (isAdmin && user?.organizationId) {
        filteredSites = allSites.filter((site: any) => site.organizationId === user.organizationId);
      } else if (isSuperAdmin && organizationFilter !== 'all') {
        filteredSites = allSites.filter((site: any) => site.organizationId === organizationFilter);
      }

      setSites(filteredSites);
    } catch (error) {
      console.error('Failed to load sites:', error);
      setSites([]);
    }
  };

  return { sites };
}
