"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Loader2 } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabaseBrowser } from "@/lib/supabaseBrowser"

interface Conversation {
  conversation_id: string
  conversation: {
    id: string
    updated_at: string
    last_message: Array<{ content: string; created_at: string, sender_id: string, is_read: boolean }>
  }
  other_participant: {
    user: {
      id: string
      display_name: string
      photo_url: string | null
    }
  }
}

export function MessageBell() {
  const [mounted, setMounted] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchConversations()

    // Poll as fallback, but also rely on realtime events and custom events
    const interval = setInterval(fetchConversations, 30000) 
    
    // Listen for custom event from ChatWindow when messages are read
    const handleReadUpdate = () => {
      fetchConversations()
    }
    window.addEventListener('chat-read-updated', handleReadUpdate)

    // Realtime subscription for unread count updates
    let channel: any;
    if (supabaseBrowser) {
      channel = supabaseBrowser
        .channel('public:chat_messages')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chat_messages' },
          () => {
            fetchConversations()
          }
        )
        .subscribe()
    }

    return () => {
      clearInterval(interval)
      window.removeEventListener('chat-read-updated', handleReadUpdate)
      if (channel) supabaseBrowser.removeChannel(channel)
    }
  }, [])

  const fetchConversations = async () => {
    try {
      const [convRes, unreadRes] = await Promise.all([
        fetch("/api/chat", { credentials: "include" }),
        fetch("/api/chat/unread", { credentials: "include" })
      ])
      
      if (convRes.ok) {
        const data = await convRes.json()
        setConversations(data.conversations || [])
      }
      
      if (unreadRes.ok) {
        const data = await unreadRes.json()
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    }
  }

  const formatTime = (date: string) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleOpenChat = async (conv: Conversation) => {
    setIsOpen(false)
    
    const event = new CustomEvent('open-chat', { 
      detail: { 
        id: conv.conversation_id, 
        name: conv.other_participant.user.display_name 
      } 
    })
    window.dispatchEvent(event)

    // The chat window itself handles marking as read when it opens and fetches messages
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
        <MessageSquare className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <DropdownMenuLabel className="p-4 flex items-center justify-between bg-muted/30">
          <span className="font-serif text-base">Messages</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[400px]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No messages yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((conv) => {
                const lastMsg = conv.conversation.last_message?.[0]
                const isUnread = lastMsg && !lastMsg.is_read && lastMsg.sender_id === conv.other_participant.user.id

                return (
                  <div 
                    key={conv.conversation_id}
                    className={`flex items-center gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${isUnread ? 'bg-muted/20' : ''}`}
                    onClick={() => handleOpenChat(conv)}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={conv.other_participant.user.photo_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conv.other_participant.user.display_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1">
                        <span className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>
                          {conv.other_participant.user.display_name}
                        </span>
                        <span className={`text-[10px] whitespace-nowrap ${isUnread ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                          {formatTime(conv.conversation.updated_at)}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {lastMsg ? (
                           lastMsg.sender_id === conv.other_participant.user.id ? lastMsg.content : `You: ${lastMsg.content}`
                        ) : "Start a conversation"}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}