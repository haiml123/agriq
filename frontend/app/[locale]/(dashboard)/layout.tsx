'use client'

import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { SessionProvider } from '@/components/providers/session-provider'
import { useTranslations } from 'next-intl'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const t = useTranslations('dashboard')

    return (
        <SessionProvider>
            <div className="min-h-screen bg-background">
                <AppHeader title={t('title')} subtitle={t('subtitle')} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </div>
        </SessionProvider>
    )
}
