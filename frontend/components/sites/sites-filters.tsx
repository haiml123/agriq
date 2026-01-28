import { useLocale, useTranslations } from 'next-intl';
import { CellSelect, type CellSelectSite } from '@/components/ui/cell-select';
import { DateRangeSelector } from './date-range-selector';
import { SiteCompoundFilterBar } from '@/components/filters/site-compound-filter-bar';
import type { DateRange } from './types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown } from 'lucide-react';

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
  onExportCsv: () => void;
  onExportPdf: () => void;
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
  onExportCsv,
  onExportPdf,
}: SitesFiltersProps) {
  const t = useTranslations('sites');
  const locale = useLocale();
  const isRTL = locale === 'he' || locale === 'ar';

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

      <div
        className={`w-full lg:w-auto flex ${
          isRTL ? 'justify-start lg:mr-auto' : 'justify-end lg:ml-auto'
        }`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" aria-label={t('exportButton')}>
              <FileDown className="h-4 w-4" />
              {t('exportButton')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[var(--radix-dropdown-menu-trigger-width)]"
          >
            <DropdownMenuItem onClick={onExportCsv}>CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPdf}>PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SiteCompoundFilterBar>
  );
}
