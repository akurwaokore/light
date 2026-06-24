import { createBrowserClient } from "@supabase/ssr"

type BrowserClient = ReturnType<typeof createBrowserClient>

// Singleton pattern using globalThis to prevent duplicate clients.
declare global {
  var __supabaseBrowser: BrowserClient | undefined
}

// Created lazily on first use. Doing this at module load throws "supabaseUrl is
// required" during static prerendering (`next build`) whenever the build-time
// env vars are absent, which crashes the build even though this client only
// ever runs in the browser.
function getSupabaseBrowser(): BrowserClient {
  if (!globalThis.__supabaseBrowser) {
    globalThis.__supabaseBrowser = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    console.log("[supabase] created browser client (singleton)")
  }
  return globalThis.__supabaseBrowser
}

// Proxy forwards every access to the lazily-created singleton, so existing
// callers keep using `supabaseBrowser.channel(...)` unchanged.
export const supabaseBrowser = new Proxy({} as BrowserClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseBrowser() as object, prop, receiver)
  },
})

export default supabaseBrowser
