"use client";
import { Building2, Info, Languages, Shield, Users } from 'lucide-react'
import { AppSidebarLayout, NavItem } from '@/components/layout/app-sidebar-layout';
import { ReactNode } from 'react';

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
