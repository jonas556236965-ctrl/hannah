import { prisma } from "./prisma"

/**
 * Ensures a user has access to a specific project.
 * Throws an error if access is denied.
 */
export async function requireProjectAccess(userId: string, projectId: string) {
    const member = await prisma.projectMember.findUnique({
        where: {
            userId_projectId: {
                userId,
                projectId,
            },
        },
    })

    // Admins might have implicit access to all projects, but let's strictly require membership
    // unless we explicitly check user role.
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role === "ADMIN") return true // ADMINs have access to everything

    if (!member) {
        throw new Error("Access denied: You are not a member of this project.")
    }

    return true
}

/**
 * Returns Prisma filters to only select records (like Leads or FieldConfigs)
 * that belong to projects the user is a member of.
 */
export async function getProjectIdsForUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (user?.role === "ADMIN") {
        const allProjects = await prisma.project.findMany({ select: { id: true } })
        return allProjects.map(p => p.id)
    }

    const projects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
    })

    return projects.map(p => p.projectId)
}
