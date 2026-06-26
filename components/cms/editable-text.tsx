"use client"

import { useEffect, useRef, useState, type ElementType } from "react"
import { Pencil } from "lucide-react"
import { useIsAdmin } from "@/components/landing/page-shell"

interface EditableTextProps {
  value?: string
  onChange?: (value: string) => void
  as?: ElementType
  className?: string
  placeholder?: string
  multiline?: boolean
}

/**
 * EditableText — renders text that admins can click-to-edit inline. The value
 * is committed on blur (or Enter for single-line) and reported via onChange so
 * the page can persist it to cms_sections. Non-admins just see the text.
 */
export function EditableText({
  value = "",
  onChange,
  as = "span",
  className = "",
  placeholder = "Click to edit",
  multiline = false,
}: EditableTextProps) {
  const isAdmin = useIsAdmin()
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const Tag: any = as

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      // place caret at end
      const range = document.createRange()
      range.selectNodeContents(ref.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    const next = (ref.current?.innerText ?? "").trim()
    if (next !== value) onChange?.(next)
  }

  if (!isAdmin) {
    return <Tag className={className}>{value || placeholder}</Tag>
  }

  return (
    <Tag
      ref={ref as any}
      className={`${className} ${
        isAdmin ? "relative cursor-text rounded outline-none transition-colors hover:bg-white/5 focus:bg-white/10 focus:ring-1 focus:ring-blue-400/60" : ""
      }`}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={() => !editing && setEditing(true)}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault()
          ;(e.target as HTMLElement).blur()
        }
        if (e.key === "Escape") {
          if (ref.current) ref.current.innerText = value
          ;(e.target as HTMLElement).blur()
        }
      }}
      title={editing ? undefined : "Click to edit"}
    >
      {value || placeholder}
    </Tag>
  )
}
