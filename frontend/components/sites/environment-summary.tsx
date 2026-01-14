import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { CloudSun, Thermometer } from 'lucide-react';

interface EnvironmentSummaryProps {
  gatewayTemperature?: number;
  gatewayHumidity?: number;
  outsideTemperature?: number;
  outsideHumidity?: number;
}

export function EnvironmentSummary({
  gatewayTemperature,
  gatewayHumidity,
  outsideTemperature,
  outsideHumidity,
}: EnvironmentSummaryProps) {
  const t = useTranslations('sites');

  const formatValue = (value: number | undefined, suffix: string) => {
    if (value == null || Number.isNaN(value)) {
      return t('noDataAvailable');
    }
    return `${value.toFixed(1)}${suffix}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <CloudSun className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {t('outsideWeatherSource')}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {formatValue(outsideTemperature, '°C')} | {formatValue(outsideHumidity, '%')}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              {t('warehouseAmbient')}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {formatValue(gatewayTemperature, '°C')} | {formatValue(gatewayHumidity, '%')}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
