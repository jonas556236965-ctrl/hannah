import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getProjectIdsForUser } from "@/lib/rls"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { statusLabel } from "@/lib/utils"

const STATUS_CONFIG = [
    { value: "NEW", label: "Neu", color: "bg-slate-500", light: "bg-slate-50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-700", text: "text-slate-700 dark:text-slate-300" },
    { value: "CONTACTED", label: "Kontaktiert", color: "bg-blue-500", light: "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700", text: "text-blue-700 dark:text-blue-300" },
    { value: "QUALIFIED", label: "Qualifiziert", color: "bg-yellow-500", light: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700", text: "text-yellow-700 dark:text-yellow-300" },
    { value: "WON", label: "Gewonnen", color: "bg-green-500", light: "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700", text: "text-green-700 dark:text-green-300" },
    { value: "LOST", label: "Verloren", color: "bg-red-500", light: "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700", text: "text-red-700 dark:text-red-300" },
]

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    const { status: filterStatus } = await searchParams
    const projectIds = await getProjectIdsForUser(session.user.id)

    // Get counts per status
    const allLeads = await prisma.lead.findMany({
        where: { projectId: { in: projectIds }, deletedAt: null },
        select: { id: true, status: true, dynamicData: true, createdAt: true, project: { select: { name: true } } }
    })

    const statusCounts = STATUS_CONFIG.map(s => ({
        ...s,
        count: allLeads.filter(l => l.status === s.value).length
    }))

    // Filter leads for table
    const filteredLeads = filterStatus
        ? allLeads.filter(l => l.status === filterStatus)
        : allLeads

    const totalLeads = allLeads.length
    const wonLeads = allLeads.filter(l => l.status === "WON").length
    const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Übersicht aller Leads und Stati</p>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-bold">{totalLeads}</div>
                        <p className="text-sm text-muted-foreground mt-1">Leads gesamt</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-bold text-green-600">{wonLeads}</div>
                        <p className="text-sm text-muted-foreground mt-1">Gewonnen</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-bold text-blue-600">{winRate}%</div>
                        <p className="text-sm text-muted-foreground mt-1">Abschlussquote</p>
                    </CardContent>
                </Card>
            </div>

            {/* Status Cards – clickable filter */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Nach Status filtern</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {statusCounts.map(s => (
                        <Link
                            key={s.value}
                            href={filterStatus === s.value ? "/dashboard" : `/dashboard?status=${s.value}`}
                        >
                            <div className={`rounded-xl border p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-md ${s.light} ${filterStatus === s.value ? "ring-2 ring-offset-2 ring-current shadow-md" : ""}`}>
                                <div className={`text-3xl font-bold ${s.text}`}>{s.count}</div>
                                <div className={`text-sm font-medium mt-1 ${s.text}`}>{s.label}</div>
                                <div className={`mt-2 h-1 rounded-full ${s.color} opacity-60`} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Lead Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {filterStatus ? (
                            <>
                                Leads mit Status: <span className={`font-bold`}>{statusLabel(filterStatus)}</span>
                                <Link href="/dashboard" className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">
                                    Filter zurücksetzen
                                </Link>
                            </>
                        ) : "Alle Leads"}
                        <span className="text-sm font-normal text-muted-foreground ml-auto">
                            {filteredLeads.length} {filteredLeads.length === 1 ? "Lead" : "Leads"}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Projekt</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Eingegangen am</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        Keine Leads für diesen Status.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredLeads.map(lead => {
                                let parsed: any = {}
                                try { parsed = JSON.parse(lead.dynamicData) } catch { }
                                const name = parsed["name"] || parsed["company"] || "Unbekannt"
                                const cfg = STATUS_CONFIG.find(s => s.value === lead.status)
                                return (
                                    <TableRow key={lead.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/leads/${lead.id}`} className="hover:underline">
                                                {name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{lead.project.name}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.light ?? ""} ${cfg?.text ?? ""} border`}>
                                                {statusLabel(lead.status)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(lead.createdAt).toLocaleDateString("de-DE")}
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
