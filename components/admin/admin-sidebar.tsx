"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
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
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Briefcase,
  ShoppingBag,
  Heart,
  Mail,
  Settings,
  Shield,
  BarChart3,
  FileText,
  LogOut,
  Trophy,
  ClipboardList,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const mainNavItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Members", href: "/admin/members", icon: Users },
  { title: "Events", href: "/admin/events", icon: Calendar },
  { title: "Posts", href: "/admin/posts", icon: MessageSquare },
  { title: "Clubs & Groups", href: "/admin/clubs", icon: Users },
]

const managementItems = [
  { title: "CMS Management", href: "/admin/cms", icon: FileText },
  { title: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { title: "Marketplace", href: "/admin/marketplace", icon: ShoppingBag },
  { title: "Donations", href: "/admin/donations", icon: Heart },
  { title: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { title: "Reports", href: "/admin/reports", icon: FileText },
  { title: "Points Management", href: "/admin/points", icon: Trophy },
  { title: "Surveys", href: "/admin/surveys", icon: ClipboardList }, // Added Surveys to navigation
]

const systemItems = [
  { title: "Permissions", href: "/admin/permissions", icon: Shield },
  { title: "Settings", href: "/admin/settings", icon: Settings },
]

// Admins are full members too — these jump to the live community experience
// where they can post, like, comment, and use the marketplace like any user.
const communityItems = [
  { title: "My User Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Community Feed", href: "/feed", icon: MessageSquare },
  { title: "Member Directory", href: "/members", icon: Users },
  { title: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { title: "Careers", href: "/careers", icon: Briefcase },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center">
            <Image src="/logo.png" alt="Light Alumni Association" width={48} height={48} className="object-contain" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Light Alumni Connect</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
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

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
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

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
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

        <SidebarGroup>
          <SidebarGroupLabel>Community</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communityItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
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
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/admin-interface.png" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">Super Admin</p>
          </div>
          <Link href="/" className="p-2 hover:bg-muted rounded-md transition-colors">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
