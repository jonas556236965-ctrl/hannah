import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getProjectIdsForUser } from "@/lib/rls"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { statusLabel } from "@/lib/utils"
import { Users, Trophy, Percent, LayoutDashboard } from "lucide-react"

const STATUS_CONFIG = [
    { value: "NEW", label: "Neu", color: "bg-slate-400", light: "bg-slate-100", text: "text-slate-800" },
    { value: "CONTACTED", label: "Kontaktiert", color: "bg-blue-400", light: "bg-blue-50", text: "text-blue-900" },
    { value: "QUALIFIED", label: "Qualifiziert", color: "bg-yellow-400", light: "bg-yellow-50", text: "text-yellow-900" },
    { value: "WON", label: "Gewonnen", color: "bg-green-400", light: "bg-green-50", text: "text-green-900" },
    { value: "LOST", label: "Verloren", color: "bg-red-400", light: "bg-red-50", text: "text-red-900" },
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
            <div className="grid grid-cols-3 gap-6">
                <Card className="shadow-lg hover:shadow-xl transition-shadow border-none">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <Users className="absolute right-4 top-4 w-12 h-12 text-primary opacity-10" />
                        <div className="text-4xl md:text-5xl font-bold text-gray-900">{totalLeads}</div>
                        <p className="text-sm font-medium text-gray-500 mt-2">Leads gesamt</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg hover:shadow-xl transition-shadow border-none">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <Trophy className="absolute right-4 top-4 w-12 h-12 text-green-500 opacity-10" />
                        <div className="text-4xl md:text-5xl font-bold text-gray-900">{wonLeads}</div>
                        <p className="text-sm font-medium text-gray-500 mt-2">Gewonnen</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg hover:shadow-xl transition-shadow border-none">
                    <CardContent className="pt-6 relative overflow-hidden">
                        <Percent className="absolute right-4 top-4 w-12 h-12 text-blue-500 opacity-10" />
                        <div className="text-4xl md:text-5xl font-bold text-gray-900">{winRate}<span className="text-3xl">%</span></div>
                        <p className="text-sm font-medium text-gray-500 mt-2">Abschlussquote</p>
                    </CardContent>
                </Card>
            </div>

            {/* Status Cards – clickable filter */}
            <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-800">Nach Status filtern</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {statusCounts.map(s => (
                        <Link
                            key={s.value}
                            href={filterStatus === s.value ? "/dashboard" : `/dashboard?status=${s.value}`}
                        >
                            <div className={`rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${s.light} ${filterStatus === s.value ? "ring-2 ring-primary ring-offset-2 shadow-lg" : "shadow-sm border border-transparent"}`}>
                                <div className={`text-3xl font-bold ${s.text}`}>{s.count}</div>
                                <div className={`text-sm font-medium mt-1 ${s.text} opacity-80`}>{s.label}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Lead Table */}
            <Card className="shadow-xl border-none">
                <CardHeader className="bg-white/50 border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                        {filterStatus ? (
                            <>
                                Leads mit Status: <span className={`font-bold`}>{statusLabel(filterStatus)}</span>
                                <Link href="/dashboard" className="ml-auto text-xs text-primary hover:text-primary/80 underline font-medium">
                                    Filter zurücksetzen
                                </Link>
                            </>
                        ) : "Alle Leads"}
                        <span className="text-sm font-normal text-gray-500 ml-auto bg-gray-100 px-3 py-1 rounded-full">
                            {filteredLeads.length} {filteredLeads.length === 1 ? "Lead" : "Leads"}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-gray-500 font-medium">Name</TableHead>
                                <TableHead className="text-gray-500 font-medium">Projekt</TableHead>
                                <TableHead className="text-gray-500 font-medium">Status</TableHead>
                                <TableHead className="text-gray-500 font-medium whitespace-nowrap">Eingegangen am</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500 py-12">
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
                                    <TableRow key={lead.id} className="cursor-pointer hover:bg-gray-50 group transition-colors">
                                        <TableCell className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                            <Link href={`/leads/${lead.id}`} className="block">
                                                {name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none font-medium">{lead.project.name}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${cfg?.light ?? ""} ${cfg?.text ?? ""} border-none shadow-sm`}>
                                                {statusLabel(lead.status)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-gray-500">
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
