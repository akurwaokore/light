"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bell, Check, Trash2, Calendar, MessageSquare, UserPlus, Heart, Briefcase, ShoppingCart, Users, Share2, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message?: string
  content?: string
  type: string
  read: boolean
  link?: string | null
  action_url?: string | null
  created_at: string
  metadata?: any
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=100")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id, read: true }),
      })

      if (!response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error("Error marking as read:", error)
      fetchNotifications()
    }
  }

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      })

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        toast({ title: "All caught up!", description: "All notifications marked as read." })
      }
    } catch (error) {
      console.error("Error marking all read:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string, metadata?: any) => {
    const activeType = type === "general" && metadata?.real_type ? metadata.real_type : type
    switch (activeType) {
      case "post_like": return <Heart className="h-4 w-4 text-red-500 fill-red-500" />
      case "post_comment": return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "comment_reply": return <MessageSquare className="h-4 w-4 text-purple-500" />
      case "friend_request": return <UserPlus className="h-4 w-4 text-green-500" />
      case "friend_accepted": return <Users className="h-4 w-4 text-primary" />
      case "post_share": return <Share2 className="h-4 w-4 text-blue-400" />
      case "marketplace_purchase": return <ShoppingCart className="h-4 w-4 text-orange-500" />
      case "event_registration": return <Calendar className="h-4 w-4 text-emerald-500" />
      case "club_join": return <Users className="h-4 w-4 text-indigo-500" />
      case "job_application": return <Briefcase className="h-4 w-4 text-amber-500" />
      case "application_submitted": return <Briefcase className="h-4 w-4 text-emerald-500" />
      case "event": return <Calendar className="h-4 w-4 text-blue-500" />
      case "message": return <MessageSquare className="h-4 w-4 text-green-500" />
      case "job": return <Briefcase className="h-4 w-4 text-orange-500" />
      default: return <Bell className="h-4 w-4 text-primary" />
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your alumni network activity.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-full">
            <Check className="mr-2 h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <Card className="border-none bg-background/50 backdrop-blur-sm shadow-xl ring-1 ring-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50 mb-4" />
              <p className="text-sm text-muted-foreground">Loading your notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-primary/20" />
              </div>
              <h3 className="text-lg font-bold">All caught up!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                You don't have any notifications at the moment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-4 p-4 transition-colors hover:bg-muted/30",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="mt-1">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      !notification.read ? "bg-primary/10" : "bg-muted"
                    )}>
                      {getNotificationIcon(notification.type, notification.metadata)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-semibold", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                        {notification.title}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/60 shrink-0">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message || notification.content}
                    </p>
                    {(notification.link || notification.action_url) && (
                      <Link 
                        href={(notification.link || notification.action_url) as string}
                        className="inline-block text-xs font-bold text-primary hover:underline mt-1"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
