"use client"

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

const validatedSupabaseUrl = supabaseUrl
const validatedSupabaseAnonKey = supabaseAnonKey

export function createBrowserClient() {
  return createSupabaseBrowserClient(validatedSupabaseUrl, validatedSupabaseAnonKey)
}

export function createClient() {
  return createBrowserClient()
}

export function getSupabaseBrowserClient() {
  return createBrowserClient()
}
