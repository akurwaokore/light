// Convenience re-export for simpler imports
// Usage: import supabase from '@/lib/supabaseClient'
import { getSupabaseBrowserClient } from "./supabase/client"

const supabase = getSupabaseBrowserClient()

export default supabase
