"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Trash2, Loader2, Info, AlertTriangle, CheckCircle, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link?: string
  metadata?: any
  read: boolean
  created_at: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error("[Notifications] Error fetching:", error)
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      })

      if (response.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
      }
    } catch (error) {
      console.error("[Notifications] Error marking as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }), // Assuming API handles all if no ID
      })

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        toast.success("All notifications marked as read")
      }
    } catch (error) {
      console.error("[Notifications] Error marking all as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id))
        toast.success("Notification deleted")
      }
    } catch (error) {
      console.error("[Notifications] Error deleting:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "info": return <Info className="h-5 w-5 text-blue-500" />
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "success": return <CheckCircle className="h-5 w-5 text-green-500" />
      case "achievement": return <Star className="h-5 w-5 text-yellow-500" />
      default: return <Bell className="h-5 w-5 text-primary" />
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "unread") return !n.read
    return true
  })

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Manage and view all your system alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={!notifications.some(n => !n.read)}>
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-xl font-medium">No notifications</p>
                <p className="text-muted-foreground">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} className={`glass-card transition-colors ${notification.read ? 'opacity-70' : 'border-primary/50'}`}>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        {!notification.read && (
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => markAsRead(notification.id)}>
                            <Check className="mr-1 h-3 w-3" />
                            Mark as read
                          </Button>
                        )}
                        {notification.link && (
                          <Button variant="link" size="sm" className="h-8 px-0 text-xs" asChild>
                            <a href={notification.link}>View details</a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:text-destructive" onClick={() => deleteNotification(notification.id)}>
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
