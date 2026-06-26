"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Sparkles, X, Send, Loader2, MessageCircle } from "lucide-react"

interface Msg {
  role: "user" | "assistant"
  content: string
}

const GREETING =
  "Hi! I'm Lumi 👋 — your guide to Light Alumni Connect. I can tell you about networking, events, the marketplace, the career hub, and how you earn loyalty points (you get 10 just for signing up!). What would you like to know?"

const SUGGESTIONS = [
  "What are the benefits?",
  "How do loyalty points work?",
  "How do I register?",
]

// Used only when the AI provider isn't configured (503) so the widget still helps.
function fallbackReply(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("point") || m.includes("loyalty") || m.includes("reward")) {
    return "You earn 10 loyalty points just for registering! Earn more through marketplace activity, joining clubs and engaging with the community — then redeem them in the marketplace (≈1 point = 1 KES) or climb the leaderboard for gifts at the annual alumni party. Ready to start? Tap Sign Up below."
  }
  if (m.includes("register") || m.includes("sign up") || m.includes("join") || m.includes("account")) {
    return "Signing up is quick: tap Sign Up, enter your full name, email and a password (8+ characters), and optionally your graduation year and campus. Verify your email and your 10 welcome points are waiting!"
  }
  return "Light Alumni Connect lets you network with alumni, join events, buy & sell in the marketplace, find jobs in the career hub, and earn loyalty points (10 free when you join!). Tap Sign Up below to get started — I'm happy to answer anything first."
}

export function OnboardingAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || sending) return
    const history = messages.slice(-8)
    setMessages((prev) => [...prev, { role: "user", content: message }])
    setInput("")
    setSending(true)
    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }])
      } else {
        // 503 (AI not configured) or other — use the local fallback.
        setMessages((prev) => [...prev, { role: "assistant", content: fallbackReply(message) }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: fallbackReply(message) }])
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-xl transition-transform hover:scale-105"
        aria-label="Open onboarding assistant"
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden text-sm font-semibold sm:inline">Ask Lumi</span>
      </button>
    )
  }

  return (
    <Card className="fixed bottom-5 right-5 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Lumi</p>
            <p className="text-[11px] leading-tight opacity-80">Onboarding assistant</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="opacity-80 hover:opacity-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA + input */}
      <div className="space-y-2 border-t p-3">
        <Button asChild size="sm" className="w-full">
          <Link href="/auth/signup">Create my account</Link>
        </Button>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </Card>
  )
}
