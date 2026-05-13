"use client"

import { useState, useEffect } from "react"
import { ChatWindow } from "./chat-window"

interface ActiveChat {
  id: string
  name: string
}

export function ChatContainer() {
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([])

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      const { id, name } = e.detail
      
      setActiveChats(prev => {
        // Don't open if already open
        if (prev.find(chat => chat.id === id)) return prev
        // Limit to 3 chats for screen space
        if (prev.length >= 3) return [...prev.slice(1), { id, name }]
        return [...prev, { id, name }]
      })
    }

    window.addEventListener('open-chat', handleOpenChat)
    return () => window.removeEventListener('open-chat', handleOpenChat)
  }, [])

  const closeChat = (id: string) => {
    setActiveChats(prev => prev.filter(chat => chat.id !== id))
  }

  if (activeChats.length === 0) return null

  return (
    <div className="fixed bottom-0 right-4 z-50 flex items-end gap-4 pointer-events-none">
      {activeChats.map((chat) => (
        <div key={chat.id} className="pointer-events-auto w-80 shadow-2xl">
          <ChatWindow 
            conversationId={chat.id} 
            recipientName={chat.name} 
            onClose={() => closeChat(chat.id)}
          />
        </div>
      ))}
    </div>
  )
}
