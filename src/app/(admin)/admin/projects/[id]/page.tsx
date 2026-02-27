import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { FieldConfigurator } from "@/components/field-configurator"
import { createFieldConfig } from "@/app/actions/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") redirect("/")

    const { id } = await params

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            fieldConfigs: {
                orderBy: { orderIndex: "asc" }
            }
        }
    })

    if (!project) redirect("/admin/projects")

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex items-center gap-4">
                <Link href="/admin/projects">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground text-sm font-mono mt-1">API Key: {project.apiKey}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_400px]">
                {/* Left Column: Existing Fields (Drag & Drop) */}
                <Card className="flex flex-col h-[calc(100vh-180px)]">
                    <CardHeader>
                        <CardTitle>Dynamische Felder konfigurieren</CardTitle>
                        <CardDescription>
                            Bestimme, welche Felder in der Kundenakte (Lead) abgefragt werden.
                            Per Drag & Drop kannst du die Reihenfolge ändern.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <FieldConfigurator projectId={project.id} initialFields={project.fieldConfigs} />
                    </CardContent>
                </Card>

                {/* Right Column: Add new Field */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Neues Feld anlegen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={createFieldConfig.bind(null, project.id)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Anzeigename</Label>
                                <Input id="name" name="name" placeholder="z.B. Firmengröße" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="internalKey">Interner Schlüssel</Label>
                                <Input id="internalKey" name="internalKey" placeholder="z.B. company_size" required pattern="^[a-zA-Z0-9_]+$" title="Nur Buchstaben, Zahlen und Unterstriche sind erlaubt" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Feldtyp</Label>
                                {/* Due to Next.js Select standardizing issue with native form data, using native select inside component or hidden inputs. 
                    For simplicity, using native select styled as input. */}
                                <select id="type" name="type" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                    <option value="TEXT">Einzeiliger Text (Text)</option>
                                    <option value="TEXTAREA">Mehrzeiliger Text (Textarea)</option>
                                    <option value="CHECKBOX">Ja/Nein (Checkbox)</option>
                                    <option value="NUMBER">Zahl (Number)</option>
                                    <option value="DATE">Datum (Date)</option>
                                    <option value="SELECT">Dropdown (Select)</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input type="checkbox" id="isRequired" name="isRequired" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <Label htmlFor="isRequired">Dieses Feld ist ein Pflichtfeld</Label>
                            </div>

                            <Button type="submit" className="w-full mt-4">Feld hinzufügen</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
