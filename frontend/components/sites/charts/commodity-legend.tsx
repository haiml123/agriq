import { format } from 'date-fns';
import type { CommodityMarker } from '../types';

interface CommodityLegendProps {
  markers: CommodityMarker[];
}

export function CommodityLegend({ markers }: CommodityLegendProps) {
  if (markers.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">Commodity Timeline:</p>
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
              {marker.commodity} ({format(new Date(marker.fullDate), 'dd/MM/yyyy')})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
