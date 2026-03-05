"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, FolderKanban, Settings, LogOut, FileBox } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
    userRole: string
}

export function Sidebar({ userRole }: SidebarProps) {
    const pathname = usePathname()

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Leads", href: "/leads", icon: FileBox },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ]

    if (userRole === "ADMIN") {
        navItems.splice(2, 0,
            { name: "Projects", href: "/admin/projects", icon: FolderKanban },
            { name: "Users", href: "/admin/users", icon: Users },
        )
    }

    return (
        <aside className="w-64 border-r bg-card flex flex-col">
            <div className="h-16 flex items-center px-6 border-b">
                <span className="font-bold text-lg tracking-tight">Hannah CRM</span>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    pathname === item.href || pathname.startsWith(item.href + "/")
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t">
                <Link
                    href="/api/auth/signout"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Link>
            </div>
        </aside>
    )
}
