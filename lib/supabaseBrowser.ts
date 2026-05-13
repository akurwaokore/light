import { createBrowserClient } from "@supabase/ssr"

// Singleton pattern using globalThis to prevent duplicate clients
declare global {
  var __supabaseBrowser: ReturnType<typeof createBrowserClient> | undefined
}

if (!globalThis.__supabaseBrowser) {
  globalThis.__supabaseBrowser = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  console.log("[supabase] created browser client (singleton)")
}

export const supabaseBrowser = globalThis.__supabaseBrowser
export default globalThis.__supabaseBrowser
