import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRightFromLine } from 'lucide-react';

interface SitesHeaderProps {
  onAddCommodity: () => void;
  onTransferOut: () => void;
}

export function SitesHeader({ onAddCommodity, onTransferOut }: SitesHeaderProps) {
  const t = useTranslations('sites');

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="gap-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
          onClick={onTransferOut}
        >
          <ArrowRightFromLine className="h-4 w-4" />
          {t('transferOutButton')}
        </Button>
        <Button className="gap-2" onClick={onAddCommodity}>
          <Plus className="h-4 w-4" />
          {t('addCommodityButton')}
        </Button>
      </div>
    </div>
  );
}
