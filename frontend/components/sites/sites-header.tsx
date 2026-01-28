import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SitesHeaderProps {
  onAddCommodity: () => void;
}

export function SitesHeader({ onAddCommodity }: SitesHeaderProps) {
  const t = useTranslations('sites');

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">
        {/*{t('title')}*/}
      </h1>
      <div className="flex items-center gap-2">
        <Button className="gap-2" onClick={onAddCommodity}>
          <Plus className="h-4 w-4" />
          {t('addCommodityButton')}
        </Button>
      </div>
    </div>
  );
}
