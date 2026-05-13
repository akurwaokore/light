import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
