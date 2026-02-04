import { MetricType } from './dto';
import type { LookupTableData } from './trigger.type';

/**
 * Compute the median of a list of numbers.
 */
export function calculateMedian(values: number[]): number | undefined {
  // Median for an empty set is undefined.
  if (values.length === 0) {
    return undefined;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Return display units for a metric.
 */
export function getMetricUnit(metric: MetricType): string {
  // Map metrics to display units.
  switch (metric) {
    case MetricType.TEMPERATURE:
    case MetricType.MEDIAN_TEMPERATURE:
      return '°C';
    case MetricType.HUMIDITY:
    case MetricType.EMC:
    case MetricType.MEDIAN_HUMIDITY:
      return '%';
    default:
      return '';
  }
}

/**
 * Calculate EMC based on lookup table ranges.
 */
export function calculateEmc(
  table: LookupTableData,
  temperature: number,
  humidity: number,
): number | undefined {
  // Lookup EMC value by nearest ranges.
  const tempIndex = findRangeIndex(table.tempRanges, temperature);
  const humidityIndex = findRangeIndex(table.humidityRanges, humidity);
  const row = table.values[humidityIndex];
  if (!row) {
    return undefined;
  }
  return row[tempIndex];
}

/**
 * Extract a metric value from a reading payload.
 */
export function getMetricValueFromReading(
  metric: MetricType,
  reading: { temperature: number; humidity: number; emc?: number },
): number | undefined {
  // Extract metric values from a reading.
  switch (metric) {
    case MetricType.TEMPERATURE:
    case MetricType.MEDIAN_TEMPERATURE:
      return reading.temperature;
    case MetricType.HUMIDITY:
    case MetricType.MEDIAN_HUMIDITY:
      return reading.humidity;
    case MetricType.EMC:
      return reading.emc;
    default:
      return undefined;
  }
}

/**
 * Find the nearest range index for a numeric value.
 */
function findRangeIndex(ranges: number[], value: number): number {
  // Find the last range index that is <= value.
  if (ranges.length === 0) {
    return 0;
  }
  let index = 0;
  for (let i = 0; i < ranges.length; i += 1) {
    if (value >= ranges[i]) {
      index = i;
    } else {
      break;
    }
  }
  return Math.min(Math.max(index, 0), ranges.length - 1);
}
