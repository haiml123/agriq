import { subDays, subMonths, subYears } from 'date-fns';
import type { DateRange } from '../types';
import { DateRangeEnum } from '../types';

export function getDateRangeParams(
  dateRange: DateRange,
  customStartDate: string,
  customEndDate: string
): { startDate: string; endDate: string } | null {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (dateRange) {
    case DateRangeEnum['7days']:
      startDate = subDays(now, 7);
      break;
    case DateRangeEnum.month:
      startDate = subMonths(now, 1);
      break;
    case DateRangeEnum.year:
      startDate = subYears(now, 1);
      break;
    case DateRangeEnum.custom:
      if (!customStartDate || !customEndDate) return null;
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      break;
    default:
      startDate = subDays(now, 7);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}
