import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getProjectIdsForUser } from "@/lib/rls"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { statusLabel } from "@/lib/utils"

export default async function LeadsPage() {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const projectIds = await getProjectIdsForUser(session.user.id)

    const leads = await prisma.lead.findMany({
        where: {
            projectId: { in: projectIds },
            deletedAt: null // Exclude soft-deleted leads
        },
        orderBy: { createdAt: "desc" },
        include: {
            project: true,
            activities: {
                orderBy: { createdAt: "desc" },
                take: 1
            }
        }
    })

    // To highlight follow-ups, we check the dynamic data
    // Next step: implement parsing the "follow_up_date" from dynamicData if it exists
    const isFollowUpDue = (dynamicData: string) => {
        try {
            const data = JSON.parse(dynamicData)
            const followUp = data["follow_up_date"] // Assuming there's a field with this key
            if (followUp) {
                const date = new Date(followUp)
                const today = new Date()
                return date.toDateString() === today.toDateString() || date < today
            }
        } catch (e) { }
        return false
    }

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Leads Übersicht</h1>
            </div>

            <Card className="flex-1 overflow-auto">
                <CardHeader>
                    <CardTitle>Deine Leads</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Projekt</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Name / Firma</TableHead>
                                <TableHead>Letzte Aktivität</TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.map((lead) => {
                                let parsedData: any = {}
                                try {
                                    parsedData = JSON.parse(lead.dynamicData)
                                } catch (e) { }

                                const followUpDue = isFollowUpDue(lead.dynamicData)
                                const mainName = parsedData["name"] || parsedData["company"] || "Unbekannt"

                                return (
                                    <TableRow key={lead.id} className={followUpDue ? "bg-red-50 dark:bg-red-950/20" : ""}>
                                        <TableCell>
                                            <Badge variant="outline">{lead.project.name}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge>{statusLabel(lead.status)}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {mainName}
                                            {followUpDue && <Badge variant="destructive" className="ml-2 text-[10px] h-4">Follow-Up fällig</Badge>}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {lead.activities.length > 0 ? (
                                                <span>{lead.activities[0].action} ({new Date(lead.activities[0].createdAt).toLocaleDateString()})</span>
                                            ) : (
                                                "Neu eingegangen"
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/leads/${lead.id}`}>
                                                <Button variant="secondary" size="sm">Akte öffnen</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {leads.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Keine Leads für deine Projekte gefunden.
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
