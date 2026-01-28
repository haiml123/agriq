"use client";
import { Cpu, Info, Users, Warehouse } from 'lucide-react'
import { AppSidebarLayout, NavItem } from '@/components/layout/app-sidebar-layout';
import { ReactNode } from 'react';
import { RoleTypeEnum } from '@/schemas/common.schema';
import { useTranslations } from 'next-intl';

interface SettingsLayoutProps {
    children: ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const t = useTranslations('settings');

    const settingsMenuItems: NavItem[] = [
        {
            label: t('sites'),
            href: '/settings/sites',
            icon: Warehouse,
        },
        {
            label: t('usersAndRoles'),
            href: "/settings/users",
            icon: Users,
            roles: [RoleTypeEnum.SUPER_ADMIN, RoleTypeEnum.ADMIN]
        },
        {
            label: t('gateways'),
            href: "/settings/gateways",
            icon: Cpu,
            roles: [RoleTypeEnum.SUPER_ADMIN, RoleTypeEnum.ADMIN]
        },
        {
            label: t('about'),
            href: "/settings/about",
            icon: Info,
        },
    ];

    return (
        <AppSidebarLayout menuItems={settingsMenuItems} title={t('title')}>
            {children}
        </AppSidebarLayout>
    )
}
