"use client"

import { useState } from "react"
import { changePassword } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ChangePasswordForm({ userId }: { userId: string }) {
    const [current, setCurrent] = useState("")
    const [newPw, setNewPw] = useState("")
    const [confirm, setConfirm] = useState("")
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPw !== confirm) {
            setMessage({ type: "error", text: "Passwörter stimmen nicht überein" })
            return
        }
        setLoading(true)
        setMessage(null)

        const result = await changePassword(userId, current, newPw)

        if (result.error) {
            setMessage({ type: "error", text: result.error })
        } else {
            setMessage({ type: "success", text: result.success! })
            setCurrent(""); setNewPw(""); setConfirm("")
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="current-password">Aktuelles Passwort</Label>
                <Input id="current-password" type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="new-password">Neues Passwort</Label>
                <Input id="new-password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirm-password">Neues Passwort bestätigen</Label>
                <Input id="confirm-password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>

            {message && (
                <div className={`text-sm px-4 py-3 rounded-lg border ${message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"}`}>
                    {message.text}
                </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Wird gespeichert..." : "Passwort ändern"}
            </Button>
        </form>
    )
}
