import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getProjectIdsForUser } from "@/lib/rls"
import Link from "next/link"
import { ArrowLeft, Phone, Calendar as CalendarIcon, FilePenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { updateLeadFields, updateLeadStatus, addLeadNote, logCall, updateContactFields } from "@/app/actions/lead"
import { statusLabel, actionLabel } from "@/lib/utils"
import { Mail, Phone as PhoneIcon, StickyNote, Loader2 } from "lucide-react"
import { SubmitButton } from "@/components/ui/submit-button"

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) redirect("/api/auth/signin")

    const { id } = await params
    const projectIds = await getProjectIdsForUser(session.user.id)

    const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
            project: {
                include: {
                    fieldConfigs: { orderBy: { orderIndex: "asc" } }
                }
            },
            activities: {
                orderBy: { createdAt: "desc" },
                include: { user: { select: { name: true } } }
            }
        }
    })

    if (!lead || !projectIds.includes(lead.projectId)) {
        redirect("/leads")
    }

    let dynamicData: any = {}
    try {
        dynamicData = JSON.parse(lead.dynamicData)
    } catch (e) { }

    const mainName = dynamicData["name"] || dynamicData["company"] || "Unbekannter Lead"

    return (
        <div className="space-y-6 flex flex-col h-full max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/leads">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{mainName}</h1>
                            <Badge variant="outline" className="text-xs uppercase">{statusLabel(lead.status)}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                            Projekt: <span className="font-medium text-foreground">{lead.project.name}</span>
                        </p>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-2">
                    {/* Status Changer */}
                    <form action={async (formData) => {
                        "use server"
                        const st = formData.get("status") as string
                        if (st) await updateLeadStatus(lead.id, st)
                    }} className="flex items-center gap-2 mr-4">
                        <select name="status" defaultValue={lead.status} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                            <option value="NEW">Neu</option>
                            <option value="CONTACTED">Kontaktiert</option>
                            <option value="QUALIFIED">Qualifiziert</option>
                            <option value="WON">Gewonnen</option>
                            <option value="LOST">Verloren</option>
                        </select>
                        <Button type="submit" variant="secondary" size="sm">Status setzen</Button>
                    </form>

                    {/* Quick Actions (Call, Note) - handled in the Feed section below or modals, but we can do a prompt here for simplicity */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 flex-1 items-start">

                {/* LEFT COLUMN: Stammdaten + Kontakt */}
                <div className="flex flex-col gap-6">
                    <Card className="sticky top-6 shadow-xl border-none">
                        <CardHeader className="bg-white/50 border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg flex justify-between items-center text-gray-800">
                                <span>Stammdaten</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form action={updateLeadFields.bind(null, lead.id)} className="space-y-4">
                                {lead.project.fieldConfigs.map(field => {
                                    const val = dynamicData[field.internalKey] || ""
                                    return (
                                        <div key={field.id} className="space-y-1">
                                            <Label htmlFor={field.internalKey} className="font-semibold">
                                                {field.name} {field.isRequired && <span className="text-destructive">*</span>}
                                            </Label>
                                            {field.type === "TEXTAREA" ? (
                                                <textarea
                                                    id={field.internalKey}
                                                    name={field.internalKey}
                                                    required={field.isRequired}
                                                    defaultValue={val}
                                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            ) : field.type === "CHECKBOX" ? (
                                                <div className="flex items-center space-x-2 pt-1 pb-2">
                                                    <input
                                                        type="checkbox"
                                                        id={field.internalKey}
                                                        name={field.internalKey}
                                                        defaultChecked={val === "on" || val === true || val === "true"}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                    <span className="text-sm">Ja</span>
                                                </div>
                                            ) : (
                                                <Input
                                                    id={field.internalKey}
                                                    name={field.internalKey}
                                                    type={field.type === "DATE" ? "date" : field.type === "NUMBER" ? "number" : "text"}
                                                    required={field.isRequired}
                                                    defaultValue={val}
                                                />
                                            )}
                                        </div>
                                    )
                                })}

                                <div className="space-y-4 pt-6 mt-6 border-t">
                                    <h3 className="font-semibold text-lg text-foreground">Kontakt & Interne Notizen</h3>
                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="font-semibold">E-Mail Adresse</Label>
                                        <Input id="email" name="email" type="email" placeholder="name@beispiel.de" defaultValue={lead.email ?? ""} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="phone" className="font-semibold">Telefonnummer</Label>
                                        <Input id="phone" name="phone" type="tel" placeholder="+49 123 456789" defaultValue={lead.phone ?? ""} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="notes" className="font-semibold">Interne Notizen</Label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            defaultValue={lead.notes ?? ""}
                                            placeholder="Notizen für das Team..."
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t">
                                    <SubmitButton className="w-full">
                                        <FilePenLine className="w-4 h-4 mr-2" /> Alle Daten Speichern
                                    </SubmitButton>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Activity Feed */}


                <div className="flex flex-col gap-6">
                    {/* Action Boxes */}
                    <Card className="shadow-lg border-none">
                        <CardHeader className="pl-6 pb-3 pt-5 border-b border-gray-100 bg-white/50"><CardTitle className="text-sm text-gray-800">Schnellaktionen</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3 p-6">
                            <form action={async (formData) => {
                                "use server"
                                const summary = formData.get("summary") as string
                                if (summary) await logCall(lead.id, summary)
                            }}>
                                <Input name="summary" placeholder="Anruf Kurznotiz..." className="h-8 text-xs mb-2" required />
                                <SubmitButton size="sm" variant="outline" className="w-full text-xs h-8"><Phone className="w-3 h-3 mr-1" />Anruf loggen</SubmitButton>
                            </form>
                            <form action={async (formData) => {
                                "use server"
                                const note = formData.get("note") as string
                                if (note) await addLeadNote(lead.id, note)
                            }}>
                                <Input name="note" placeholder="Notiztext..." className="h-8 text-xs mb-2" required />
                                <SubmitButton size="sm" variant="outline" className="w-full text-xs h-8"><FilePenLine className="w-3 h-3 mr-1" />Notiz hinzufügen</SubmitButton>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 shadow-xl border-none">
                        <CardHeader className="bg-white/50 border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                                Timeline & Aktivität
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="relative border-l pl-4 ml-2 space-y-6">
                                {lead.activities.map(activity => {
                                    let badgeColor = "bg-primary"
                                    let icon = <div className="h-2 w-2 rounded-full bg-white" />
                                    let displayValue = ""

                                    if (activity.action === "STATUS_CHANGED") {
                                        badgeColor = "bg-blue-500"
                                        const val = JSON.parse(activity.newValue || "{}")
                                        displayValue = `Neuer Status: ${statusLabel(val.status)}`
                                    } else if (activity.action === "NOTE_ADDED") {
                                        badgeColor = "bg-green-500"
                                        const val = JSON.parse(activity.newValue || "{}")
                                        displayValue = `"${val.note}"`
                                    } else if (activity.action === "CALL_LOGGED") {
                                        badgeColor = "bg-purple-500"
                                        const val = JSON.parse(activity.newValue || "{}")
                                        displayValue = `Anruf: ${val.summary}`
                                    } else if (activity.action === "CONTACT_UPDATED") {
                                        badgeColor = "bg-teal-500"
                                        const val = JSON.parse(activity.newValue || "{}")
                                        displayValue = (val.changes as string[])?.join(" · ") || "Kontaktdaten aktualisiert"
                                    } else if (activity.action === "FIELDS_UPDATED") {
                                        badgeColor = "bg-orange-500"
                                        displayValue = "Formulardaten aktualisiert"
                                    } else if (activity.action === "LEAD_CREATED_API") {
                                        badgeColor = "bg-gray-500"
                                        displayValue = "Über Webhook importiert"
                                    }

                                    return (
                                        <div key={activity.id} className="relative">
                                            <div className={`absolute -left-[21px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full ${badgeColor} ring-4 ring-background`}>
                                                {icon}
                                            </div>
                                            <div className="text-sm">
                                                <div className="flex gap-2 items-baseline">
                                                    <span className="font-medium">{actionLabel(activity.action)}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-muted-foreground mt-1">{displayValue}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Von: {activity.user?.name || "System"}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
