'use client';

import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useAlertApi } from '@/hooks/use-alert-api';
import { useTradeApi } from '@/hooks/use-trade-api';
import { useTranslations } from 'next-intl';
import type { DashboardAlert } from '@/schemas/alert.schema';
import type { DashboardTrade } from '@/schemas/trade.schema';

const severityStyles = {
    LOW: 'bg-emerald-500 text-white border-transparent',
    MEDIUM: 'bg-yellow-500 text-white border-transparent',
    HIGH: 'bg-orange-500 text-white border-transparent',
    CRITICAL: 'bg-red-500 text-white border-transparent',
};

const statusStyles = {
    OPEN: 'bg-red-500/10 text-red-500 border-red-500/30',
    IN_PROGRESS: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    ACKNOWLEDGED: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    RESOLVED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    DISMISSED: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

const statusLabels = {
    OPEN: 'Open',
    IN_PROGRESS: 'Investigating',
    ACKNOWLEDGED: 'Acknowledged',
    RESOLVED: 'Resolved',
    DISMISSED: 'Dismissed',
};

export default function DashboardPage() {
    const t = useTranslations();
    const { getList: getAlerts } = useAlertApi();
    const { getRecent: getRecentTrades, isLoading: isLoadingTrades } = useTradeApi();
    const [activeAlerts, setActiveAlerts] = useState<DashboardAlert[]>([]);
    const [recentGoods, setRecentGoods] = useState<DashboardTrade[]>([]);
    const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            setIsLoadingAlerts(true);
            const response = await getAlerts({ limit: 10 });
            setIsLoadingAlerts(false);
            if (response.data) {
                const formattedAlerts = response.data.map((alert) => {
                        const locationParts = [];
                        if (alert.site?.name) locationParts.push(alert.site.name);
                        if (alert.compound?.name) locationParts.push(alert.compound.name);
                        if (alert.cell?.name) locationParts.push(alert.cell.name);

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
        };

        const fetchTrades = async () => {
            const response = await getRecentTrades({ limit: 10 });
            if (response.data) {
                const formattedTrades = response.data.map((trade) => {
                        const locationParts = [];
                        if (trade.site?.name) locationParts.push(trade.site.name);
                        if (trade.compound?.name) locationParts.push(trade.compound.name);
                        if (trade.cell?.name) locationParts.push(trade.cell.name);

                        const tradedAt = new Date(trade.tradedAt);
                        const formattedDate = tradedAt.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        }).replace(/\//g, '.');

                        return {
                            id: trade.id,
                            name: trade.commodity?.name || 'Unknown commodity',
                            origin: trade.commodity?.origin || 'Unknown origin',
                            quantity: `${trade.amountKg.toLocaleString()} kg`,
                            location: locationParts.join(' › ') || 'Unknown location',
                            date: formattedDate,
                        } satisfies DashboardTrade;
                    });
                    setRecentGoods(formattedTrades);
                }
        };

        fetchAlerts();
        fetchTrades();
    }, [getAlerts, getRecentTrades]);

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="space-y-6">
                {/* Active Alerts Section */}
                <section className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6 pb-4">
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                        {t('dashboard.activeAlerts.title')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.activeAlerts.description')}
                    </p>
                </div>

                <div className="px-6 pb-6 space-y-3">
                    {isLoadingAlerts ? (
                        <div className="text-center text-muted-foreground py-8">
                            {t('dashboard.activeAlerts.loading')}
                        </div>
                    ) : activeAlerts.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            {t('dashboard.activeAlerts.noAlerts')}
                        </div>
                    ) : (
                        activeAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                            {/* Top row: Severity badge + Description + Days ago */}
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className={severityStyles[alert.severity]}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 mr-1" />
                                    {t(`severity.${alert.severity}`)}
                                </Badge>
                                <span className="font-medium text-foreground">
                                    {alert.description}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {t('dashboard.activeAlerts.daysAgo', { count: alert.daysAgo })}
                                </span>
                            </div>

                            {/* Location */}
                            <p className="text-sm text-muted-foreground mb-2">
                                {alert.location}
                            </p>

                            {/* Status + Assignee */}
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className={statusStyles[alert.status]}>
                                    {t(`alertStatus.${alert.status}`)}
                                </Badge>
                                {alert.assignee && (
                                    <span className="text-sm text-muted-foreground">
                                        {t('dashboard.activeAlerts.assignedTo', { name: alert.assignee })}
                                    </span>
                                )}
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </section>

            {/* Recent Goods Section */}
            <section className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6 pb-4">
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                        {t('dashboard.recentGoods.title')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.recentGoods.description')}
                    </p>
                </div>

                <div className="px-6 pb-6 space-y-3">
                    {isLoadingTrades ? (
                        <div className="text-center text-muted-foreground py-8">
                            {t('dashboard.recentGoods.loading')}
                        </div>
                    ) : recentGoods.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            {t('dashboard.recentGoods.noTrades')}
                        </div>
                    ) : (
                        recentGoods.map((goods) => (
                        <div
                            key={goods.id}
                            className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                            <div className="grid grid-cols-[1fr_150px_100px] gap-4 items-start">
                                {/* Left: Name, Origin, Location */}
                                <div className="text-left">
                                    <p className="font-medium text-foreground mb-1">
                                        {goods.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('dashboard.recentGoods.origin')}: <span className="text-foreground">{goods.origin}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('dashboard.recentGoods.location')}: {goods.location}
                                    </p>
                                </div>

                                {/* Center: Quantity */}
                                <div className="text-sm text-muted-foreground">
                                    {t('dashboard.recentGoods.quantity')}: <span className="text-foreground font-medium">{goods.quantity}</span>
                                </div>

                                {/* Right: Date */}
                                <div className="text-sm text-muted-foreground">
                                    {goods.date}
                                </div>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </section>
            </div>
        </div>
    );
}