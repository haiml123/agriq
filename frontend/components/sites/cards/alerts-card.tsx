'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Alert } from '../types';

type AlertCondition = {
  type?: string;
  metric?: string;
  operator?: string;
  value?: number;
  secondaryValue?: number;
  changeDirection?: string;
  changeAmount?: number;
  timeWindowHours?: number;
  timeWindowDays?: number;
  unit?: string;
  valueSources?: string[];
};

interface AlertsCardProps {
  alerts: Alert[];
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  const t = useTranslations('sites');
  const tSeverity = useTranslations('severity');
  const tStatus = useTranslations('alertStatus');
  const tAlertDescription = useTranslations('alertDescription');
  const tAlertCondition = useTranslations('alertCondition');
  const tAlertWindow = useTranslations('alertWindow');
  const tMetric = useTranslations('alertMetric');
  const tOperator = useTranslations('alertOperator');
  const tDirection = useTranslations('alertDirection');

  const formatCondition = (condition: AlertCondition) => {
    if (!condition.type || !condition.metric) return '';
    const metricLabel = tMetric(condition.metric);
    const unit = condition.unit || '';

    if (condition.type === 'THRESHOLD') {
      if (condition.valueSources && condition.valueSources.length > 0) {
        return '';
      }

      if (condition.operator === 'BETWEEN') {
        return tAlertCondition('between', {
          metric: metricLabel,
          min: condition.value ?? '',
          max: condition.secondaryValue ?? '',
          unit,
        });
      }

      return tAlertCondition('threshold', {
        metric: metricLabel,
        operator: condition.operator ? tOperator(condition.operator) : '',
        value: condition.value ?? '',
        unit,
      });
    }

    if (condition.type === 'CHANGE') {
      let windowText = '';
      if (condition.timeWindowDays) {
        windowText = tAlertWindow('days', { count: condition.timeWindowDays });
      } else if (condition.timeWindowHours) {
        windowText = tAlertWindow('hours', { count: condition.timeWindowHours });
      }
      if (condition.operator && condition.value !== undefined) {
        return tAlertCondition('changeThreshold', {
          metric: metricLabel,
          direction: condition.changeDirection
            ? tDirection(condition.changeDirection)
            : '',
          operator: condition.operator ? tOperator(condition.operator) : '',
          value: condition.value ?? '',
          unit,
          window: windowText,
        });
      }
      return tAlertCondition('change', {
        metric: metricLabel,
        direction: condition.changeDirection
          ? tDirection(condition.changeDirection)
          : '',
        amount: condition.changeAmount ?? '',
        unit,
        window: windowText,
      });
    }

    return '';
  };

  const resolveAlertDescription = (alert: Alert) => {
    if ((alert as any).descriptionKey && (alert as any).descriptionParams) {
      const params = (alert as any).descriptionParams as {
        triggerName?: string;
        conditions?: AlertCondition[];
      };
      const conditions = Array.isArray(params.conditions)
        ? params.conditions.map(formatCondition).filter(Boolean).join(', ')
        : '';
      const triggerName = params.triggerName ?? alert.title ?? '';

      if (!conditions) {
        return tAlertDescription('triggerMatchedNoConditions', { triggerName });
      }

      return tAlertDescription('triggerMatched', {
        triggerName,
        conditions,
      });
    }
    const rawDescription = alert.description ?? '';
    return rawDescription.replace(/^Trigger ".+?" matched:\s*/i, '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('activeAlerts')}</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noDataAvailable')}</p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{resolveAlertDescription(alert)}</h4>
                  </div>
                  <Badge
                    variant={alert.status === 'OPEN' ? 'default' : 'secondary'}
                    className={
                      alert.status === 'OPEN' ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }
                  >
                    {tStatus(alert.status)}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className="mt-2 border-red-500 text-red-500"
                >
                  {tSeverity(alert.severity)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
