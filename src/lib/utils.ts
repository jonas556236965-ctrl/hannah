import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Neu",
  CONTACTED: "Kontaktiert",
  QUALIFIED: "Qualifiziert",
  WON: "Gewonnen",
  LOST: "Verloren",
  BLOCKED: "Gesperrt",
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

const ACTION_LABELS: Record<string, string> = {
  STATUS_CHANGED: "Status geändert",
  NOTE_ADDED: "Notiz hinzugefügt",
  CALL_LOGGED: "Anruf geloggt",
  CONTACT_UPDATED: "Kontakt aktualisiert",
  FIELDS_UPDATED: "Daten aktualisiert",
  LEAD_CREATED_API: "Lead erstellt (API)",
  LEAD_CREATED: "Lead erstellt",
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ")
}
