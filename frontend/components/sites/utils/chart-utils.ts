import { format } from 'date-fns';
import type { DateRange, Trade, SensorReading, ChartDataPoint, CommodityMarker } from '../types';
import { DateRangeEnum } from '../types';

// Color palette for commodity markers
export const commodityColors = [
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EF4444', // Red
  '#14B8A6', // Teal
];

export function getDateFormat(dateRange: DateRange): string {
  switch (dateRange) {
    case DateRangeEnum['7days']:
      return 'MMM dd';
    case DateRangeEnum.month:
      return 'MMM dd';
    case DateRangeEnum.year:
      return 'MMM yyyy';
    default:
      return 'MMM dd';
  }
}

export function getCommodityAtTime(
  trades: Trade[],
  timestamp: string,
  noCommodityLabel: string,
  unknownCommodityLabel: string
): string {
  const time = new Date(timestamp).getTime();
  const sortedTrades = [...trades].sort((a, b) =>
    new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime()
  );

  // Find the most recent trade before or at this time
  for (let i = sortedTrades.length - 1; i >= 0; i--) {
    if (new Date(sortedTrades[i].tradedAt).getTime() <= time) {
      return (
        sortedTrades[i].commodity.commodityType?.name ||
        sortedTrades[i].commodity.name ||
        unknownCommodityLabel
      );
    }
  }
  return noCommodityLabel;
}

export function aggregateReadingsByDate(
  readings: SensorReading[],
  dateFormat: string,
  getCommodity: (timestamp: string) => string,
  getValue: (reading: SensorReading) => number
) {
  const byDate = new Map<string, { sum: number; count: number; fullDate: string }>();

  readings.forEach((r) => {
    const dateKey = format(new Date(r.recordedAt), dateFormat);
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { sum: 0, count: 0, fullDate: r.recordedAt });
    }
    const entry = byDate.get(dateKey)!;
    entry.sum += getValue(r);
    entry.count += 1;
  });

  return Array.from(byDate.entries())
    .map(([date, data]) => ({
      date,
      fullDate: data.fullDate,
      value: parseFloat((data.sum / data.count).toFixed(2)),
      commodity: getCommodity(data.fullDate),
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
}

export function getChartDomain(values: number[]): { min: number; max: number } {
  if (values.length === 0) {
    return { min: 0, max: 100 };
  }
  return {
    min: Math.floor(Math.min(...values)) - 2,
    max: Math.ceil(Math.max(...values)) + 2,
  };
}

export function generateCommodityMarkers(
  trades: Trade[],
  dateFormat: string
): CommodityMarker[] {
  const uniqueMarkers = new Map<string, CommodityMarker>();

  trades
    .sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime())
    .forEach((trade, index) => {
      const commodityName =
        trade.commodity.commodityType?.name || trade.commodity.name || 'Unknown';
      if (!uniqueMarkers.has(commodityName)) {
        uniqueMarkers.set(commodityName, {
          date: format(new Date(trade.tradedAt), dateFormat),
          fullDate: trade.tradedAt,
          commodity: commodityName,
          color: commodityColors[index % commodityColors.length],
        });
      }
    });

  return Array.from(uniqueMarkers.values());
}
