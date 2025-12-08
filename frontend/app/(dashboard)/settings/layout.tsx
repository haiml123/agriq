"use client";
import { Building2, Info, Languages, Shield, Users } from 'lucide-react'
import { AppSidebarLayout, NavItem } from '@/components/layout/app-sidebar-layout';
import { ReactNode } from 'react';
import { RoleTypeEnum } from '@/schemas/user.schema';

interface SettingsLayoutProps {
    children: ReactNode
}

const settingsMenuItems: NavItem[] = [
    {
        label: "Organizations",
        href: "/settings/organizations",
        icon: Building2,
        badge: <Shield className="ml-auto size-3 text-primary" />,
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
