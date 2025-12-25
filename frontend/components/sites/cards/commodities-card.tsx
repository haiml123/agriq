import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Trade } from '../types';

interface CommoditiesCardProps {
  trades: Trade[];
}

export function CommoditiesCard({ trades }: CommoditiesCardProps) {
  const t = useTranslations('sites');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('commoditiesInCell')}</CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noDataAvailable')}</p>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <div key={trade.id} className="border-b border-border pb-4 last:border-0">
                <h4 className="font-medium">
                  {trade.commodity.commodityType?.name ||
                    trade.commodity.name ||
                    'Unknown'}
                </h4>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    {t('location')}: {trade.commodity.origin || 'N/A'}
                  </p>
                  <p>
                    {t('quantity')}: {trade.amountKg.toLocaleString()} kg
                  </p>
                  <p>
                    {t('arrivalDate')}:{' '}
                    {format(new Date(trade.tradedAt), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
