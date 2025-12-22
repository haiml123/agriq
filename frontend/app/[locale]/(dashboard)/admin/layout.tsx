"use client";

import { Building2, Table2, Wheat, Zap } from 'lucide-react';
import { AppSidebarLayout, NavItem } from '@/components/layout/app-sidebar-layout';
import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface AlertsLayoutProps {
    children: ReactNode;
}

export default function AlertsLayout({ children }: AlertsLayoutProps) {
    const t = useTranslations('admin');

    const alertsMenuItems: NavItem[] = [
        {
            label: t('organizations'),
            href: "/admin/organizations",
            icon: Building2,
        },
        {
            label: t('triggers'),
            href: "/admin/triggers",
            icon: Zap,
        },
        {
            label: t('commodities'),
            href: "/admin/commodities",
            icon: Wheat,
        },
        {
            label: t('lookupTables'),
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

    return (
        <AppSidebarLayout menuItems={alertsMenuItems} title={t('menu')}>
            {children}
        </AppSidebarLayout>
    );
}
