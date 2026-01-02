import { useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '@/lib/local-storage';
import type { DateRange } from '../types';
import type { CellSelectSite } from '@/components/ui/cell-select';

export function useSitesFilters(sites: CellSelectSite[]) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => {
    return storage.get<string>(STORAGE_KEYS.SITES_SELECTED_SITE) || '';
  });

  const [selectedCompoundId, setSelectedCompoundId] = useState<string>(() => {
    return storage.get<string>(STORAGE_KEYS.SITES_SELECTED_COMPOUND) || 'all';
  });

  const [selectedCellIds, setSelectedCellIds] = useState<string[]>(() => {
    return storage.get<string[]>(STORAGE_KEYS.SITES_SELECTED_CELLS) || [];
  });

  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Pre-select first site if no selection and sites are loaded
  useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      const firstSite = sites[0];
      setSelectedSiteId(firstSite.id);
      setSelectedCompoundId('all');

      // Auto-select all cells from the first site
      const allCellIds = firstSite.compounds?.flatMap((c: any) =>
        c.cells?.map((cell: any) => cell.id) || []
      ) || [];
      setSelectedCellIds(allCellIds);
    }
  }, [sites, selectedSiteId]);

  // Save site selection to local storage
  useEffect(() => {
    if (selectedSiteId) {
      storage.set(STORAGE_KEYS.SITES_SELECTED_SITE, selectedSiteId);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    if (selectedCompoundId) {
      storage.set(STORAGE_KEYS.SITES_SELECTED_COMPOUND, selectedCompoundId);
    }
  }, [selectedCompoundId]);

  // Save cell selection to local storage
  useEffect(() => {
    storage.set(STORAGE_KEYS.SITES_SELECTED_CELLS, selectedCellIds);
  }, [selectedCellIds]);

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    setSelectedCompoundId('all');
    // Auto-select all cells when site changes
    const site = sites.find((s) => s.id === siteId);
    const allCellIds: string[] = [];
    site?.compounds?.forEach((compound) => {
      compound.cells?.forEach((cell) => {
        allCellIds.push(cell.id);
      });
    });
    setSelectedCellIds(allCellIds);
  };

  const handleCompoundChange = (compoundId: string) => {
    setSelectedCompoundId(compoundId);

    const site = sites.find((s) => s.id === selectedSiteId);
    if (!site) {
      setSelectedCellIds([]);
      return;
    }

    if (compoundId === 'all') {
      const allCellIds = site.compounds?.flatMap((compound) =>
        compound.cells?.map((cell) => cell.id) || []
      ) || [];
      setSelectedCellIds(allCellIds);
      return;
    }

    const compound = site.compounds?.find((c) => c.id === compoundId);
    const compoundCellIds = compound?.cells?.map((cell) => cell.id) || [];
    setSelectedCellIds(compoundCellIds);
  };

  const handleCellSelectionChange = (cellIds: string[]) => {
    setSelectedCellIds(cellIds);
  };

  return {
    selectedSiteId,
    selectedCompoundId,
    selectedCellIds,
    dateRange,
    customStartDate,
    customEndDate,
    setSelectedSiteId,
    setSelectedCompoundId,
    setSelectedCellIds,
    setDateRange,
    setCustomStartDate,
    setCustomEndDate,
    handleSiteChange,
    handleCompoundChange,
    handleCellSelectionChange,
  };
}
