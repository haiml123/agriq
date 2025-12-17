'use client'

import type React from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import Link from 'next/link';
import { RoleType } from '@/schemas/user.schema';
import { useCurrentUser } from '@/hooks'

export interface NavItem {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badge?: React.ReactNode
    roles?: RoleType[]
}

interface SidebarContextValue {
    open: boolean
    setOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarTrigger({ className }: { className?: string }) {
    const context = useContext(SidebarContext)
    if (!context) return null

    return (
        <Button
            variant="outline"
            size="icon"
            className={`md:hidden ${className ?? ""}`}
            onClick={() => context.setOpen(true)}
        >
            <Menu className="size-5" />
        </Button>
    )
}

interface AppSidebarLayoutProps {
    children: React.ReactNode
    menuItems: NavItem[]
    title?: string
}

interface SidebarContentProps {
    menuItems: NavItem[]
    pathname: string
    setOpen: (open: boolean) => void
}

function SidebarContent({ menuItems, pathname, setOpen }: SidebarContentProps) {
    return (
        <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen ? setOpen(false): undefined}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        }`}
                    >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                        {item.badge}
                    </Link>
                )
            })}
        </nav>
    )
}

export function AppSidebarLayout({ children, menuItems, title = "Menu" }: AppSidebarLayoutProps) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const { user } = useCurrentUser()

    const allowedMenuItems = useMemo(() => {
        if (!user?.userRole) return menuItems
        return menuItems.filter(item => !item.roles || item.roles.includes(user.userRole as RoleType))
    }, [menuItems, user?.userRole])

    return (
        <SidebarContext.Provider value={{ open, setOpen }}>
            <div className="flex w-full gap-6 p-6">
                {/* Desktop Sidebar */}
                <aside className="hidden md:block w-64 shrink-0">
                    <div className="sticky top-6">
                        <h2 className="mb-4 px-3 text-lg font-semibold">{title}</h2>
                        <SidebarContent menuItems={allowedMenuItems} pathname={pathname} setOpen={setOpen} />
                    </div>
                </aside>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent side="left" className="w-64">
                        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
                        <SidebarContent menuItems={allowedMenuItems} pathname={pathname} setOpen={setOpen} />
                    </SheetContent>
                </Sheet>

                {/* Main Content */}
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </SidebarContext.Provider>
    )
}
