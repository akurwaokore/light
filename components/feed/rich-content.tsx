"use client"

import Link from "next/link"
import { Fragment } from "react"

// Renders post/comment text with #hashtags and @mentions as styled links,
// and bare URLs as clickable links. Plain text otherwise.
const TOKEN = /(#[\p{L}0-9_]+|@[\p{L}0-9_.]+|https?:\/\/[^\s]+)/gu

export function RichContent({
  text,
  className,
  onTagClick,
}: {
  text?: string | null
  className?: string
  onTagClick?: (tag: string) => void
}) {
  if (!text) return null
  const parts = text.split(TOKEN)
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (!part) return <Fragment key={i} />
        if (part.startsWith("#")) {
          const tag = part.slice(1)
          if (onTagClick) {
            return (
              <button key={i} type="button" onClick={() => onTagClick(tag)} className="text-primary hover:underline">
                {part}
              </button>
            )
          }
          return (
            <Link key={i} href={`/feed?tag=${encodeURIComponent(tag)}`} className="text-primary hover:underline">
              {part}
            </Link>
          )
        }
        if (part.startsWith("@")) {
          return (
            <span key={i} className="font-medium text-primary">
              {part}
            </span>
          )
        }
        if (part.startsWith("http")) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">
              {part}
            </a>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </p>
  )
}
