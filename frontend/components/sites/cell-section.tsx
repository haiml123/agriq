import { TemperatureChart } from './charts/temperature-chart';
import { HumidityChart } from './charts/humidity-chart';
import { CommoditiesCard } from './cards/commodities-card';
import { AlertsCard } from './cards/alerts-card';
import { useCellChartData } from './hooks/use-cell-chart-data';
import type { Cell, MultipleCellsDetails, DateRange } from './types';

interface CellSectionProps {
  cell: Cell;
  cellsDetails: MultipleCellsDetails;
  dateRange: DateRange;
  isFirst?: boolean;
}

export function CellSection({ cell, cellsDetails, dateRange, isFirst }: CellSectionProps) {
  const cellData = useCellChartData(cell.id, cellsDetails, dateRange);

  return (
    <div className={isFirst ? '' : 'mt-8'}>
      {/* Cell Title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          {cell.name} - {cell.compound.name}
        </h3>
        <p className="text-sm text-muted-foreground">{cell.compound.site.name}</p>
      </div>

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
        <CommoditiesCard trades={cellData.trades} />
        <AlertsCard alerts={cellData.alerts} />
      </div>
    </div>
  );
}
