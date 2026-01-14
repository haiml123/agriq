import { useLocale, useTranslations } from 'next-intl';
import type { CommodityMarker } from '../types';

interface CommodityLegendProps {
  markers: CommodityMarker[];
}

export function CommodityLegend({ markers }: CommodityLegendProps) {
  const t = useTranslations('sites');
  const locale = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (markers.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {t('commodityTimeline')}:
      </p>
      <div className="flex flex-wrap gap-3">
        {markers.map((marker, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border-2"
              style={{
                borderColor: marker.color,
                backgroundColor: `${marker.color}20`,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {marker.commodity} ({dateFormatter.format(new Date(marker.fullDate))})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
