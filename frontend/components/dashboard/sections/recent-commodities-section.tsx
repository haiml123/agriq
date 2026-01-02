import { useTranslations } from 'next-intl';
import type { DashboardTrade } from '@/schemas/trade.schema';

interface RecentCommoditiesSectionProps {
  commodities: DashboardTrade[];
  isLoading: boolean;
}

export function RecentCommoditiesSection({ commodities, isLoading }: RecentCommoditiesSectionProps) {
  const t = useTranslations();

  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          {t('dashboard.recentCommodities.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.recentCommodities.description')}
        </p>
      </div>

      <div className="px-6 pb-6 space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            {t('dashboard.recentCommodities.loading')}
          </div>
        ) : commodities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('dashboard.recentCommodities.noTrades')}
          </div>
        ) : (
          commodities.map((commodity) => (
            <div
              key={commodity.id}
              className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="grid grid-cols-[1fr_150px_100px] gap-4 items-start justify-items-start">
                <div className="text-start">
                  <p className="font-medium text-foreground mb-1">{commodity.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.recentCommodities.origin')}:{' '}
                    <span className="text-foreground">{commodity.origin}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.recentCommodities.location')}: {commodity.location}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground text-start">
                  {t('dashboard.recentCommodities.quantity')}:{' '}
                  <span className="text-foreground font-medium">{commodity.quantity}</span>
                </div>

                <div className="text-sm text-muted-foreground text-start">{commodity.date}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
