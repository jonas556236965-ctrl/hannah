"use client"

import { signOut } from "next-auth/react"
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
            <div className="h-24 flex justify-center items-center px-6 border-b">
                <img src="/logo.png" alt="Hannah Noethig Logo" className="max-h-16 w-auto object-contain" />
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
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
    )
}
