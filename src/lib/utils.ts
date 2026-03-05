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
