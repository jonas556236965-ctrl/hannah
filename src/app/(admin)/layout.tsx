import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/api/auth/signin")
    }

    // Ensure user is an admin or we just allow all authenticated users to see the dashboard layout 
    // (we filter data inside the pages using their project assignments)

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar userRole={session.user.role} />
            <main className="flex-1 overflow-y-auto p-10 lg:p-14">
                <div className="max-w-[1400px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
