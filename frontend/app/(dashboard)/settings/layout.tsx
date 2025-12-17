"use client";
import { Info, Languages, Users, Warehouse } from 'lucide-react'
import { AppSidebarLayout, NavItem } from '@/components/layout/app-sidebar-layout';
import { ReactNode } from 'react';
import { RoleTypeEnum } from '@/schemas/common.schema';

interface SettingsLayoutProps {
    children: ReactNode
}

const settingsMenuItems: NavItem[] = [
    {
        label: 'Sites',
        href: '/settings/sites',
        icon: Warehouse,
    },
    {
        label: "Users and Roles",
        href: "/settings/users",
        icon: Users,
        roles: [RoleTypeEnum.SUPER_ADMIN, RoleTypeEnum.ORG_ADMIN]
    },
    {
        label: "Languages",
        href: "/settings/languages",
        icon: Languages,
    },
    {
        label: "About",
        href: "/settings/about",
        icon: Info,
    },
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <AppSidebarLayout menuItems={settingsMenuItems} title="Settings">
            {children}
        </AppSidebarLayout>
    )
}
