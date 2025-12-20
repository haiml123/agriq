"use client";

import { Building2, Table2, Wheat, Zap } from 'lucide-react';
import { AppSidebarLayout, NavItem } from '@/components/layout/app-sidebar-layout';
import { ReactNode } from 'react';

interface AlertsLayoutProps {
    children: ReactNode;
}

const alertsMenuItems: NavItem[] = [
    {
        label: "Organizations",
        href: "/admin/organizations",
        icon: Building2,
    },
    {
        label: "Triggers",
        href: "/admin/triggers",
        icon: Zap,
    },
    {
        label: "Commodities",
        href: "/admin/commodities",
        icon: Wheat,
    },
    {
        label: "Lookup tables",
        href: "/admin/lookup-tables",
        icon: Table2,
    },

    // Future menu items can be added here:
    // {
    //     label: "Alert History",
    //     href: "/alerts/history",
    //     icon: History,
    // },
    // {
    //     label: "Notifications",
    //     href: "/alerts/notifications",
    //     icon: Bell,
    // },
];

export default function AlertsLayout({ children }: AlertsLayoutProps) {
    return (
        <AppSidebarLayout menuItems={alertsMenuItems} title="Alerts">
            {children}
        </AppSidebarLayout>
    );
}
