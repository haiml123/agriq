"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useApp } from '@/providers/app-provider';
import { useModal } from '@/components/providers/modal-provider';
import { CommodityModal } from '@/components/modals/commodity.modal';
import { TransferOutModal } from '@/components/modals/transfer-out.modal';
import { SitesHeader } from './sites-header';
import { SitesFilters } from './sites-filters';
import { DateRangeSelector } from './date-range-selector';
import { CellSection } from './cell-section';
import { CellSectionSkeleton } from './skeletons/cell-section-skeleton';
import { useSitesData, useCellsDetails } from './hooks/use-sites-data';
import { useSitesFilters } from './hooks/use-sites-filters';

export function SitesPage() {
  const t = useTranslations('sites');
  const { user } = useApp();
  const modal = useModal();
  const [commodityModalOpen, setCommodityModalOpen] = useState(false);

  // Load sites
  const { sites } = useSitesData();

  // Manage filters
  const filters = useSitesFilters(sites);

  // Load cell details
  const { cellsDetails, loading, reloadCellsDetails } = useCellsDetails(
    filters.selectedCellIds,
    filters.dateRange,
    filters.customStartDate,
    filters.customEndDate
  );

  const handleTransferOut = async () => {
    const result = await modal.open((onClose) => (
      <TransferOutModal onClose={onClose} />
    ));

    if (result) {
      reloadCellsDetails();
    }
  };

  const handleCommoditySuccess = () => {
    setCommodityModalOpen(false);
    reloadCellsDetails();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <SitesHeader
        onAddCommodity={() => setCommodityModalOpen(true)}
        onTransferOut={handleTransferOut}
      />

      <SitesFilters
        sites={sites}
        selectedSiteId={filters.selectedSiteId}
        selectedCellIds={filters.selectedCellIds}
        onSiteChange={filters.handleSiteChange}
        onCellSelectionChange={filters.handleCellSelectionChange}
      />

      {loading ? (
        <CellSectionSkeleton />
      ) : cellsDetails ? (
        <>
          {/* Global Title and Date Range */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {cellsDetails.cells.length} Cell{cellsDetails.cells.length > 1 ? 's' : ''}{' '}
                Selected
              </h2>
              <p className="text-sm text-muted-foreground">
                {cellsDetails.cells.map((c) => c.name).join(', ')}
              </p>
            </div>

            <DateRangeSelector
              dateRange={filters.dateRange}
              customStartDate={filters.customStartDate}
              customEndDate={filters.customEndDate}
              onDateRangeChange={filters.setDateRange}
              onCustomStartDateChange={filters.setCustomStartDate}
              onCustomEndDateChange={filters.setCustomEndDate}
            />
          </div>

          {/* Render cell sections */}
          {cellsDetails.cells.map((cell, index) => (
            <CellSection
              key={cell.id}
              cell={cell}
              cellsDetails={cellsDetails}
              dateRange={filters.dateRange}
              isFirst={index === 0}
            />
          ))}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {t('selectCell')}
        </div>
      )}

      {/* Commodity Modal */}
      <CommodityModal
        open={commodityModalOpen}
        onClose={() => setCommodityModalOpen(false)}
        onSuccess={handleCommoditySuccess}
        organizationId={user?.organizationId || undefined}
      />
    </div>
  );
}
