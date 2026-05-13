import { NextResponse } from "next/server"

// Validate and sanitize user input
export function sanitizeInput(input: string, maxLength = 5000): string {
  if (!input || typeof input !== "string") return ""

  // Enhanced sanitization: Basic HTML tag stripping and character escaping
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>?/gm, "") // Remove HTML tags
    .replace(/[<>]/g, "")      // Additional safety for partial tags
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Create unauthorized response
export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}

// Create forbidden response
export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 })
}

// Create bad request response
export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 })
}

// Create server error response
export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 })
}

// Simple in-memory rate limiter (for demonstration - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests = 100, windowSeconds = 60): boolean {
  const now = Date.now()
  const key = identifier

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowSeconds * 1000 })
    return true
  }

  const record = rateLimitStore.get(key)!

  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + windowSeconds * 1000
    return true
  }

  record.count++
  return record.count <= maxRequests
}

// Log security events
export function logSecurityEvent(eventType: string, details: Record<string, any>) {
  console.log(`[SECURITY] ${eventType}:`, {
    timestamp: new Date().toISOString(),
    ...details,
  })
}

/**
 * Standard pagination helper
 */
export function getPagination(page: number = 1, size: number = 20) {
  const limit = size ? +size : 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  return { from, to }
}
