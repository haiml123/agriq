'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/theme/ThemeToggle'
import { useTheme } from '@/theme/ThemeProvider'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { signOut } from 'next-auth/react'

interface Tab {
    label: string
    href: string
}

interface AppHeaderProps {
    title: string
    subtitle?: string
    tabs?: Tab[]
}

export function AppHeader({ title, subtitle, tabs }: AppHeaderProps) {
    const t = useTranslations('navigation')
    const pathname = usePathname()
    const { theme } = useTheme()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const defaultTabs: Tab[] = [
        { label: t('dashboard'), href: "/dashboard" },
        { label: t('sites'), href: "/sites" },
        { label: t('alerts'), href: "/alerts" },
        { label: t('settings'), href: "/settings" },
        { label: t('admin'), href: "/admin" },
    ]

    const navTabs = tabs || defaultTabs

    const isActiveTab = (href: string) => {
        // Remove locale prefix from pathname (e.g., /en/alerts -> /alerts)
        const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/')

        if (href === "/dashboard") {
            return pathWithoutLocale === "/dashboard" || pathWithoutLocale === "/" || pathname === "/"
        }
        return pathWithoutLocale.startsWith(href)
    }

    return (
        <>
            {/* Top section - scrolls away */}
            <div className="border-b border-border bg-background shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        {/* Logo */}
                        <img
                            src={theme === 'light' ? '/logo-black.png' : '/logo-white.png'}
                            alt="Logo"
                            className="h-10 w-auto"
                        />
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher />
                            <ThemeToggle />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                aria-label={t('logout')}
                                title={t('logout')}
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Toggle menu"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="hidden md:block sticky top-0 z-50 border-b border-border bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
                    {navTabs.map((tab) => {
                        const isActive = isActiveTab(tab.href)
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`
                  px-4 py-3 text-sm font-medium transition-colors relative
                  ${isActive ? "text-emerald-500" : "text-muted-foreground hover:text-foreground"}
                `}
                            >
                                {tab.label}
                                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Side Menu */}
                    <div className="fixed top-0 right-0 bottom-0 w-64 bg-background border-l border-border z-50 md:hidden shadow-lg">
                        <div className="flex flex-col h-full">
                            {/* Menu Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <h2 className="text-lg font-semibold text-foreground">{t('menu')}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Menu Items */}
                            <nav className="flex flex-col p-2 gap-1 flex-1">
                                {navTabs.map((tab) => {
                                    const isActive = isActiveTab(tab.href)
                                    return (
                                        <Link
                                            key={tab.href}
                                            href={tab.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`
                                                px-4 py-3 rounded-md text-sm font-medium transition-colors
                                                ${
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-foreground hover:bg-accent"
                                            }
                                            `}
                                        >
                                            {tab.label}
                                        </Link>
                                    )
                                })}
                            </nav>

                            {/* Logout Button */}
                            <div className="p-2 border-t border-border">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    {t('logout')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
