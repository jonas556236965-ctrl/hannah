import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getProjectIdsForUser } from "@/lib/rls"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { statusLabel, actionLabel } from "@/lib/utils"

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
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Leads Übersicht</h1>
            </div>

            <Card className="flex-1 overflow-auto shadow-xl border-none bg-white">
                <CardHeader className="bg-white/50 border-b border-gray-100 pb-4">
                    <CardTitle className="text-gray-800">Deine Leads</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-gray-500 font-medium">Projekt</TableHead>
                                <TableHead className="text-gray-500 font-medium">Status</TableHead>
                                <TableHead className="text-gray-500 font-medium">Name / Firma</TableHead>
                                <TableHead className="text-gray-500 font-medium">Letzte Aktivität</TableHead>
                                <TableHead className="text-right text-gray-500 font-medium">Aktionen</TableHead>
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
                                    <TableRow key={lead.id} className={`group hover:bg-gray-50 transition-colors ${followUpDue ? "bg-red-50/50" : ""}`}>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none font-medium text-xs">{lead.project.name}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="shadow-sm border-gray-200 text-gray-700 bg-white">{statusLabel(lead.status)}</Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-gray-900">
                                            {mainName}
                                            {followUpDue && <Badge variant="destructive" className="ml-2 text-[10px] h-4 shadow-sm border-none">Follow-Up fällig</Badge>}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-gray-500">
                                            {lead.activities.length > 0 ? (
                                                <span>{actionLabel(lead.activities[0].action)} ({new Date(lead.activities[0].createdAt).toLocaleDateString()})</span>
                                            ) : (
                                                "Neu eingegangen"
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/leads/${lead.id}`}>
                                                <Button variant="secondary" size="sm" className="shadow-sm hover:shadow transition-all bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Akte öffnen</Button>
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
