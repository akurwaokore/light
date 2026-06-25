"use client"

import { useState } from "react"
import { Smile } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// A lightweight, dependency-free emoji palette. Calls onSelect with the chosen
// emoji so the caller can insert it into a text field.
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤩", "😉", "🙂", "🥳", "😅", "😇", "🤗", "🤔", "😴", "😋", "😜", "🤤", "😭", "😢", "😤", "😡", "🥺", "😱", "🤯", "😬", "🙄", "😏"],
  },
  {
    label: "Gestures",
    emojis: ["👍", "👎", "👏", "🙌", "🙏", "👌", "🤝", "💪", "✌️", "🤞", "👊", "✊", "🤙", "👋", "🫶", "🤟", "👀", "🧠", "💯", "🔥"],
  },
  {
    label: "Hearts & Symbols",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💖", "💕", "💞", "⭐", "🌟", "✨", "🎉", "🎊", "🎂", "🎁", "🏆"],
  },
  {
    label: "Life",
    emojis: ["🎓", "📚", "💼", "💻", "📈", "☕", "🍕", "🍻", "⚽", "🏀", "🎵", "📷", "✈️", "🚗", "🏠", "🌍", "☀️", "🌧️", "🌈", "💐"],
  },
]

export function EmojiPicker({
  onSelect,
  className,
}: {
  onSelect: (emoji: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Add emoji"
          className={cn(
            "flex items-center text-muted-foreground transition-colors hover:text-yellow-500",
            className,
          )}
        >
          <Smile className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onSelect(emoji)
                      setOpen(false)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
