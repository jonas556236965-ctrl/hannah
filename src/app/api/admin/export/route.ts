import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = req.nextUrl.searchParams.get("projectId")
    if (!projectId) {
        return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const leads = await prisma.lead.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: {
            project: { select: { fieldConfigs: { orderBy: { orderIndex: "asc" } } } }
        }
    })

    // If there are no leads or project, return empty CSV
    if (leads.length === 0) {
        return new NextResponse("ID,Status,Erstellt Am\n", {
            headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=leads.csv" }
        })
    }

    const fieldConfigs = leads[0].project.fieldConfigs

    // Headers
    const baseHeaders = ["ID", "Status", "Erstellt Am"]
    const dynamicHeaders = fieldConfigs.map(fc => fc.name)
    const headerRow = [...baseHeaders, ...dynamicHeaders].join(",") + "\n"

    // Rows
    const rows = leads.map(lead => {
        let dynamicData: Record<string, any> = {}
        try {
            dynamicData = JSON.parse(lead.dynamicData)
        } catch (e) { }

        const baseCols = [
            lead.id,
            lead.status,
            lead.createdAt.toISOString()
        ]

        const dynamicCols = fieldConfigs.map(fc => {
            const val = dynamicData[fc.internalKey]
            if (val === undefined || val === null) return ""
            // Escape CSV properly if it contains commas or quotes
            const strVal = String(val)
            if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
                return `"${strVal.replace(/"/g, '""')}"`
            }
            return strVal
        })

        return [...baseCols, ...dynamicCols].join(",")
    })

    const csvContent = headerRow + rows.join("\n")

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename=leads-${projectId}.csv`
        }
    })
}
