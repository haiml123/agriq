import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CellSelect, type CellSelectSite } from '@/components/ui/cell-select';

interface SitesFiltersProps {
  sites: CellSelectSite[];
  selectedSiteId: string;
  selectedCellIds: string[];
  onSiteChange: (siteId: string) => void;
  onCellSelectionChange: (cellIds: string[]) => void;
}

export function SitesFilters({
  sites,
  selectedSiteId,
  selectedCellIds,
  onSiteChange,
  onCellSelectionChange,
}: SitesFiltersProps) {
  const t = useTranslations('sites');

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Site Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('site')}</label>
          <Select value={selectedSiteId} onValueChange={onSiteChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectSite')} />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cell Multi-Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('cell')}</label>
          <CellSelect
            sites={sites}
            selectedSiteId={selectedSiteId}
            selectedCellIds={selectedCellIds}
            onCellSelectionChange={onCellSelectionChange}
            multiSelect={true}
            disabled={!selectedSiteId}
            placeholder={t('selectCell')}
          />
        </div>
      </div>
    </div>
  );
}
