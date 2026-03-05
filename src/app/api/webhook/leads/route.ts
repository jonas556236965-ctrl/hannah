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

        // Extract dedicated fields (support both top-level and nested under "data")
        const src = payload.data ?? payload
        const name = (src.name ?? src.Name ?? null)?.toString().trim() || null
        const email = (src.email ?? src.Email ?? src.e_mail ?? null)?.toString().trim() || null
        const phone = (src.phone ?? src.Phone ?? src.telefon ?? src.Telefon ?? null)?.toString().trim() || null

        // Store everything in dynamicData (including name/email/phone so they appear in field views too)
        const dynamicDataStr = JSON.stringify(src)

        // Create Lead
        const lead = await prisma.lead.create({
            data: {
                projectId: project.id,
                status: "NEW",
                name,
                email,
                phone,
                dynamicData: dynamicDataStr,
            },
        })

        // Log the creation
        await logLeadAction({
            leadId: lead.id,
            action: "LEAD_CREATED_API",
            newValue: { ...src, _name: name, _email: email, _phone: phone },
        })

        return NextResponse.json({ lead_id: lead.id, name, email, phone }, { status: 201 })
    } catch (error: any) {
        console.error("Webhook Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

