'use client';

import { Badge } from '@/components/ui/badge';

const activeAlerts = [
    {
        id: '1',
        description: 'Temperature raised 5° in 2 days to 32°',
        severity: 'LOW' as const,
        status: 'OPEN' as const,
        location: 'Ashdod › Northern Storage › Cell 1',
        daysAgo: 328,
        assignee: null,
    },
    {
        id: '2',
        description: 'Humidity raised 3% in 5 days',
        severity: 'HIGH' as const,
        status: 'ACKNOWLEDGED' as const,
        location: 'Ashdod › Northern Storage › Cell 3',
        daysAgo: 329,
        assignee: 'John D.',
    },
    {
        id: '3',
        description: '13% Humidity',
        severity: 'HIGH' as const,
        status: 'IN_PROGRESS' as const,
        location: 'Central Storage › Western Complex › Cell 9',
        daysAgo: 48,
        assignee: 'David Martinez',
    },
];

const recentGoods = [
    {
        id: '1',
        name: 'Non-GMO Soy',
        origin: 'Missouri, USA',
        quantity: '1,700 kg',
        location: 'Great Plains Storage Center › Prairie Storage › Cell 14',
        date: '21.2.2025',
    },
    {
        id: '2',
        name: 'Soy #1',
        origin: 'North Dakota, USA',
        quantity: '1,600 kg',
        location: 'Northern Plains Center › Eastern Wing › Cell 8',
        date: '19.2.2025',
    },
    {
        id: '3',
        name: 'Yellow Corn #1',
        origin: 'Kansas, USA',
        quantity: '2,900 kg',
        location: 'Great Plains Storage Center › Western Complex › Cell 13',
        date: '17.2.2025',
    },
    {
        id: '4',
        name: 'Sorghum',
        origin: 'Nebraska, USA',
        quantity: '1,900 kg',
        location: 'Midwest Storage › Southern Wing › Cell 3',
        date: '14.2.2025',
    },
    {
        id: '5',
        name: 'Durum Wheat',
        origin: 'Montana, USA',
        quantity: '1,800 kg',
        location: 'Northwest Hub › Storage A › Cell 17',
        date: '13.2.2025',
    },
];

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
    return (
        <div className="space-y-6">
            {/* Active Alerts Section */}
            <section className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6 pb-4">
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                        Active Alerts
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Currently active alerts across all sites
                    </p>
                </div>

                <div className="px-6 pb-6 space-y-3">
                    {activeAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                            {/* Top row: Severity badge + Description + Days ago */}
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className={severityStyles[alert.severity]}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 mr-1" />
                                    {alert.severity.charAt(0) + alert.severity.slice(1).toLowerCase()}
                                </Badge>
                                <span className="font-medium text-foreground">
                                    {alert.description}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {alert.daysAgo} days ago
                                </span>
                            </div>

                            {/* Location */}
                            <p className="text-sm text-muted-foreground mb-2">
                                {alert.location}
                            </p>

                            {/* Status + Assignee */}
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className={statusStyles[alert.status]}>
                                    {statusLabels[alert.status]}
                                </Badge>
                                {alert.assignee && (
                                    <span className="text-sm text-muted-foreground">
                                        Assigned to {alert.assignee}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recent Goods Section */}
            <section className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6 pb-4">
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                        Recent Goods
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Recently arrived goods across all sites
                    </p>
                </div>

                <div className="px-6 pb-6 space-y-3">
                    {recentGoods.map((goods) => (
                        <div
                            key={goods.id}
                            className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                            <div className="grid grid-cols-[100px_1fr_1fr] gap-4 items-start">
                                {/* Left: Date */}
                                <div className="text-sm text-muted-foreground">
                                    {goods.date}
                                </div>

                                {/* Center: Quantity */}
                                <div className="text-sm text-muted-foreground text-center">
                                    Quantity: <span className="text-foreground font-medium">{goods.quantity}</span>
                                </div>

                                {/* Right: Name, Origin, Location */}
                                <div className="text-right">
                                    <p className="font-medium text-foreground mb-1">
                                        {goods.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Origin: <span className="text-foreground">{goods.origin}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Location: {goods.location}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}