"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function createProject(formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    const name = formData.get("name") as string
    if (!name) throw new Error("Project name is required")

    await prisma.project.create({
        data: {
            name,
        },
    })

    revalidatePath("/admin/projects")
}

export async function deleteProject(id: string) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    await prisma.project.delete({
        where: { id },
    })

    revalidatePath("/admin/projects")
}
