import { useTranslations } from 'next-intl';
import type { MultipleCellsDetails, CellChartData, DateRange } from '../types';
import {
  getDateFormat,
  getCommodityAtTime,
  aggregateReadingsByDate,
  getChartDomain,
  generateCommodityMarkers,
} from '../utils/chart-utils';

export function useCellChartData(
  cellId: string,
  cellsDetails: MultipleCellsDetails | null,
  dateRange: DateRange
): CellChartData {
  const t = useTranslations('sites');

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
  const trades = cellsDetails.trades.filter((t) => t.cellId === cellId);
  const alerts = cellsDetails.alerts.filter((a) => a.cellId === cellId);

  const dateFormat = getDateFormat(dateRange);

  // Helper to get commodity at a specific time
  const getCommodity = (timestamp: string) =>
    getCommodityAtTime(trades, timestamp, t('noCommodity'), t('unknownCommodity'));

  // Temperature data
  const temperatureData = aggregateReadingsByDate(
    sensorReadings,
    dateFormat,
    getCommodity,
    (reading) => reading.temperature
  ).map((d) => ({ ...d, temperature: d.value }));

  // Humidity data
  const humidityData = aggregateReadingsByDate(
    sensorReadings,
    dateFormat,
    getCommodity,
    (reading) => reading.humidity
  ).map((d) => ({ ...d, humidity: d.value }));

  // Calculate chart domains
  const tempValues = temperatureData.map((d) => d.temperature!);
  const humidityValues = humidityData.map((d) => d.humidity!);
  const { min: tempMin, max: tempMax } = getChartDomain(tempValues);
  const { min: humidityMin, max: humidityMax } = getChartDomain(humidityValues);

  // Generate commodity markers
  const commodityMarkers = generateCommodityMarkers(trades, dateFormat);

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
