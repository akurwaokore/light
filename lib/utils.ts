import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalise a (Kenyan-default) phone number into the digits-only international
// format that https://wa.me/<number> requires. Strips +, spaces, dashes and the
// local leading 0, prefixing 254 for bare mobile numbers. Returns null if empty.
export function toWhatsAppNumber(input?: string | null): string | null {
  let p = (input || "").replace(/[^0-9]/g, "")
  if (!p) return null
  if (p.startsWith("254")) return p
  if (p.startsWith("0")) return "254" + p.slice(1)
  if (p.startsWith("7") || p.startsWith("1")) return "254" + p
  return p
}
