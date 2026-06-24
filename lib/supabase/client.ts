"use client"

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createBrowserClient() {
  // Validate lazily, inside the factory — never at module load. Throwing at the
  // top level crashes static prerendering during `next build` (e.g. the
  // forgot-password page) when build-time env vars are absent, even though the
  // client is only ever used at runtime in the browser.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function createClient() {
  return createBrowserClient()
}

export function getSupabaseBrowserClient() {
  return createBrowserClient()
}
