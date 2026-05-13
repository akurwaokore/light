import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const tablesToTest = [
      "profiles",
      "products",
      "jobs",
      "events",
      "clubs",
      "system_settings"
    ]

    const results: any = {}

    for (const table of tablesToTest) {
      const { error } = await supabase.from(table).select("*").limit(1)
      if (error) {
        results[table] = {
          status: "error",
          code: error.code,
          message: error.message
        }
      } else {
        results[table] = { status: "ok" }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database_check: results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
