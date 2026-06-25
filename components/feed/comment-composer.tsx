"use client"

import { useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image as ImageIcon, Loader2, Send, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EmojiPicker } from "@/components/feed/emoji-picker"
import { cn } from "@/lib/utils"

// Facebook-style comment box: text + emoji + a single photo. Used for both
// top-level comments and replies (pass parentCommentId + onCancel).
export function CommentComposer({
  postId,
  profile,
  onCommentAdded,
  parentCommentId,
  autoFocus = false,
  onCancel,
}: {
  postId: string
  profile: any
  onCommentAdded: (comment?: any) => void
  parentCommentId?: string
  autoFocus?: boolean
  onCancel?: () => void
}) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("path", "comments")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) setImageUrl(data.url)
      else throw new Error(data.error || "Upload failed")
    } catch (err) {
      toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" })
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleSubmit = async () => {
    if ((!content.trim() && !imageUrl) || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim(),
          image_url: imageUrl,
          parent_comment_id: parentCommentId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setContent("")
        setImageUrl(null)
        onCommentAdded(data.comment)
        if (onCancel) onCancel()
      } else {
        toast({ title: "Failed to post", description: data.error || "Unknown error", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error while posting", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex gap-2", parentCommentId ? "mt-2" : "px-1 pt-1")}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={profile?.photo_url || "/placeholder.svg"} />
        <AvatarFallback className="text-[10px]">{profile?.display_name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-2xl bg-muted/60 px-3 py-1.5">
        <textarea
          ref={inputRef}
          autoFocus={autoFocus}
          placeholder={parentCommentId ? "Write a reply…" : "Write a comment…"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
            if (e.key === "Escape" && onCancel) onCancel()
          }}
          rows={1}
          disabled={isSubmitting}
          className="max-h-32 w-full resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/60"
        />

        {imageUrl && (
          <div className="relative mb-2 mt-1 inline-block">
            <img src={imageUrl} alt="Comment attachment" className="max-h-32 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 shadow ring-1 ring-border"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center text-muted-foreground transition-colors hover:text-primary">
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
            <EmojiPicker onSelect={(emoji) => setContent((c) => c + emoji)} />
          </div>
          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-[11px] font-medium text-muted-foreground hover:underline"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageUrl) || isSubmitting}
              className="flex items-center gap-1 text-sm font-bold text-primary transition-opacity hover:opacity-100 disabled:opacity-30"
              aria-label="Post comment"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
