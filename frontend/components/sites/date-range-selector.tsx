import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { DateRange } from './types';

interface DateRangeSelectorProps {
  dateRange: DateRange;
  customStartDate: string;
  customEndDate: string;
  onDateRangeChange: (range: DateRange) => void;
  onCustomStartDateChange: (date: string) => void;
  onCustomEndDateChange: (date: string) => void;
}

export function DateRangeSelector({
  dateRange,
  customStartDate,
  customEndDate,
  onDateRangeChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: DateRangeSelectorProps) {
  const t = useTranslations('sites');

  return (
    <div className="flex items-end gap-4 ml-auto">
      <div className="w-[125px]">
        <label className="text-sm font-medium mb-2 block">{t('dateRange')}</label>
        <Select value={dateRange} onValueChange={(value: DateRange) => onDateRangeChange(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">{t('last7Days')}</SelectItem>
            <SelectItem value="month">{t('lastMonth')}</SelectItem>
            <SelectItem value="year">{t('lastYear')}</SelectItem>
            <SelectItem value="custom">{t('custom')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {dateRange === 'custom' && (
        <>
          <div className="w-[150px]">
            <label className="text-sm font-medium mb-2 block">{t('startDate')}</label>
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-[150px]">
            <label className="text-sm font-medium mb-2 block">{t('endDate')}</label>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
}
