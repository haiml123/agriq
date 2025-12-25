import { useState } from 'react';
import type { StatusFilter, SeverityFilter, TimeFilter } from '../types';

export function useAlertsFilters() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<string>('all');

  return {
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
  };
}
