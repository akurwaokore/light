"use client"

import { useRef, useState, type ReactNode } from "react"
import { Loader2, Upload, Video as VideoIcon } from "lucide-react"
import { useIsAdmin } from "@/components/landing/page-shell"

interface EditableMediaProps {
  /** Current media URL. Falls back to a placeholder when empty. */
  src?: string | null
  alt?: string
  /** Called with the uploaded public URL after a successful replace. */
  onChange?: (url: string) => void
  /** image/* (default) or video/* for clip uploads. */
  kind?: "image" | "video"
  className?: string
  imgClassName?: string
  /** Custom inner content (e.g. a styled <img>); defaults to a cover image. */
  children?: ReactNode
  placeholder?: string
}

/**
 * EditableMedia — wraps an image/video with an admin-only "Replace" overlay.
 * Regular visitors see only the media; signed-in admins get a hover button that
 * opens a file picker, uploads via /api/cms/upload, and reports the new URL via
 * onChange (the page persists it to cms_sections). This is the "click to upload
 * to replace the placeholder" affordance, gated to admins.
 */
export function EditableMedia({
  src,
  alt = "",
  onChange,
  kind = "image",
  className = "",
  imgClassName = "",
  children,
  placeholder = "/placeholder.svg",
}: EditableMediaProps) {
  const isAdmin = useIsAdmin()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("path", "pages")
      const res = await fetch("/api/cms/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok && data.url) onChange?.(data.url)
      else console.error("[EditableMedia] upload failed:", data?.error)
    } catch (err) {
      console.error("[EditableMedia] upload error:", err)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className={`relative group/edit overflow-hidden ${className}`}>
      {children ?? (
        <img
          src={src || placeholder}
          alt={alt}
          className={imgClassName || "h-full w-full object-cover"}
        />
      )}

      {isAdmin && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-200 group-hover/edit:opacity-100"
            aria-label={`Replace ${kind}`}
          >
            <span className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-black shadow-lg">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : kind === "video" ? (
                <VideoIcon className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {busy ? "Uploading…" : `Replace ${kind}`}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={kind === "video" ? "video/*" : "image/*"}
            onChange={handleFile}
            className="hidden"
          />
        </>
      )}
    </div>
  )
}
