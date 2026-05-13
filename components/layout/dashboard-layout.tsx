"use client"

import type React from "react"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { AppFooter } from "./app-footer"
import { QuestionnairePopup } from "@/components/notifications/questionnaire-popup" // Import questionnaire popup
import { ChatContainer } from "@/components/chat/chat-container"
import { ProfileProvider } from "@/hooks/use-profile"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProfileProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-x-hidden">
          <AppHeader />
          <main className="flex-1 overflow-x-hidden">{children}</main>
          <AppFooter />
        </SidebarInset>
        <QuestionnairePopup />
        <ChatContainer />
      </SidebarProvider>
    </ProfileProvider>
  )
}
