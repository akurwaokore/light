import { getSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // Try to fetch from auth to test connection
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log(
        "[akurwas] Supabase connection test - Session check returned error (this is normal if not authenticated):",
        error.message,
      )
    }

    // Test a simple query to verify database connection
    const { error: dbError } = await supabase.from("_test_").select("*").limit(1)

    // If we get "relation does not exist" error, that means connection works but table doesn't exist
    const connectionWorks = !dbError || dbError.code === "42P01" || dbError.message.includes("does not exist")

    if (connectionWorks) {
      return NextResponse.json({
        success: true,
        message: "Supabase connection successful!",
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Supabase connection failed",
          error: dbError?.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[akurwas] Supabase connection test error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to Supabase",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
