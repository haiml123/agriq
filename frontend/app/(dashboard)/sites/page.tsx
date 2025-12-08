"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';

const siteInventory = [
    {
        id: 'site-1',
        name: 'Ashdod Port Storage',
        organization: 'Northern Grain Cooperative',
        tradesThisMonth: 18,
        openAlerts: 3,
        triggers: 4,
        pendingInvites: 2,
        compounds: [
            {
                id: 'compound-1',
                name: 'Northern Storage',
                cells: [
                    {
                        id: 'cell-1',
                        name: 'Cell 1',
                        sensors: 4,
                        status: 'Stable',
                        recentMetric: '28°C / 12% humidity',
                        alerts: 1,
                    },
                    {
                        id: 'cell-2',
                        name: 'Cell 3',
                        sensors: 3,
                        status: 'Monitoring',
                        recentMetric: '25°C / 11% humidity',
                        alerts: 1,
                    },
                ],
            },
            {
                id: 'compound-2',
                name: 'Eastern Hangar',
                cells: [
                    {
                        id: 'cell-3',
                        name: 'Cell 5',
                        sensors: 2,
                        status: 'Stable',
                        recentMetric: '23°C / 10% humidity',
                        alerts: 0,
                    },
                    {
                        id: 'cell-4',
                        name: 'Cell 6',
                        sensors: 2,
                        status: 'Cooling',
                        recentMetric: '21°C / 9% humidity',
                        alerts: 1,
                    },
                ],
            },
        ],
    },
    {
        id: 'site-2',
        name: 'Great Plains Storage Center',
        organization: 'Prairie Commodities Ltd.',
        tradesThisMonth: 11,
        openAlerts: 1,
        triggers: 3,
        pendingInvites: 0,
        compounds: [
            {
                id: 'compound-3',
                name: 'Prairie Storage',
                cells: [
                    {
                        id: 'cell-5',
                        name: 'Cell 8',
                        sensors: 3,
                        status: 'Stable',
                        recentMetric: '19°C / 10% humidity',
                        alerts: 0,
                    },
                    {
                        id: 'cell-6',
                        name: 'Cell 14',
                        sensors: 3,
                        status: 'Monitoring',
                        recentMetric: '22°C / 11% humidity',
                        alerts: 0,
                    },
                ],
            },
            {
                id: 'compound-4',
                name: 'Western Complex',
                cells: [
                    {
                        id: 'cell-7',
                        name: 'Cell 9',
                        sensors: 4,
                        status: 'Investigating',
                        recentMetric: '27°C / 13% humidity',
                        alerts: 1,
                    },
                ],
            },
        ],
    },
];

const hierarchyTotals = siteInventory.reduce(
    (totals, site) => {
        const compoundCount = site.compounds.length;
        const cellCount = site.compounds.reduce((count, compound) => count + compound.cells.length, 0);
        const sensorCount = site.compounds.reduce(
            (count, compound) => count + compound.cells.reduce((cellTotal, cell) => cellTotal + cell.sensors, 0),
            0,
        );

        return {
            sites: totals.sites + 1,
            compounds: totals.compounds + compoundCount,
            cells: totals.cells + cellCount,
            sensors: totals.sensors + sensorCount,
        };
    },
    { sites: 0, compounds: 0, cells: 0, sensors: 0 },
);

export default function SitesPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Sites</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Hierarchy from the Prisma schema: organizations manage sites, sites own compounds, and compounds group cells
                    with sensors, alerts, trades, triggers, and invites.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Sites</CardTitle>
                        <CardDescription>Site records linked to organizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-foreground">{hierarchyTotals.sites}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Compounds</CardTitle>
                        <CardDescription>Storage groups within each site</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-foreground">{hierarchyTotals.compounds}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cells</CardTitle>
                        <CardDescription>Cells monitored per compound</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-foreground">{hierarchyTotals.cells}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sensors</CardTitle>
                        <CardDescription>Active sensors across all cells</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold text-foreground">{hierarchyTotals.sensors}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                {siteInventory.map((site) => {
                    const compoundCount = site.compounds.length;
                    const cellCount = site.compounds.reduce((count, compound) => count + compound.cells.length, 0);
                    const sensorCount = site.compounds.reduce(
                        (count, compound) => count + compound.cells.reduce((cellTotal, cell) => cellTotal + cell.sensors, 0),
                        0,
                    );

                    return (
                        <Card key={site.id} className="border-border/80">
                            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <CardTitle className="text-lg text-foreground">{site.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                                            Organization
                                        </Badge>
                                        <span className="text-sm text-foreground">{site.organization}</span>
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline">Trades: {site.tradesThisMonth}</Badge>
                                    <Badge variant="outline" className="border-orange-200 text-orange-600">
                                        Alerts: {site.openAlerts}
                                    </Badge>
                                    <Badge variant="outline" className="border-blue-200 text-blue-600">
                                        Triggers: {site.triggers}
                                    </Badge>
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                        Invites: {site.pendingInvites}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="border border-border rounded-lg p-3">
                                        <p className="text-sm text-muted-foreground">Compounds</p>
                                        <p className="text-xl font-semibold text-foreground">{compoundCount}</p>
                                    </div>
                                    <div className="border border-border rounded-lg p-3">
                                        <p className="text-sm text-muted-foreground">Cells</p>
                                        <p className="text-xl font-semibold text-foreground">{cellCount}</p>
                                    </div>
                                    <div className="border border-border rounded-lg p-3">
                                        <p className="text-sm text-muted-foreground">Sensors</p>
                                        <p className="text-xl font-semibold text-foreground">{sensorCount}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {site.compounds.map((compound) => (
                                        <div key={compound.id} className="border border-border rounded-lg p-4">
                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-base font-semibold text-foreground">{compound.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {compound.cells.length} cells · {compound.cells.reduce((count, cell) => count + cell.sensors, 0)} sensors
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="w-fit">Compound</Badge>
                                            </div>

                                            <Table className="mt-3">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Cell</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Sensors</TableHead>
                                                        <TableHead>Recent Metric</TableHead>
                                                        <TableHead>Open Alerts</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {compound.cells.map((cell) => (
                                                        <TableRow key={cell.id}>
                                                            <TableCell className="font-medium text-foreground">{cell.name}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="capitalize">
                                                                    {cell.status.toLowerCase()}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>{cell.sensors}</TableCell>
                                                            <TableCell className="text-muted-foreground">{cell.recentMetric}</TableCell>
                                                            <TableCell>
                                                                {cell.alerts > 0 ? (
                                                                    <Badge variant="outline" className="border-orange-200 text-orange-600">
                                                                        {cell.alerts} alert{cell.alerts > 1 ? 's' : ''}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">None</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}