"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useLogo } from "@/hooks/use-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { 
  mainNavItems, 
  socialNavItems, 
  commerceNavItems, 
  accountNavItems, 
  adminNavItems, 
  managementNavItems 
} from "@/src/config/site"
import { LogOut, Shield, X } from "lucide-react"
import { Motto } from "@/components/motto"

import { useProfile } from "@/hooks/use-profile"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading } = useProfile()
  const { logo } = useLogo()
  const { setOpenMobile } = useSidebar()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      router.push("/")
      router.refresh()
    } catch (err) {
      console.error("[akurwas] Failed to logout:", err)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4 relative">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center">
            <Image
              src={logo.url}
              alt={logo.alt}
              width={48}
              height={48}
              className="object-contain bg-primary-foreground rounded-full"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-semibold text-sidebar-foreground">Light Alumni</span>
            <span className="text-xs text-sidebar-foreground/60">Association</span>
          </div>
        </Link>
        
        {/* Mobile Close Button (Burger toggle alternate) */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-1/2 -translate-y-1/2 md:hidden"
          onClick={() => setOpenMobile(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.description}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social & Community */}
        <SidebarGroup>
          <SidebarGroupLabel>Community</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.description} onClick={() => setOpenMobile(false)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Commerce & Careers */}
        <SidebarGroup>
          <SidebarGroupLabel>Professional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commerceNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.description} onClick={() => setOpenMobile(false)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Personal & Giving */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.description} onClick={() => setOpenMobile(false)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.description} onClick={() => setOpenMobile(false)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Motto variant="sidebar" className="mb-3 border-b border-sidebar-border pb-3" />

        <div className="flex flex-col gap-2">
          {profile?.isAdmin && (
            <Button
              asChild
              size="sm"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md"
            >
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
          )}

          {profile ? (
            <Button size="sm" variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button asChild size="sm" variant="default" className="w-full">
              <Link href="/auth/signin">
                <Shield className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
