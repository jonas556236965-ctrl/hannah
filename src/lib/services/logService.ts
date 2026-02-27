import { prisma } from "../prisma"

type LogActionParams = {
    leadId: string
    userId?: string // null means system/webhook action
    action: string
    oldValue?: any
    newValue?: any
}

export async function logLeadAction({
    leadId,
    userId,
    action,
    oldValue,
    newValue,
}: LogActionParams) {
    return await prisma.activityLog.create({
        data: {
            leadId,
            userId,
            action,
            oldValue: oldValue ? JSON.stringify(oldValue) : null,
            newValue: newValue ? JSON.stringify(newValue) : null,
        },
    })
}
