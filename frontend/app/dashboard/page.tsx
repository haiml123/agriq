'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/theme/ThemeProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface Alert {
    id: string;
    severity: AlertSeverity;
    site: string;
    cell: string;
    details: string;
    trigger: string;
    created: string;
}

const mockAlerts: Alert[] = [
    {
        id: '1',
        severity: 'LOW',
        site: 'Ashdod',
        cell: '1',
        details: 'Temperature raised 5° in 2 days to 32°',
        trigger: 'Temperature',
        created: '18.05.2025, 12:30',
    },
    {
        id: '2',
        severity: 'HIGH',
        site: 'Ashdod',
        cell: '3',
        details: 'Humidity at 65%',
        trigger: 'Humidity',
        created: '16.05.2025, 04:15',
    },
    {
        id: '3',
        severity: 'MEDIUM',
        site: 'Ashdod',
        cell: '9',
        details: 'Humidity at 50%',
        trigger: 'Humidity',
        created: '18.05.2025, 11:45',
    },
];

const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/sites', label: 'Sites' },
    { href: '/alerts', label: 'Alerts' },
    { href: '/settings', label: 'Settings' },
];

function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="flex gap-6 border-b border-border">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`relative py-3 text-sm font-medium transition-colors ${
                            isActive ? 'text-primary-500' : 'text-foreground/60 hover:text-foreground'
                        }`}
                    >
                        {item.label}
                        {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
                    </Link>
                );
            })}
        </nav>
    );
}

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
    );
}

export default function AlertsPage() {
    const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        site: 'all',
        severity: 'all',
        status: 'all',
        assignee: 'all',
        time: '7d',
    });

    const allSelected = selectedAlerts.size === mockAlerts.length && mockAlerts.length > 0;

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAlerts(new Set(mockAlerts.map(a => a.id)));
        } else {
            setSelectedAlerts(new Set());
        }
    };

    const toggleSelectAlert = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedAlerts);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedAlerts(newSelected);
    };

    const getSeverityVariant = (severity: AlertSeverity) => {
        return severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-6 py-8">
                <header className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
                            <p className="text-sm text-foreground/60">Global Alert Management</p>
                        </div>
                        <ThemeToggle />
                    </div>
                    <Navigation />
                </header>

                <div className="mt-8 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                        <Input
                            type="text"
                            placeholder="Search alerts... (site / compound / cell / sensor / assignee)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={filters.site} onValueChange={(value) => setFilters({ ...filters, site: value })}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Sites" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sites</SelectItem>
                                <SelectItem value="ashdod">Ashdod</SelectItem>
                                <SelectItem value="haifa">Haifa</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Severities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severities</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="dismissed">Dismissed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.assignee} onValueChange={(value) => setFilters({ ...filters, assignee: value })}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Assignees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Assignees</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                <SelectItem value="me">Assigned to me</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.time} onValueChange={(value) => setFilters({ ...filters, time: value })}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Last 7 Days" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                <SelectItem value="90d">Last 90 Days</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" size="sm">Acknowledge Selected</Button>
                        <Button variant="outline" size="sm">Assign Selected</Button>
                        <Button variant="outline" size="sm">Resolve Selected</Button>
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface-secondary/50 hover:bg-surface-secondary/50">
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Site</TableHead>
                                    <TableHead>Cell</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Trigger</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockAlerts.map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedAlerts.has(alert.id)}
                                                onCheckedChange={(checked) => toggleSelectAlert(alert.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge>
                                                {alert.severity.charAt(0) + alert.severity.slice(1).toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{alert.site}</TableCell>
                                        <TableCell>{alert.cell}</TableCell>
                                        <TableCell className="text-foreground/70">{alert.details}</TableCell>
                                        <TableCell>{alert.trigger}</TableCell>
                                        <TableCell className="text-foreground/60">{alert.created}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}