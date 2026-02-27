"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { logLeadAction } from "@/lib/services/logService"
import { getProjectIdsForUser } from "@/lib/rls"

async function verifyLeadAccess(leadId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const projectIds = await getProjectIdsForUser(session.user.id)

    const lead = await prisma.lead.findUnique({
        where: { id: leadId }
    })

    if (!lead || !projectIds.includes(lead.projectId)) {
        throw new Error("Access denied")
    }

    return { lead, user: session.user }
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
    const { lead, user } = await verifyLeadAccess(leadId)

    if (lead.status === newStatus) return

    await prisma.lead.update({
        where: { id: leadId },
        data: { status: newStatus }
    })

    await logLeadAction({
        leadId,
        userId: user.id,
        action: "STATUS_CHANGED",
        oldValue: { status: lead.status },
        newValue: { status: newStatus }
    })

    revalidatePath(`/leads/${leadId}`)
    revalidatePath("/leads")
}

export async function addLeadNote(leadId: string, note: string) {
    const { user } = await verifyLeadAccess(leadId)

    await logLeadAction({
        leadId,
        userId: user.id,
        action: "NOTE_ADDED",
        newValue: { note }
    })

    revalidatePath(`/leads/${leadId}`)
}

export async function logCall(leadId: string, summary: string) {
    const { user } = await verifyLeadAccess(leadId)

    await logLeadAction({
        leadId,
        userId: user.id,
        action: "CALL_LOGGED",
        newValue: { summary }
    })

    revalidatePath(`/leads/${leadId}`)
}

export async function updateLeadFields(leadId: string, formData: FormData) {
    const { lead, user } = await verifyLeadAccess(leadId)

    // Parse existing data
    let currentData: any = {}
    try {
        currentData = JSON.parse(lead.dynamicData)
    } catch (e) { }

    // Merge new data from form
    const newData = { ...currentData }
    for (const [key, value] of formData.entries()) {
        if (typeof value === "string" && !key.startsWith("$ACTION_ID_")) { // ignore next internal fields
            newData[key] = value
        }
    }

    const newDataString = JSON.stringify(newData)

    if (newDataString !== lead.dynamicData) {
        await prisma.lead.update({
            where: { id: leadId },
            data: { dynamicData: newDataString }
        })

        await logLeadAction({
            leadId,
            userId: user.id,
            action: "FIELDS_UPDATED",
            oldValue: currentData,
            newValue: newData
        })
    }

    revalidatePath(`/leads/${leadId}`)
}
