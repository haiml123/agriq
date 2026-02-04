import { useState, useEffect } from 'react';
import { useSiteApi } from '@/hooks/use-site-api';
import { useApi } from '@/hooks/use-api';
import type { CellSelectSite } from '@/components/select/cell-select';
import type { MultipleCellsDetails, DateRange } from '../types';
import { getDateRangeParams } from '../utils/date-utils';

export function useSitesData() {
  const { getSites } = useSiteApi();
  const { post } = useApi();
  const [sites, setSites] = useState<CellSelectSite[]>([]);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await getSites();
      const data = response?.data || [];
      setSites(data);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  return { sites, reloadSites: loadSites };
}

export function useCellsDetails(
  selectedCellIds: string[],
  dateRange: DateRange,
  customStartDate: string,
  customEndDate: string
) {
  const { post } = useApi();
  const [cellsDetails, setCellsDetails] = useState<MultipleCellsDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCellIds.length > 0) {
      loadMultipleCellsDetails(selectedCellIds, dateRange, customStartDate, customEndDate);
    } else {
      setCellsDetails(null);
    }
  }, [selectedCellIds, dateRange, customStartDate, customEndDate]);

  const loadMultipleCellsDetails = async (
    cellIds: string[],
    dateRange: DateRange,
    customStartDate: string,
    customEndDate: string
  ) => {
    setLoading(true);
    try {
      const params = getDateRangeParams(dateRange, customStartDate, customEndDate);
      if (!params) {
        setLoading(false);
        return;
      }

      const endpoint = `/sites/cells/details`;
      const response = await post<MultipleCellsDetails>(endpoint, {
        cellIds,
        startDate: params.startDate,
        endDate: params.endDate,
      });

      if (response?.data) {
        setCellsDetails(response.data);
      }
    } catch (error) {
      console.error('Failed to load multiple cells details:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    cellsDetails,
    loading,
    reloadCellsDetails: () =>
      loadMultipleCellsDetails(selectedCellIds, dateRange, customStartDate, customEndDate),
  };
}
