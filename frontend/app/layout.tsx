import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
    title: 'AgriQ - Grain Storage Management',
    description: 'Quality protection, loss reduction, action at the right time',
    icons: {
        icon: '/favicon.ico',
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
