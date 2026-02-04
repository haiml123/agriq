import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAlertApi } from '@/hooks/use-alert-api';
import { useTradeApi } from '@/hooks/use-trade-api';
import type { DashboardAlert } from '@/schemas/alert.schema';
import type { DashboardTrade } from '@/schemas/trade.schema';
import { ConditionTypeEnum, OperatorEnum } from '@/schemas/trigger.schema';
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

interface DashboardFilters {
  siteId?: string;
  compoundId?: string;
}

export function useDashboardData(filters?: DashboardFilters) {
  const { getList: getAlerts } = useAlertApi();
  const { getRecent: getRecentTrades, isLoading: isLoadingTrades } = useTradeApi();
  const [activeAlerts, setActiveAlerts] = useState<DashboardAlert[]>([]);
  const [recentCommodities, setRecentCommodities] = useState<DashboardTrade[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const locale = useLocale();
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

    if (condition.type === ConditionTypeEnum.THRESHOLD) {
      if (condition.operator === OperatorEnum.BETWEEN) {
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

    if (condition.type === ConditionTypeEnum.CHANGE) {
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

  const resolveAlertDescription = (alert: any) => {
    if (alert.descriptionKey && alert.descriptionParams) {
      const params = alert.descriptionParams as {
        triggerName?: string;
        conditions?: AlertCondition[];
      };
      const conditionLines = Array.isArray(params.conditions)
        ? params.conditions.map(formatCondition).filter(Boolean)
        : [];
      const conditions = conditionLines.join(', ');

      if (!conditions) {
        return tAlertDescription('triggerMatchedNoConditions');
      }

      return tAlertDescription('triggerMatched', { conditions });
    }

    const raw = alert.description || alert.title || 'No description';
    return raw.replace(/^Trigger ".+?" matched:\s*/i, '');
  };

  useEffect(() => {
    fetchAlerts();
    fetchTrades();
  }, [filters?.siteId, filters?.compoundId]);

  const fetchAlerts = useCallback(async () => {
    setIsLoadingAlerts(true);
    const response = await getAlerts({
      limit: 10,
      ...(filters?.siteId && { siteId: filters.siteId }),
      ...(filters?.compoundId && { compoundId: filters.compoundId }),
    });
    setIsLoadingAlerts(false);
    if (response.data) {
      const formattedAlerts = response.data.map((alert) => {
        const locationParts = [];
        if (alert.site?.name) {
          locationParts.push(resolveLocaleText(alert.site.locale, locale, alert.site.name));
        }
        if (alert.compound?.name) {
          locationParts.push(resolveLocaleText(alert.compound.locale, locale, alert.compound.name));
        }
        if (alert.cell?.name) {
          locationParts.push(resolveLocaleText(alert.cell.locale, locale, alert.cell.name));
        }

        const startedAt = new Date(alert.startedAt);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: alert.id,
          description: resolveAlertDescription(alert),
          severity: alert.severity,
          status: alert.status,
          location: locationParts.join(' › ') || 'Unknown location',
          daysAgo,
          assignee: alert.user?.name || null,
        } satisfies DashboardAlert;
      });
      setActiveAlerts(formattedAlerts);
    }
  }, [filters?.compoundId, filters?.siteId, getAlerts]);

  const fetchTrades = useCallback(async () => {
    const response = await getRecentTrades({
      limit: 10,
      ...(filters?.siteId && { siteId: filters.siteId }),
      ...(filters?.compoundId && { compoundId: filters.compoundId }),
    });
    if (response.data) {
      const formattedTrades = response.data.map((trade) => {
        const locationParts = [];
        if (trade.site?.name) {
          locationParts.push(resolveLocaleText(trade.site.locale, locale, trade.site.name));
        }
        if (trade.compound?.name) {
          locationParts.push(resolveLocaleText(trade.compound.locale, locale, trade.compound.name));
        }
        if (trade.cell?.name) {
          locationParts.push(resolveLocaleText(trade.cell.locale, locale, trade.cell.name));
        }

        const tradedAt = new Date(trade.tradedAt);
        const formattedDate = tradedAt
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          .replace(/\//g, '.');

        return {
          id: trade.id,
          name: trade.commodity?.name || 'Unknown commodity',
          origin: trade.commodity?.origin || 'Unknown origin',
          quantity: `${trade.amountKg.toLocaleString()} kg`,
          location: locationParts.join(' › ') || 'Unknown location',
          date: formattedDate,
        } satisfies DashboardTrade;
      });
      setRecentCommodities(formattedTrades);
    }
  }, [filters?.compoundId, filters?.siteId, getRecentTrades]);

  return {
    activeAlerts,
    recentCommodities,
    isLoadingAlerts,
    isLoadingTrades,
  };
}
