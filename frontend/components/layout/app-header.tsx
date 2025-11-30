'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/theme/ThemeToggle';

interface Tab {
    label: string;
    href: string;
}

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    tabs?: Tab[];
}

const defaultTabs: Tab[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sites', href: '/sites' },
    { label: 'Alerts', href: '/alerts' },
    { label: 'Settings', href: '/settings' },
];

export function AppHeader({ title, subtitle, tabs = defaultTabs }: AppHeaderProps) {
    const pathname = usePathname();

    const isActiveTab = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard' || pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <header className="border-b border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top section with title and theme toggle */}
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        {/* Logo/Icon */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm text-muted-foreground">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <ThemeToggle />
                </div>

                {/* Navigation Tabs */}
                <nav className="flex gap-1">
                    {tabs.map((tab) => {
                        const isActive = isActiveTab(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`
                                    px-4 py-3 text-sm font-medium transition-colors relative
                                    ${isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
                                `}
                            >
                                {tab.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}