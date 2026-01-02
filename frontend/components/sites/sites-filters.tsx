import { useTranslations } from 'next-intl';
import { CellSelect, type CellSelectSite } from '@/components/ui/cell-select';
import { DateRangeSelector } from './date-range-selector';
import { SiteCompoundFilterBar } from '@/components/filters/site-compound-filter-bar';
import type { DateRange } from './types';

interface SitesFiltersProps {
  sites: CellSelectSite[];
  selectedSiteId: string;
  selectedCompoundId: string;
  selectedCellIds: string[];
  dateRange: DateRange;
  customStartDate: string;
  customEndDate: string;
  onSiteChange: (siteId: string) => void;
  onCompoundChange: (compoundId: string) => void;
  onCellSelectionChange: (cellIds: string[]) => void;
  onDateRangeChange: (range: DateRange) => void;
  onCustomStartDateChange: (date: string) => void;
  onCustomEndDateChange: (date: string) => void;
}

export function SitesFilters({
  sites,
  selectedSiteId,
  selectedCompoundId,
  selectedCellIds,
  dateRange,
  customStartDate,
  customEndDate,
  onSiteChange,
  onCompoundChange,
  onCellSelectionChange,
  onDateRangeChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: SitesFiltersProps) {
  const t = useTranslations('sites');

  return (
    <SiteCompoundFilterBar
      sites={sites}
      selectedSiteId={selectedSiteId}
      selectedCompoundId={selectedCompoundId}
      onSiteChange={onSiteChange}
      onCompoundChange={onCompoundChange}
    >
      <div className="space-y-2 w-full lg:w-56">
        <label className="text-sm font-medium">{t('cell')}</label>
        <CellSelect
          sites={sites}
          selectedSiteId={selectedSiteId}
          selectedCompoundId={selectedCompoundId}
          selectedCellIds={selectedCellIds}
          onCellSelectionChange={onCellSelectionChange}
          multiSelect={true}
          disabled={!selectedSiteId}
          placeholder={t('selectCell')}
          disableCompoundToggle={true}
        />
      </div>

      <div className="w-full lg:w-auto">
        <DateRangeSelector
          dateRange={dateRange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onDateRangeChange={onDateRangeChange}
          onCustomStartDateChange={onCustomStartDateChange}
          onCustomEndDateChange={onCustomEndDateChange}
        />
      </div>
    </SiteCompoundFilterBar>
  );
}
