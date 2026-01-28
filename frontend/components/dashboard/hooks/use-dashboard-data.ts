import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useAlertApi } from '@/hooks/use-alert-api';
import { useTradeApi } from '@/hooks/use-trade-api';
import type { DashboardAlert } from '@/schemas/alert.schema';
import type { DashboardTrade } from '@/schemas/trade.schema';
import { resolveLocaleText } from '@/utils/locale';

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
          description: alert.description || alert.title || 'No description',
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
