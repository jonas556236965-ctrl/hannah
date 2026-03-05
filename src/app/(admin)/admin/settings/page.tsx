import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChangePasswordForm } from "@/components/settings/change-password-form"

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    if (!user) redirect("/login")

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
                <p className="text-muted-foreground mt-1">Verwalte deinen Account</p>
            </div>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Account-Informationen</CardTitle>
                    <CardDescription>Deine aktuellen Account-Details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm font-medium">{user.name || "–"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">E-Mail</span>
                        <span className="text-sm font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Rolle</span>
                        <span className="text-sm font-medium">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                                {user.role}
                            </span>
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Mitglied seit</span>
                        <span className="text-sm font-medium">{user.createdAt.toLocaleDateString("de-DE")}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle>Passwort ändern</CardTitle>
                    <CardDescription>Wähle ein sicheres Passwort mit mindestens 8 Zeichen</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChangePasswordForm userId={user.id} />
                </CardContent>
            </Card>
        </div>
    )
}
