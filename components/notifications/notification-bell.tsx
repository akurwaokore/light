"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, Loader2, Heart, MessageCircle, UserPlus, Users, MessageSquare, Share2, ShoppingCart, Calendar, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { toast } from "sonner"

interface Notification {
  id: string
  title: string
  message?: string
  content?: string
  link?: string | null
  action_url?: string | null
  read: boolean
  created_at: string
  type: string
  metadata?: any
}

export function NotificationBell() {
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchNotifications()
    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=15")
      if (response.ok) {
        const data = await response.json()
        const items = data.notifications || []
        setNotifications(items)
        setUnreadCount(items.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      // Update locally first for immediate feedback
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id, read: true }),
      })
      
      if (!response.ok) {
        // Rollback on failure
        fetchNotifications()
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      fetchNotifications()
    }
  }

  const markAllRead = async () => {
    try {
      setLoading(true)
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRequestAction = async (friendshipId: string, action: "accept" | "decline", notificationId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast.success(`Friend request ${action === "accept" ? "accepted" : "declined"}`)
        // Mark notification as read and remove action buttons
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setUnreadCount(prev => Math.max(0, prev - 1))
        // Optionally, refresh all notifications to reflect changes
        fetchNotifications()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to process friend request")
      }
    } catch (error) {
      console.error("Error processing friend request:", error)
      toast.error("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getNotificationIcon = (type: string, metadata?: any) => {
    const activeType = type === 'general' && metadata?.real_type ? metadata.real_type : type;
    
    switch (activeType) {
      case 'post_like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />
      case 'post_comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'comment_reply':
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'friend_accepted':
        return <Users className="h-4 w-4 text-primary" />
      case 'post_share':
        return <Share2 className="h-4 w-4 text-blue-400" />
      case 'marketplace_purchase':
        return <ShoppingCart className="h-4 w-4 text-orange-500" />
      case 'event_registration':
        return <Calendar className="h-4 w-4 text-emerald-500" />
      case 'club_join':
        return <Users className="h-4 w-4 text-indigo-500" />
      case 'job_application':
        return <Briefcase className="h-4 w-4 text-amber-500" />
      case 'application_submitted':
        return <Briefcase className="h-4 w-4 text-emerald-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <DropdownMenuLabel className="p-4 flex items-center justify-between bg-muted/30">
          <span className="font-serif">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  className={`flex flex-col gap-1 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  onClick={(e) => {
                    // If it's a friend request notification, prevent the default navigation
                    // The action buttons will handle the interaction
                    if (n.type === "friend_request" || n.metadata?.real_type === "friend_request") {
                      e.stopPropagation();
                    } else {
                      if (!n.read) markAsRead(n.id)
                      const targetLink = n.link || n.action_url;
                      if (targetLink) {
                        setIsOpen(false)
                        window.location.assign(targetLink)
                      }
                    }
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0">
                        {getNotificationIcon(n.type, n.metadata)}
                      </div>
                      <span className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</span>
                    </div>
                    {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message || n.content}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">{formatTime(n.created_at)}</span>

                  {/* Action buttons for specific notification types */}
                  {(n.metadata?.real_type === "friend_request" || n.type === "friend_request") && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent parent div's onClick
                          handleFriendRequestAction(n.metadata.friendship_id, "accept", n.id)
                        }}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent parent div's onClick
                          handleFriendRequestAction(n.metadata.friendship_id, "decline", n.id)
                        }}
                        disabled={loading}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 bg-muted/20 border-t text-center">
            <Link href="/notifications" className="text-xs text-primary hover:underline font-bold" onClick={() => setIsOpen(false)}>
              View All Notifications
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

