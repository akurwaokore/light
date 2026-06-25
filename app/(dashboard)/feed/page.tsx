"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageCircle,
  Image as ImageIcon,
  Video as VideoIcon,
  Send,
  MoreHorizontal,
  Share2,
  Bookmark,
  Loader2,
  Globe,
  Users,
  Lock as LockIcon,
  Edit2,
  Trash2,
  ThumbsUp,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabaseBrowser } from "@/lib/supabaseBrowser"
import { RichContent } from "@/components/feed/rich-content"
import { EmojiPicker } from "@/components/feed/emoji-picker"
import { CommentComposer } from "@/components/feed/comment-composer"
import { SharedPostCard } from "@/components/feed/shared-post-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Facebook-style reaction set (emoji + colour).
const REACTIONS: { type: string; emoji: string; label: string; color: string }[] = [
  { type: "like", emoji: "👍", label: "Like", color: "text-blue-600" },
  { type: "love", emoji: "❤️", label: "Love", color: "text-red-500" },
  { type: "haha", emoji: "😆", label: "Haha", color: "text-yellow-500" },
  { type: "wow", emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { type: "sad", emoji: "😢", label: "Sad", color: "text-yellow-500" },
  { type: "angry", emoji: "😡", label: "Angry", color: "text-orange-600" },
]
const REACTION_MAP = Object.fromEntries(REACTIONS.map((r) => [r.type, r]))

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function MediaGrid({ urls }: { urls: string[] }) {
  if (!urls || urls.length === 0) return null
  return (
    <div className={cn("grid gap-1", urls.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
      {urls.map((url, i) => {
        const isVideo = /\.(mp4|webm|mov)$/i.test(url)
        return (
          <div key={i} className="relative aspect-video overflow-hidden bg-muted">
            {isVideo ? (
              <video src={url} controls className="h-full w-full object-cover" />
            ) : (
              <img src={url} alt={`Media ${i + 1}`} className="h-full w-full object-cover" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// A single comment (with optional image, reactions, and one level of replies).
function CommentItem({
  comment,
  replies,
  postId,
  profile,
  onReplyAdded,
  onDeleted,
}: {
  comment: any
  replies: any[]
  postId: string
  profile: any
  onReplyAdded: (reply: any) => void
  onDeleted: (commentId: string) => void
}) {
  const [isReplying, setIsReplying] = useState(false)
  const [reaction, setReaction] = useState<string | null>(comment.user_reaction || null)
  const [reactionCount, setReactionCount] = useState<number>(comment.reactions_count || 0)
  const [showReactions, setShowReactions] = useState(false)
  const isReply = !!comment.parent_comment_id

  const react = async (type: string) => {
    setShowReactions(false)
    const wasActive = reaction === type
    // Optimistic update
    setReactionCount((c) => (wasActive ? Math.max(0, c - 1) : reaction ? c : c + 1))
    setReaction(wasActive ? null : type)
    try {
      await fetch(`/api/posts/${postId}/comments/${comment.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reaction_type: type }),
      })
    } catch {
      /* best-effort; counts re-sync on next load */
    }
  }

  const current = reaction ? REACTION_MAP[reaction] : null

  return (
    <div className={cn("flex gap-2", isReply && "ml-9")}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={comment.author?.photo_url || "/placeholder.svg"} />
        <AvatarFallback className="text-[10px]">{comment.author?.display_name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="inline-block max-w-full rounded-2xl bg-muted/70 px-3 py-2">
          <p className="text-xs font-bold">{comment.author?.display_name || "Anonymous"}</p>
          {comment.content && (
            <RichContent text={comment.content} className="whitespace-pre-wrap break-words text-sm" />
          )}
        </div>
        {comment.image_url && (
          <img
            src={comment.image_url}
            alt="Comment attachment"
            className="mt-1 max-h-72 rounded-xl border object-cover"
          />
        )}

        {/* Comment meta row: react / reply / count / delete */}
        <div className="mt-0.5 flex items-center gap-3 px-3 text-[11px] font-semibold text-muted-foreground">
          <span>{formatTimeAgo(comment.created_at)}</span>
          <div
            className="relative"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            <button
              type="button"
              onClick={() => react(reaction || "like")}
              className={cn("hover:underline", current && current.color)}
            >
              {current ? current.label : "Like"}
            </button>
            {showReactions && (
              <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-0.5 rounded-full border bg-background p-1 shadow-lg">
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    type="button"
                    onClick={() => react(r.type)}
                    title={r.label}
                    className="text-lg transition-transform hover:scale-125"
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!isReply && (
            <button type="button" onClick={() => setIsReplying((v) => !v)} className="hover:underline">
              Reply
            </button>
          )}
          {reactionCount > 0 && (
            <span className="flex items-center gap-0.5 font-normal">
              {current?.emoji || "👍"} {reactionCount}
            </span>
          )}
          {profile?.id && comment.author?.id === profile.id && (
            <button
              type="button"
              onClick={() => onDeleted(comment.id)}
              className="text-destructive hover:underline"
            >
              Delete
            </button>
          )}
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                replies={[]}
                postId={postId}
                profile={profile}
                onReplyAdded={onReplyAdded}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        )}

        {isReplying && (
          <CommentComposer
            postId={postId}
            profile={profile}
            parentCommentId={comment.id}
            autoFocus
            onCommentAdded={(reply) => {
              if (reply) onReplyAdded(reply)
              setIsReplying(false)
            }}
            onCancel={() => setIsReplying(false)}
          />
        )}
      </div>
    </div>
  )
}

// Comments area for a post: preview collapsed, loads full thread (with reactions)
// from the dedicated endpoint when expanded.
function CommentsSection({
  post,
  profile,
  onCountChange,
}: {
  post: any
  profile: any
  onCountChange: (delta: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<any[]>(post.recent_comments || [])
  const [loaded, setLoaded] = useState(false)
  const { toast } = useToast()

  const loadFull = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
        setLoaded(true)
      }
    } catch {
      /* keep preview */
    }
  }

  const expand = () => {
    setExpanded(true)
    if (!loaded) loadFull()
  }

  const addComment = (comment?: any) => {
    if (!comment) return
    setComments((prev) => [...prev, comment])
    onCountChange(1)
    setExpanded(true)
  }

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commentId }),
      })
      if (res.ok) {
        // Remove the comment and any of its replies.
        setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_comment_id !== commentId))
        onCountChange(-1)
      } else {
        const d = await res.json().catch(() => ({}))
        toast({ title: "Failed to delete", description: d.error || "", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" })
    }
  }

  const topLevel = comments.filter((c) => !c.parent_comment_id)
  const repliesByParent: Record<string, any[]> = {}
  comments.forEach((c) => {
    if (c.parent_comment_id) {
      ;(repliesByParent[c.parent_comment_id] = repliesByParent[c.parent_comment_id] || []).push(c)
    }
  })

  const totalCount = Math.max(post.comments_count || 0, comments.length)
  const visible = expanded ? topLevel : topLevel.slice(-1)

  return (
    <div className="space-y-3 px-3 pb-3 pt-1">
      {totalCount > visible.length && !expanded && (
        <button
          type="button"
          onClick={expand}
          className="text-xs font-semibold text-muted-foreground hover:underline"
        >
          View {totalCount > 1 ? `all ${totalCount} comments` : "comment"}
        </button>
      )}

      {visible.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={repliesByParent[comment.id] || []}
          postId={post.id}
          profile={profile}
          onReplyAdded={(reply) => {
            setComments((prev) => [...prev, reply])
            onCountChange(1)
          }}
          onDeleted={deleteComment}
        />
      ))}

      <CommentComposer postId={post.id} profile={profile} onCommentAdded={addComment} />
    </div>
  )
}

function PostCard({
  post: initialPost,
  profile,
  onChanged,
  onShared,
}: {
  post: any
  profile: any
  onChanged: () => void
  onShared: () => void
}) {
  const [post, setPost] = useState(initialPost)
  const [showReactions, setShowReactions] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || "")
  const [shareOpen, setShareOpen] = useState(false)
  const [shareText, setShareText] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  useEffect(() => setPost(initialPost), [initialPost])

  const isOwner = profile?.id && post.author?.id === profile.id
  const canModerate = isOwner || profile?.role === "admin"
  const current = post.user_reaction ? REACTION_MAP[post.user_reaction] : null

  const react = async (type: string) => {
    setShowReactions(false)
    const wasActive = post.user_reaction === type
    const newType = wasActive ? null : type
    const delta = wasActive ? -1 : post.user_reaction ? 0 : 1
    setPost((p: any) => ({
      ...p,
      user_reaction: newType,
      reactions_count: Math.max(0, (p.reactions_count || 0) + delta),
    }))
    try {
      await fetch(`/api/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reaction_type: type }),
      })
    } catch {
      /* best-effort */
    }
  }

  const toggleSave = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST", credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setPost((p: any) => ({ ...p, user_saved: data.saved }))
        toast({ title: data.saved ? "Saved to bookmarks" : "Removed from bookmarks" })
        onChanged()
      }
    } catch {
      toast({ title: "Error", description: "Could not update bookmark", variant: "destructive" })
    }
  }

  const saveEdit = async () => {
    if (!editContent.trim()) return
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: editContent }),
      })
      if (res.ok) {
        setPost((p: any) => ({ ...p, content: editContent }))
        setIsEditing(false)
        toast({ title: "Post updated" })
      }
    } catch {
      toast({ title: "Error", description: "Could not update post", variant: "destructive" })
    }
  }

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        toast({ title: "Post deleted" })
        onChanged()
      }
    } catch {
      toast({ title: "Error", description: "Could not delete post", variant: "destructive" })
    }
  }

  const submitShare = async () => {
    if (isSharing) return
    setIsSharing(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ share_text: shareText.trim() }),
      })
      if (res.ok) {
        setShareOpen(false)
        setShareText("")
        toast({ title: "Post shared!" })
        onShared()
      } else {
        const d = await res.json().catch(() => ({}))
        toast({ title: "Could not share", description: d.error || "", variant: "destructive" })
      }
    } finally {
      setIsSharing(false)
    }
  }

  const original = post.shared_post

  return (
    <Card className="overflow-hidden border-none bg-card shadow-sm ring-1 ring-border/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <Link href={post.author?.id ? `/members/${post.author.id}` : "#"}>
            <Avatar className="h-10 w-10 ring-1 ring-border">
              <AvatarImage src={post.author?.photo_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/5 text-xs font-bold text-primary">
                {post.author?.display_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              href={post.author?.id ? `/members/${post.author.id}` : "#"}
              className="text-sm font-bold leading-none hover:underline"
            >
              {post.author?.display_name || "Anonymous"}
            </Link>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>{formatTimeAgo(post.created_at)}</span>
              <span>·</span>
              {post.visibility === "public" ? (
                <Globe className="h-3 w-3" />
              ) : post.visibility === "friends" ? (
                <Users className="h-3 w-3" />
              ) : (
                <LockIcon className="h-3 w-3" />
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="More options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={toggleSave}>
              <Bookmark className={cn("mr-2 h-4 w-4", post.user_saved && "fill-current text-yellow-500")} />
              {post.user_saved ? "Remove bookmark" : "Save post"}
            </DropdownMenuItem>
            {canModerate && (
              <>
                <DropdownMenuSeparator />
                {isOwner && (
                  <DropdownMenuItem
                    onClick={() => {
                      setIsEditing(true)
                      setEditContent(post.content)
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={deletePost}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      {isEditing ? (
        <div className="space-y-3 px-4 py-3">
          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[90px]" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          {post.content && (
            <div className="px-4 py-3">
              <RichContent text={post.content} className="whitespace-pre-wrap text-sm leading-relaxed md:text-[15px]" />
            </div>
          )}

          {/* Shared (re-posted) original */}
          {post.shared_post_id &&
            (original ? (
              <div className="px-4 pb-3">
                <SharedPostCard sharedPost={original} />
              </div>
            ) : (
              <div className="mx-4 mb-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                This shared post is no longer available.
              </div>
            ))}

          {post.image_url && <img src={post.image_url} alt="Post media" className="max-h-[32rem] w-full object-cover" />}
          {post.video_url && (
            <video src={post.video_url} controls preload="metadata" className="max-h-[32rem] w-full bg-black" />
          )}
          {Array.isArray(post.media_urls) && post.media_urls.length > 0 && <MediaGrid urls={post.media_urls} />}
        </>
      )}

      {/* Counts row */}
      {(post.reactions_count > 0 || post.comments_count > 0 || post.shares_count > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {Object.keys(post.reactions_by_type || {}).slice(0, 3).map((t) => (
              <span key={t}>{REACTION_MAP[t]?.emoji || "👍"}</span>
            ))}
            {post.reactions_count > 0 && <span className="ml-1">{post.reactions_count}</span>}
          </div>
          <div className="flex gap-3">
            {post.comments_count > 0 && <span>{post.comments_count} comments</span>}
            {post.shares_count > 0 && <span>{post.shares_count} shares</span>}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="mx-2 grid grid-cols-3 border-t border-border/60 py-1">
        <div
          className="relative"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            type="button"
            onClick={() => react(post.user_reaction || "like")}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-colors hover:bg-muted",
              current ? current.color : "text-muted-foreground",
            )}
          >
            {current ? <span className="text-base">{current.emoji}</span> : <ThumbsUp className="h-5 w-5" />}
            {current ? current.label : "Like"}
          </button>
          {showReactions && (
            <div className="absolute bottom-full left-1/2 z-20 mb-1 flex -translate-x-1/2 gap-1 rounded-full border bg-background p-1.5 shadow-xl">
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => react(r.type)}
                  title={r.label}
                  className="text-2xl transition-transform hover:scale-125"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
        >
          <MessageCircle className="h-5 w-5" />
          Comment
        </button>

        <DropdownMenu open={shareOpen} onOpenChange={setShareOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 space-y-3 p-4">
            <p className="text-sm font-bold">Share this post</p>
            <Textarea
              placeholder="Say something about this…"
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              className="min-h-[70px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShareOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submitShare} disabled={isSharing}>
                {isSharing ? "Sharing…" : "Share now"}
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border/60 bg-muted/10">
          <CommentsSection
            post={post}
            profile={profile}
            onCountChange={(delta) =>
              setPost((p: any) => ({ ...p, comments_count: Math.max(0, (p.comments_count || 0) + delta) }))
            }
          />
        </div>
      )}
    </Card>
  )
}

export default function FeedPage() {
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostImage, setNewPostImage] = useState<string | null>(null)
  const [newPostVideo, setNewPostVideo] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public")
  const [isPosting, setIsPosting] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [view, setView] = useState<"feed" | "bookmarks">("feed")
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const { toast } = useToast()

  const visiblePosts = activeTag
    ? posts.filter((p) => (p.content || "").toLowerCase().includes(`#${activeTag.toLowerCase()}`))
    : posts

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [view])

  useEffect(() => {
    if (view !== "feed") return
    const channel = supabaseBrowser
      .channel("feed-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload: any) => {
        if (payload?.new?.author_id && payload.new.author_id !== profile?.id) setHasNewPosts(true)
      })
      .subscribe()
    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [view, profile?.id])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) setProfile(await res.json())
    } catch (err) {
      console.error("Error fetching profile:", err)
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const endpoint = view === "bookmarks" ? "/api/posts/saved" : "/api/posts"
      const res = await fetch(endpoint, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setPosts(
          (data.posts || []).map((p: any) => ({
            ...p,
            comments_count: Number(p.comments_count || 0),
            recent_comments: Array.isArray(p.recent_comments) ? p.recent_comments : [],
          })),
        )
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("path", "posts")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        if (type === "image") setNewPostImage(data.url)
        if (type === "video") setNewPostVideo(data.url)
      }
    } catch (err) {
      toast({ title: "Upload failed", description: "Could not upload file.", variant: "destructive" })
    } finally {
      e.target.value = ""
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage && !newPostVideo) return
    setIsPosting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: newPostContent,
          image_url: newPostImage,
          video_url: newPostVideo,
          visibility,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setNewPostContent("")
        setNewPostImage(null)
        setNewPostVideo(null)
        toast({ title: "Post shared! 🎉" })
        fetchPosts()
      } else {
        toast({ title: "Couldn't create post", description: data.error || "Try again.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error while posting.", variant: "destructive" })
    } finally {
      setIsPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-xl space-y-4 p-3 md:p-6">
      {/* Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Community</h1>
          <p className="text-sm text-muted-foreground">Catch up with your alumni network</p>
        </div>
        <Badge variant="outline" className="h-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/20">
          Feed
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/60 px-1">
        <button
          onClick={() => setView("feed")}
          className={cn(
            "border-b-2 px-1 pb-2 text-sm font-bold transition-all",
            view === "feed" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          All Posts
        </button>
        <button
          onClick={() => setView("bookmarks")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-1 pb-2 text-sm font-bold transition-all",
            view === "bookmarks" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Bookmark className="h-4 w-4" />
          Bookmarks
        </button>
      </div>

      {/* New posts banner */}
      {view === "feed" && hasNewPosts && (
        <div className="flex justify-center">
          <Button
            size="sm"
            className="rounded-full shadow-md"
            onClick={() => {
              setHasNewPosts(false)
              fetchPosts()
            }}
          >
            New posts available — tap to refresh
          </Button>
        </div>
      )}

      {/* Composer */}
      {view === "feed" && (
        <Card className="border-none bg-card shadow-sm ring-1 ring-border/60">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.photo_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.display_name?.split(" ").map((n: any) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder={`What's on your mind, ${profile?.display_name?.split(" ")[0] || "Alumnus"}?`}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[70px] resize-none border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
                />

                {(newPostImage || newPostVideo) && (
                  <div className="relative flex max-h-56 items-center justify-center overflow-hidden rounded-lg border bg-black">
                    {newPostImage && <img src={newPostImage} alt="preview" className="max-h-56 object-contain" />}
                    {newPostVideo && <video src={newPostVideo} controls className="max-h-56 object-contain" />}
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostImage(null)
                        setNewPostVideo(null)
                      }}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
                      aria-label="Remove media"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
                      <ImageIcon className="h-4 w-4" /> Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, "image")} />
                    </label>
                    <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
                      <VideoIcon className="h-4 w-4" /> Video
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, "video")} />
                    </label>
                    <EmojiPicker onSelect={(emoji) => setNewPostContent((c) => c + emoji)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs">
                          {visibility === "public" ? (
                            <Globe className="mr-1.5 h-3.5 w-3.5" />
                          ) : visibility === "friends" ? (
                            <Users className="mr-1.5 h-3.5 w-3.5" />
                          ) : (
                            <LockIcon className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          <span className="capitalize">{visibility}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setVisibility("public")} className="gap-2">
                          <Globe className="h-4 w-4" /> Public
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVisibility("friends")} className="gap-2">
                          <Users className="h-4 w-4" /> Friends
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setVisibility("private")} className="gap-2">
                          <LockIcon className="h-4 w-4" /> Private
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      disabled={(!newPostContent.trim() && !newPostImage && !newPostVideo) || isPosting}
                      onClick={handleCreatePost}
                      className="h-9 rounded-full px-5"
                    >
                      {isPosting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active hashtag filter */}
      {activeTag && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2 text-sm">
          <span>
            Showing posts tagged <span className="font-semibold text-primary">#{activeTag}</span>
          </span>
          <Button size="sm" variant="ghost" onClick={() => setActiveTag(null)}>
            Clear
          </Button>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {visiblePosts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {activeTag
              ? `No posts tagged #${activeTag}.`
              : view === "bookmarks"
                ? "No saved posts yet."
                : "No posts in your feed yet."}
          </div>
        ) : (
          visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} profile={profile} onChanged={fetchPosts} onShared={fetchPosts} />
          ))
        )}
      </div>
    </div>
  )
}
