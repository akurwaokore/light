// NOTE: server-only module. Do not import from client components.
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * Use ONLY in trusted server contexts that have no user session or must act
 * across users, after the caller's authorization has been checked in code:
 *   - payment gateway callbacks (server-to-server, no cookie/session)
 *   - generating CV signed URLs for an entitled non-owner (poster/admin)
 *   - order finalization / stock decrement
 *
 * NEVER import this into a client component or use it to serve a user request
 * without an explicit authorization check first.
 */
let cached: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL for admin client")
  }
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
