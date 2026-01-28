"use client";

import { Building2, FlaskConical, Languages, Package, Table2, Wheat, Zap } from 'lucide-react';
import { AppSidebarLayout, NavItem } from '@/components/layout/app-sidebar-layout';
import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { RoleTypeEnum } from '@/schemas/common.schema';
import { useCurrentUser } from '@/hooks';

interface AlertsLayoutProps {
    children: ReactNode;
}

export default function AlertsLayout({ children }: AlertsLayoutProps) {
    const t = useTranslations('admin');
    const { user } = useCurrentUser();

    if (!user || user.userRole !== RoleTypeEnum.SUPER_ADMIN) {
        return null;
    }

    const alertsMenuItems: NavItem[] = [
        {
            label: t('organizations'),
            href: "/admin/organizations",
            icon: Building2,
            roles: [RoleTypeEnum.SUPER_ADMIN],
        },
        {
            label: t('triggers'),
            href: "/admin/triggers",
            icon: Zap,
            roles: [RoleTypeEnum.SUPER_ADMIN],
        },
        {
            label: t('commodities'),
            href: "/admin/commodities",
            icon: Wheat,
            roles: [RoleTypeEnum.SUPER_ADMIN],
        },
        {
            label: t('lookupTables'),
            href: "/admin/lookup-tables",
            icon: Table2,
            roles: [RoleTypeEnum.SUPER_ADMIN],
        },
        {
            label: t('translations'),
            href: "/admin/translations",
            icon: Languages,
            roles: [RoleTypeEnum.SUPER_ADMIN],
        },
        {
            label: t('simulator'),
            href: "/admin/simulator",
            icon: FlaskConical,
            roles: [RoleTypeEnum.SUPER_ADMIN],
        },
        {
            label: t('updates'),
            href: "/admin/updates",
            icon: Package,
            roles: [RoleTypeEnum.SUPER_ADMIN],
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
