import { MetricType } from './dto';

type LookupTableData = {
  tempRanges: number[];
  humidityRanges: number[];
  values: number[][];
};

export function calculateMedian(values: number[]): number | undefined {
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

export function getMetricUnit(metric: MetricType): string {
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

export function calculateEmc(
  table: LookupTableData,
  temperature: number,
  humidity: number,
): number | undefined {
  const tempIndex = findRangeIndex(table.tempRanges, temperature);
  const humidityIndex = findRangeIndex(table.humidityRanges, humidity);
  const row = table.values[humidityIndex];
  if (!row) {
    return undefined;
  }
  const value = row[tempIndex];
  return value;
}

export function getMetricValueFromReading(
  metric: MetricType,
  reading: { temperature: number; humidity: number; emc?: number },
): number | undefined {
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

function findRangeIndex(ranges: number[], value: number): number {
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
