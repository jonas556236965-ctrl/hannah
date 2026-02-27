import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { createUser, toggleUserBlock, assignProjectToUser, removeProjectFromUser } from "@/app/actions/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function UsersPage() {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") redirect("/")

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            projects: {
                include: {
                    project: true
                }
            }
        }
    })

    const projects = await prisma.project.findMany({
        orderBy: { name: "asc" }
    })

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Benutzer & Berechtigungen</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Neuen Benutzer erstellen</CardTitle>
                        <CardDescription>
                            Füge einen neuen Mitarbeiter (User) oder Admin hinzu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createUser} className="flex flex-col space-y-3">
                            <Input name="name" placeholder="Name" required />
                            <Input type="email" name="email" placeholder="E-Mail" required />
                            <Input type="password" name="password" placeholder="Passwort" required />
                            <Button type="submit">Erstellen</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Card className="flex-1 overflow-auto">
                <CardHeader>
                    <CardTitle>Alle Benutzer</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>E-Mail</TableHead>
                                <TableHead>Rolle</TableHead>
                                <TableHead>Zugewiesene Projekte</TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const isBlocked = user.role === "BLOCKED"
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {isBlocked ? (
                                                <Badge variant="destructive">Gesperrt</Badge>
                                            ) : (
                                                <Badge variant="outline">{user.role}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {user.projects.map(pm => (
                                                    <div key={pm.projectId} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                                                        {pm.project.name}
                                                        <form action={removeProjectFromUser.bind(null, user.id, pm.projectId)}>
                                                            <button type="submit" className="text-muted-foreground hover:text-foreground ml-1">&times;</button>
                                                        </form>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Only allow project assignment if not Admin, because Admins can see all */}
                                            {user.role !== "ADMIN" && (
                                                <form action={async (formData) => {
                                                    "use server"
                                                    const pId = formData.get("projectId") as string
                                                    if (pId) await assignProjectToUser(user.id, pId)
                                                }} className="flex gap-2">
                                                    <select name="projectId" className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                                        <option value="">+ Projekt</option>
                                                        {projects.filter(p => !user.projects.some(up => up.projectId === p.id)).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button size="sm" type="submit" variant="secondary">Hinzufügen</Button>
                                                </form>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <form action={toggleUserBlock.bind(null, user.id, isBlocked)}>
                                                <Button
                                                    variant={isBlocked ? "outline" : "destructive"}
                                                    size="sm"
                                                    type="submit"
                                                    disabled={user.role === "ADMIN"}
                                                >
                                                    {isBlocked ? "Entsperren" : "Sperren"}
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
