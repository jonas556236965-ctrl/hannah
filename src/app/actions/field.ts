"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function createFieldConfig(projectId: string, formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    const name = formData.get("name") as string
    const internalKey = formData.get("internalKey") as string
    const type = formData.get("type") as string
    const isRequired = formData.get("isRequired") === "on"

    if (!name || !internalKey || !type) throw new Error("Missing fields")

    const lastField = await prisma.fieldConfig.findFirst({
        where: { projectId },
        orderBy: { orderIndex: "desc" }
    })

    const orderIndex = lastField ? lastField.orderIndex + 1 : 0

    await prisma.fieldConfig.create({
        data: {
            projectId,
            name,
            internalKey,
            type,
            isRequired,
            orderIndex
        },
    })

    revalidatePath(`/admin/projects/${projectId}`)
}

export async function deleteFieldConfig(id: string, projectId: string) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    await prisma.fieldConfig.delete({
        where: { id },
    })

    revalidatePath(`/admin/projects/${projectId}`)
}

export async function reorderFieldConfigs(projectId: string, fieldIds: string[]) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    // Update all fields with their new index based on array position
    const updates = fieldIds.map((id, index) => {
        return prisma.fieldConfig.update({
            where: { id },
            data: { orderIndex: index }
        })
    })

    await prisma.$transaction(updates)

    revalidatePath(`/admin/projects/${projectId}`)
}
