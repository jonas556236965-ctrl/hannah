import { prisma } from "@/lib/prisma"
import { requireProjectAccess } from "@/lib/rls"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { createProject, deleteProject } from "@/app/actions/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProjectsPage() {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") redirect("/")

    const projects = await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { leads: true, members: true }
            }
        }
    })

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Projekte</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Neues Projekt erstellen</CardTitle>
                        <CardDescription>
                            Füge ein neues Projekt für dein CRM hinzu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createProject} className="flex space-x-2">
                            <Input name="name" placeholder="Name des Projekts" required />
                            <Button type="submit">Erstellen</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Card className="flex-1 overflow-auto">
                <CardHeader>
                    <CardTitle>Alle Projekte</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>API Key</TableHead>
                                <TableHead className="text-right">Mitglieder</TableHead>
                                <TableHead className="text-right">Leads</TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-mono text-xs">{project.id}</TableCell>
                                    <TableCell className="font-medium">{project.name}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{project.apiKey}</TableCell>
                                    <TableCell className="text-right">{project._count.members}</TableCell>
                                    <TableCell className="text-right">{project._count.leads}</TableCell>
                                    <TableCell className="text-right">
                                        <form action={deleteProject.bind(null, project.id)}>
                                            <Button variant="destructive" size="sm" type="submit">
                                                Löschen
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {projects.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                                        Bisher keine Projekte vorhanden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
