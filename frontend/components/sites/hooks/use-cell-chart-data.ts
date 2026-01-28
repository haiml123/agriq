import { useLocale, useTranslations } from 'next-intl';
import type {
  MultipleCellsDetails,
  CellChartData,
  DateRange,
  GatewayReading,
  ChartDataPoint,
} from '../types';
import {
  getDateFormatter,
  getCommodityAtTime,
  aggregateReadingsByDate,
  getChartDomain,
  generateCommodityMarkers,
} from '../utils/chart-utils';

type SeriesPoint = { date: string; fullDate: string; value: number };
type NumericChartKey =
  | 'temperature'
  | 'humidity'
  | 'ambientTemperature'
  | 'ambientHumidity'
  | 'outsideTemperature'
  | 'outsideHumidity';

const mergeSeriesByDate = (
  base: ChartDataPoint[],
  series: SeriesPoint[],
  key: NumericChartKey,
  fallbackCommodity: string,
) => {
  const merged = new Map<string, ChartDataPoint>();

  base.forEach((point) => {
    merged.set(point.date, { ...point });
  });

  series.forEach((point) => {
    const existing = merged.get(point.date);
    if (existing) {
      existing[key] = point.value;
      if (new Date(point.fullDate).getTime() > new Date(existing.fullDate).getTime()) {
        existing.fullDate = point.fullDate;
      }
    } else {
      const newPoint: ChartDataPoint = {
        date: point.date,
        fullDate: point.fullDate,
        commodity: fallbackCommodity,
      };
      newPoint[key] = point.value;
      merged.set(point.date, newPoint);
    }
  });

  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime(),
  );
};

export function useCellChartData(
  cellId: string,
  cellsDetails: MultipleCellsDetails | null,
  dateRange: DateRange,
  resolveCommodityTypeName?: (id: string, field: string, fallback: string) => string
): CellChartData {
  const t = useTranslations('sites');
  const locale = useLocale();

  if (!cellsDetails) {
    return {
      temperatureData: [],
      humidityData: [],
      tempMin: 0,
      tempMax: 100,
      humidityMin: 0,
      humidityMax: 100,
      trades: [],
      alerts: [],
      commodityMarkers: [],
    };
  }

  const sensorReadings = cellsDetails.sensorReadings.filter((r) => r.cellId === cellId);
  const gatewayReadings = (cellsDetails.gatewayReadings || []).filter((r) => r.cellId === cellId);
  const trades = cellsDetails.trades.filter((t) => t.cellId === cellId);
  const alerts = cellsDetails.alerts.filter((a) => a.cellId === cellId);
  const weatherObservations = cellsDetails.weatherObservations || [];

  const dateFormatter = getDateFormatter(dateRange, locale);

  // Helper to get commodity at a specific time
  const getCommodity = (timestamp: string) =>
    getCommodityAtTime(
      trades,
      timestamp,
      t('noCommodity'),
      t('unknownCommodity'),
      resolveCommodityTypeName
    );

  // Temperature data
  let temperatureData: ChartDataPoint[] = aggregateReadingsByDate(
    sensorReadings,
    dateFormatter,
    getCommodity,
    (reading) => reading.temperature
  ).map((d) => ({
    date: d.date,
    fullDate: d.fullDate,
    commodity: d.commodity,
    temperature: d.value,
  }));

  const ambientTemperature = aggregateReadingsByDate(
    gatewayReadings,
    dateFormatter,
    () => t('noCommodity'),
    (reading: GatewayReading) => reading.temperature
  ).map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.value }));

  const outsideTemperature = aggregateReadingsByDate(
    gatewayReadings.filter((reading) => reading.outsideTemperature != null),
    dateFormatter,
    () => t('noCommodity'),
    (reading: GatewayReading) => reading.outsideTemperature as number
  ).map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.value }));

  const cellSiteId = cellsDetails.cells.find((cell) => cell.id === cellId)?.compound?.site?.id;
  const weatherForSite = cellSiteId
    ? weatherObservations.filter((obs) => obs.siteId === cellSiteId)
    : [];

  const outsideTempFallback = aggregateReadingsByDate(
    weatherForSite,
    dateFormatter,
    () => t('noCommodity'),
    (reading) => reading.temperature
  ).map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.value }));

  temperatureData = mergeSeriesByDate(
    temperatureData,
    ambientTemperature,
    'ambientTemperature',
    t('noCommodity'),
  );
  temperatureData = mergeSeriesByDate(
    temperatureData,
    outsideTemperature.length > 0 ? outsideTemperature : outsideTempFallback,
    'outsideTemperature',
    t('noCommodity'),
  );

  // Humidity data
  let humidityData: ChartDataPoint[] = aggregateReadingsByDate(
    sensorReadings,
    dateFormatter,
    getCommodity,
    (reading) => reading.humidity
  ).map((d) => ({
    date: d.date,
    fullDate: d.fullDate,
    commodity: d.commodity,
    humidity: d.value,
  }));

  const ambientHumidity = aggregateReadingsByDate(
    gatewayReadings,
    dateFormatter,
    () => t('noCommodity'),
    (reading: GatewayReading) => reading.humidity
  ).map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.value }));

  const outsideHumidity = aggregateReadingsByDate(
    gatewayReadings.filter((reading) => reading.outsideHumidity != null),
    dateFormatter,
    () => t('noCommodity'),
    (reading: GatewayReading) => reading.outsideHumidity as number
  ).map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.value }));

  const outsideHumidityFallback = aggregateReadingsByDate(
    weatherForSite,
    dateFormatter,
    () => t('noCommodity'),
    (reading) => reading.humidity
  ).map((d) => ({ date: d.date, fullDate: d.fullDate, value: d.value }));

  humidityData = mergeSeriesByDate(
    humidityData,
    ambientHumidity,
    'ambientHumidity',
    t('noCommodity'),
  );
  humidityData = mergeSeriesByDate(
    humidityData,
    outsideHumidity.length > 0 ? outsideHumidity : outsideHumidityFallback,
    'outsideHumidity',
    t('noCommodity'),
  );

  if (process.env.NODE_ENV !== 'production') {
    const outsideTempCount = gatewayReadings.filter((r) => r.outsideTemperature != null).length;
    const outsideHumidityCount = gatewayReadings.filter((r) => r.outsideHumidity != null).length;
    if (outsideTempCount === 0 || outsideHumidityCount === 0) {
      // eslint-disable-next-line no-console
      console.debug('[cell-chart] outside series missing', {
        cellId,
        gatewayReadings: gatewayReadings.length,
        outsideTempCount,
        outsideHumidityCount,
        dateRange,
      });
    }
  }

  // Calculate chart domains
  const tempValues = temperatureData.flatMap((d) =>
    [d.temperature, d.ambientTemperature, d.outsideTemperature].filter(
      (value): value is number => value !== undefined,
    ),
  );
  const humidityValues = humidityData.flatMap((d) =>
    [d.humidity, d.ambientHumidity, d.outsideHumidity].filter(
      (value): value is number => value !== undefined,
    ),
  );
  const { min: tempMin, max: tempMax } = getChartDomain(tempValues);
  const { min: humidityMin, max: humidityMax } = getChartDomain(humidityValues);

  // Generate commodity markers
  const commodityMarkers = generateCommodityMarkers(
    trades,
    dateFormatter,
    resolveCommodityTypeName
  );

  return {
    temperatureData,
    humidityData,
    tempMin,
    tempMax,
    humidityMin,
    humidityMax,
    trades,
    alerts,
    commodityMarkers,
  };
}
