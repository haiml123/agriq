import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { SessionProvider } from '@/components/providers/session-provider'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <SessionProvider>
            <div className="min-h-screen bg-background">
                <AppHeader title="Dashboard" subtitle="Operational Overview" />
                {children}
            </div>
        </SessionProvider>
    )
}
