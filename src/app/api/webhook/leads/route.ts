import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logLeadAction } from "@/lib/services/logService"

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "")
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find the project matching this API key
        const project = await prisma.project.findUnique({
            where: { apiKey: authHeader },
        })

        if (!project) {
            return NextResponse.json({ error: "Invalid API Key" }, { status: 403 })
        }

        const payload = await req.json()
        // dynamic_data should contain the fields mapped in Lead
        const dynamicDataStr = JSON.stringify(payload)

        // Create Lead
        const lead = await prisma.lead.create({
            data: {
                projectId: project.id,
                status: "NEW", // The default status for incoming API leads
                dynamicData: dynamicDataStr,
            },
        })

        // Log the creation
        await logLeadAction({
            leadId: lead.id,
            action: "LEAD_CREATED_API",
            newValue: payload,
        })

        return NextResponse.json({ lead_id: lead.id }, { status: 201 })
    } catch (error: any) {
        console.error("Webhook Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
