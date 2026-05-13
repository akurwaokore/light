import type React from "react"
import type { Metadata } from "next"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Admin Dashboard | Light Alumni Connect",
  description: "Admin dashboard for Light Alumni Connect platform management",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/signin?redirect=/admin")
  }

  // Unified admin check using user_roles or profiles
  // First check user_roles table
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  const isAdminRole = roleData?.role === "admin" || roleData?.role === "super_admin"

  // Then check profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  const isAdminProfile = !!profile?.is_admin

  // Some legacy users might be hardcoded in ALLOWED_ADMIN_EMAILS
  const ALLOWED_ADMIN_EMAILS = ["sbirzhan@gmail.com", "edamoke@gmail.com"]
  const isHardcodedAdmin = ALLOWED_ADMIN_EMAILS.includes(user.email || "")

  if (!isAdminRole && !isAdminProfile && !isHardcodedAdmin) {
    console.log(`[AdminLayout] Access denied for user: ${user.email}`)
    redirect("/dashboard")
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
