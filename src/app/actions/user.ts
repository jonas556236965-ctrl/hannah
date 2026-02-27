"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createUser(formData: FormData) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string || "USER"

    if (!email || !password) throw new Error("Email and password are required")

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            role
        },
    })

    revalidatePath("/admin/users")
}

// Blocks/Unblocks a user by resetting their password or a dedicated status field.
// We don't have a specific `isBlocked` string on the schema right now, 
// so we'll change their role or implement it by blocking login (e.g. changing role to "BLOCKED").
export async function toggleUserBlock(userId: string, isCurrentlyBlocked: boolean) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    if (userId === session.user.id) throw new Error("Cannot block yourself")

    await prisma.user.update({
        where: { id: userId },
        data: { role: isCurrentlyBlocked ? "USER" : "BLOCKED" }
    })

    revalidatePath("/admin/users")
}

export async function assignProjectToUser(userId: string, projectId: string) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    // Using upsert or create to avoid duplicate constraint errors
    await prisma.projectMember.create({
        data: {
            userId,
            projectId,
        }
    }).catch(() => {
        // ignore if already exists
    })

    revalidatePath("/admin/users")
}

export async function removeProjectFromUser(userId: string, projectId: string) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

    await prisma.projectMember.deleteMany({
        where: {
            userId,
            projectId,
        }
    })

    revalidatePath("/admin/users")
}
