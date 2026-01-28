'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApp } from '@/providers/app-provider';
import type { ApiAlert } from './types';
import { getSeverityColor, getStatusColor } from './utils/alert-utils';
import { AlertStatusEnum } from './types';
import { AlertTriangle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { resolveLocaleText } from '@/utils/locale';

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

interface AlertsTableProps {
  alerts: ApiAlert[];
  onAcknowledge: (alertId: string) => void;
}

export function AlertsTable({ alerts, onAcknowledge }: AlertsTableProps) {
  const t = useTranslations('pages.alerts');
  const tSeverity = useTranslations('severity');
  const tStatus = useTranslations('alertStatus');
  const tAlertDescription = useTranslations('alertDescription');
  const tAlertCondition = useTranslations('alertCondition');
  const tAlertWindow = useTranslations('alertWindow');
  const tMetric = useTranslations('alertMetric');
  const tOperator = useTranslations('alertOperator');
  const tDirection = useTranslations('alertDirection');
  const { isRTL } = useApp();
  const locale = useLocale();
  const tableAlignmentClass = isRTL ? 'text-right [&_th]:text-right [&_td]:text-right' : '';

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
        operator: condition.operator ? tOperator(condition.operator) : condition.operator,
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
            : condition.changeDirection,
          operator: condition.operator ? tOperator(condition.operator) : condition.operator,
          value: condition.value ?? '',
          unit,
          window: windowText,
        });
      }
      return tAlertCondition('change', {
        metric: metricLabel,
        direction: condition.changeDirection
          ? tDirection(condition.changeDirection)
          : condition.changeDirection,
        amount: condition.changeAmount ?? '',
        unit,
        window: windowText,
      });
    }

    return '';
  };

  const resolveAlertDescription = (alert: ApiAlert) => {
    if (alert.descriptionKey && alert.descriptionParams) {
      const params = alert.descriptionParams as {
        triggerName?: string;
        conditions?: AlertCondition[];
      };
      const conditionLines = Array.isArray(params.conditions)
        ? params.conditions.map(formatCondition).filter(Boolean)
        : [];
      const conditions = conditionLines.join(', ');
      const triggerName = params.triggerName ?? alert.title ?? '';

      if (!conditions) {
        return {
          text: tAlertDescription('triggerMatchedNoConditions', { triggerName }),
          lines: [],
        };
      }

      return {
        text: tAlertDescription('triggerMatched', { triggerName, conditions }),
        lines: conditionLines,
      };
    }
    const rawDescription = alert.description ?? '';
    const cleanedDescription = rawDescription.replace(/^Trigger ".+?" matched:\s*/i, '');
    return {
      text: cleanedDescription,
      lines: cleanedDescription ? [cleanedDescription] : [],
    };
  };

  return (
    <Table className={tableAlignmentClass}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('severity')}</TableHead>
          <TableHead>{t('site')}</TableHead>
          <TableHead>{t('cell')}</TableHead>
          <TableHead>{t('description')}</TableHead>
          <TableHead>{t('trigger')}</TableHead>
          <TableHead>{t('created')}</TableHead>
          <TableHead>{t('status')}</TableHead>
          <TableHead>{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert.id}>
            <TableCell>
              <Badge className={getSeverityColor(alert.severity)}>
                {tSeverity(alert.severity)}
              </Badge>
            </TableCell>
            <TableCell>
              {alert.site?.name
                ? resolveLocaleText(alert.site.locale, locale, alert.site.name)
                : '-'}
            </TableCell>
            <TableCell>
              {alert.cell?.name
                ? resolveLocaleText(alert.cell.locale, locale, alert.cell.name)
                : '-'}
            </TableCell>
            <TableCell className="max-w-md">
              <div>
                {(() => {
                  const { text, lines } = resolveAlertDescription(alert);
                  const outputLines = lines.length > 0 ? lines : text ? [text] : ['-'];
                  return (
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {outputLines.map((line, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                          <span className="whitespace-pre-wrap">{line}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </TableCell>
            <TableCell>{alert.commodity?.name || '-'}</TableCell>
            <TableCell>
              {format(new Date(alert.startedAt), 'dd/MM/yyyy HH:mm')}
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(alert.status)}>
                {tStatus(alert.status)}
              </Badge>
            </TableCell>
            <TableCell>
              {alert.status === AlertStatusEnum.OPEN ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAcknowledge(alert.id)}
                >
                  {t('acknowledge')}
                </Button>
              ) : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
