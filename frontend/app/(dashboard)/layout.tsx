'use client';

import { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                title="Dashboard"
                subtitle="Operational Overview"
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}