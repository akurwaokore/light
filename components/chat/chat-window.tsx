"use client"

import { useState, useEffect, useRef } from "react"
import { supabaseBrowser } from "@/lib/supabaseBrowser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, MessageSquare, X } from "lucide-react"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

interface ChatProps {
  conversationId: string
  recipientName: string
  onClose?: () => void
}

export function ChatWindow({ conversationId, recipientName, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otherTyping, setOtherTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)
  const typingTimeout = useRef<any>(null)

  const notifyTyping = () => {
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: {} })
  }

  useEffect(() => {
    let channel: any;

    if (conversationId && supabaseBrowser) {
      setLoading(true)
      fetchMessages()

      // Set up realtime subscription
      channel = supabaseBrowser
        .channel(`chat_messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload: any) => {
            console.log('New message received via realtime:', payload)

            // To ensure we get the correct 'me' vs 'other' mapping and mark as read,
            // we re-fetch all messages when a new one comes in.
            // This is safer than trying to map it client-side without knowing the current user's ID.
            await fetchMessages()
          }
        )
        .on('broadcast', { event: 'typing' }, () => {
          setOtherTyping(true)
          if (typingTimeout.current) clearTimeout(typingTimeout.current)
          typingTimeout.current = setTimeout(() => setOtherTyping(false), 2500)
        })
        .subscribe()
      channelRef.current = channel
    }

    return () => {
      if (channel) {
        supabaseBrowser.removeChannel(channel)
      }
    }
  }, [conversationId])

  useEffect(() => {
    // Scroll to bottom after messages load or update
    setTimeout(() => {
      const scrollElement = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }, 100)
  }, [messages])

  const markAsRead = async () => {
    try {
      await fetch(`/api/chat/${conversationId}/read`, {
        method: "POST",
        credentials: "include",
      })
      // Dispatch an event so the MessageBell can update its count
      window.dispatchEvent(new CustomEvent('chat-read-updated'))
    } catch (err) {
      console.error("Failed to mark messages as read:", err)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessages(data || [])
        setError(null)

        // If there are messages from others, mark them as read
        const hasUnreadFromOthers = (data || []).some((m: Message) => m.sender_id !== "me" && !(m as any).is_read)
        if (hasUnreadFromOthers) {
          markAsRead()
        }
      } else {
        console.error("Failed to load messages:", data.error)
        setError(data.error || "Failed to load messages")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newMessage }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setNewMessage("")
        setError(null)
        // Message will be fetched via realtime or we can fetch immediately
        fetchMessages()
      } else {
        console.error("Failed to send message:", data.error)
        setError(data.error || "Failed to send message")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="flex flex-col h-[500px] w-full max-w-md shadow-2xl border-primary/20 bg-background">
      <CardHeader className="p-4 border-b bg-primary text-primary-foreground flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle className="text-base font-serif">{recipientName}</CardTitle>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden relative bg-muted/10">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {loading && messages.length === 0 ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">Start your conversation...</div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender_id === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none shadow-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <div className="p-4 border-t bg-background">
        {otherTyping && (
          <p className="mb-1 text-xs italic text-muted-foreground">{recipientName} is typing…</p>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); notifyTyping() }}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </div>
    </Card>
  )
}