"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Search, User, ShieldCheck, LogOut, Moon, Sun, Trophy, Bell, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { MessageBell } from "@/components/chat/message-bell"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"

import { useProfile } from "@/hooks/use-profile"

export function AppHeader() {
  const { profile, loading: profileLoading } = useProfile()
  const [isMounted, setIsMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [loyaltyPoints, setLoyaltyPoints] = useState<string>("0")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    let mounted = true
    
    if (isMounted && profile && !profileLoading) {
      const fetchPoints = () => {
        fetch(`/api/points/current`)
          .then(res => res.json())
          .then(pointsData => {
          const val = pointsData?.points ?? pointsData?.total_points ?? 0;
          if (mounted) setLoyaltyPoints(val.toString());
        })
          .catch(err => {
            console.error("Failed to fetch points for header:", err);
          });
      };

      fetchPoints();
      // Polling every 30 seconds to keep it fresh
      const interval = setInterval(fetchPoints, 30000);
      return () => { 
        mounted = false;
        clearInterval(interval);
      };
    }
  }, [isMounted, profile, profileLoading])

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return (
      <header className="sticky top-0 z-50 flex h-16 items-center gap-2 md:gap-4 border-b border-border bg-background px-2 md:px-6 overflow-hidden">
        <SidebarTrigger className="-ml-1 shrink-0" />
        
        {/* Home Button for Mobile/Desktop */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity pr-2 border-r border-border mr-1 md:mr-2 shrink-0">
          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
             <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
          <span className="font-serif font-bold hidden sm:inline-block whitespace-nowrap">Light Alumni</span>
        </Link>

      <div className="flex flex-1 items-center gap-4">
        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search alumni, events, clubs..." className="pl-10" />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* Points Display - Desktop */}
        {profile && (
          <Link href="/leaderboard" className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all group">
            <Trophy className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-amber-700">{loyaltyPoints}</span>
          </Link>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-full hover:bg-muted"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <div className="flex items-center">
          <MessageBell />
        </div>
        <div className="flex items-center">
          <NotificationBell />
        </div>
        
        {/* User Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full bg-muted overflow-hidden" id={isMounted ? undefined : "user-trigger-placeholder"}>
              <Avatar className="h-9 w-9">
                {profile?.photo_url ? (
                  <Image src={profile.photo_url} alt="Profile" width={36} height={36} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {profile?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center cursor-pointer w-full">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex items-center cursor-pointer w-full">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/api/auth/signout'} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
