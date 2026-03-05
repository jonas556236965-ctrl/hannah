"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    const session = await auth()
    if (!session?.user || session.user.id !== userId) {
        return { error: "Nicht autorisiert" }
    }

    if (newPassword.length < 8) {
        return { error: "Das neue Passwort muss mindestens 8 Zeichen lang sein" }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.password) return { error: "Kein Passwort gesetzt" }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return { error: "Aktuelles Passwort ist falsch" }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } })

    revalidatePath("/admin/settings")
    return { success: "Passwort erfolgreich geändert" }
}
