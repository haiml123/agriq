import { TemperatureChart } from './charts/temperature-chart';
import { HumidityChart } from './charts/humidity-chart';
import { CommoditiesCard } from './cards/commodities-card';
import { AlertsCard } from './cards/alerts-card';
import { useCellChartData } from './hooks/use-cell-chart-data';
import type { Cell, MultipleCellsDetails, DateRange, GatewayReading } from './types';
import { EnvironmentSummary } from './environment-summary';
import { useLocale } from 'next-intl';
import { resolveLocaleText } from '@/utils/locale';

interface CellSectionProps {
  cell: Cell;
  cellsDetails: MultipleCellsDetails;
  dateRange: DateRange;
  isFirst?: boolean;
  resolveCommodityTypeName?: (id: string, field: string, fallback: string) => string;
}

const getLatestReading = <T extends { recordedAt: string }>(
  readings: T[],
): T | undefined =>
  readings
    .slice()
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

export function CellSection({
  cell,
  cellsDetails,
  dateRange,
  isFirst,
  resolveCommodityTypeName,
}: CellSectionProps) {
  const locale = useLocale();
  const cellData = useCellChartData(
    cell.id,
    cellsDetails,
    dateRange,
    resolveCommodityTypeName
  );
  const gatewayReadings = (cellsDetails.gatewayReadings || []).filter(
    (reading: GatewayReading) => reading.cellId === cell.id,
  );
  const latestGateway = getLatestReading(gatewayReadings);

  return (
    <div className={isFirst ? '' : 'mt-8'}>
      {/* Cell Title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          {resolveLocaleText(cell.locale, locale, cell.name)} -{' '}
          {resolveLocaleText(cell.compound?.locale, locale, cell.compound.name)}
        </h3>
        <p className="text-sm text-muted-foreground">
          {resolveLocaleText(cell.compound.site?.locale, locale, cell.compound.site.name)}
        </p>
      </div>

      <EnvironmentSummary
        gatewayTemperature={latestGateway?.temperature}
        gatewayHumidity={latestGateway?.humidity}
        outsideTemperature={latestGateway?.outsideTemperature}
        outsideHumidity={latestGateway?.outsideHumidity}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TemperatureChart
          data={cellData.temperatureData}
          tempMin={cellData.tempMin}
          tempMax={cellData.tempMax}
          commodityMarkers={cellData.commodityMarkers}
        />
        <HumidityChart
          data={cellData.humidityData}
          humidityMin={cellData.humidityMin}
          humidityMax={cellData.humidityMax}
          commodityMarkers={cellData.commodityMarkers}
        />
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CommoditiesCard
          trades={cellData.trades}
          getCommodityDisplayName={(trade) => {
            const commodityType = trade.commodity.commodityType;
            if (commodityType?.id && resolveCommodityTypeName) {
              return resolveCommodityTypeName(commodityType.id, 'name', commodityType.name);
            }
            return commodityType?.name || trade.commodity.name || 'Unknown';
          }}
        />
        <AlertsCard alerts={cellData.alerts} />
      </div>
    </div>
  );
}
