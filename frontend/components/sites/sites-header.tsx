import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown, Plus } from 'lucide-react';

interface SitesHeaderProps {
  onAddCommodity: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export function SitesHeader({ onAddCommodity, onExportCsv, onExportPdf }: SitesHeaderProps) {
  const t = useTranslations('sites');

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">
        {/*{t('title')}*/}
      </h1>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" aria-label={t('exportButton')}>
              <FileDown className="h-4 w-4" />
              {t('exportButton')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="w-[var(--radix-dropdown-menu-trigger-width)]"
          >
            <DropdownMenuItem onClick={onExportCsv}>CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPdf}>PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="gap-2" onClick={onAddCommodity}>
          <Plus className="h-4 w-4" />
          {t('addCommodityButton')}
        </Button>
      </div>
    </div>
  );
}
