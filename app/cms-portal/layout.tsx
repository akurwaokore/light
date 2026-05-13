import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function CMSLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    },
  )

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    redirect("/auth/signin")
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  return <>{children}</>
}
