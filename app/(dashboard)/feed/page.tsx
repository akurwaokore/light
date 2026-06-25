"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
  Heart, 
  MessageCircle, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Send, 
  MoreHorizontal, 
  Share2, 
  Bookmark, 
  Loader2, 
  Smile,
  Globe,
  Users,
  Lock as LockIcon,
  Plus,
  Play,
  Edit2,
  Trash2,
  ThumbsUp,
  Laugh,
  Frown,
  Sparkles
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabaseBrowser } from "@/lib/supabaseBrowser"
import { RichContent } from "@/components/feed/rich-content"

const REACTION_ICONS: Record<string, any> = {
  like: ThumbsUp,
  love: Heart,
  haha: Laugh,
  wow: Sparkles,
  sad: Frown,
  angry: Frown,
}

const REACTION_COLORS: Record<string, string> = {
  like: "text-blue-500",
  love: "text-red-500",
  haha: "text-yellow-500",
  wow: "text-purple-500",
  sad: "text-gray-500",
  angry: "text-orange-500",
}
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

function CommentInput({ 
  postId, 
  profile, 
  onCommentAdded, 
  parentCommentId, 
  autoFocus = false,
  onCancel
}: { 
  postId: string, 
  profile: any, 
  onCommentAdded: (comment?: any) => void,
  parentCommentId?: string,
  autoFocus?: boolean,
  onCancel?: () => void
}) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          content: content.trim(),
          parent_comment_id: parentCommentId 
        }),
      })
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        setContent("")
        onCommentAdded(data.comment)
        toast({ title: parentCommentId ? "Reply posted!" : "Comment posted!" })
        if (onCancel) onCancel()
      } else {
        toast({ 
          title: "Failed to post", 
          description: data.error || "Unknown error",
          variant: "destructive" 
        })
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error while posting", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn(
      "px-4 py-2 flex items-center gap-2",
      !parentCommentId && "border-t border-border/40"
    )}>
      <Avatar className="h-6 w-6">
        <AvatarImage src={profile?.photo_url || "/placeholder.svg"} />
        <AvatarFallback className="text-[10px]">
          {profile?.display_name?.[0] || "U"}
        </AvatarFallback>
      </Avatar>
      <input 
        autoFocus={autoFocus}
        placeholder={parentCommentId ? "Write a reply..." : "Add a comment..."} 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape' && onCancel) onCancel()
        }}
        disabled={isSubmitting}
        className="flex-1 bg-transparent text-xs border-none focus:ring-0 placeholder:text-muted-foreground/60"
      />
      <div className="flex items-center gap-2">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="text-[10px] font-medium text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="text-xs font-bold text-primary opacity-50 hover:opacity-100 transition-opacity disabled:opacity-30"
        >
          {isSubmitting ? "..." : "Post"}
        </button>
      </div>
    </div>
  )
}

function ShareDialog({ postId, onShared }: { postId: string, onShared: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [shareText, setShareText] = useState("")
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (isSharing) return
    setIsSharing(true)
    try {
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_text: shareText.trim() }),
      })
      if (res.ok) {
        setIsOpen(false)
        setShareText("")
        onShared()
      }
    } catch (err) {
      console.error("Error sharing post:", err)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Share post"
        >
          <Share2 className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4 space-y-4">
        <p className="text-sm font-bold">Share this post</p>
        <Textarea 
          placeholder="Say something about this..." 
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
          className="min-h-[80px]"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleShare} disabled={isSharing}>
            {isSharing ? "Sharing..." : "Share Now"}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CommentItem({ comment, post, profile, onCommentAdded, onCommentDeleted }: any) {
  const [isReplying, setIsReplying] = useState(false);
  const isReply = !!comment.parent_comment_id;

  const formatTimeAgo = (dateString: string) => {
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

  return (
    <div 
      className={cn(
        "flex gap-3",
        isReply && "ml-8 border-l-2 border-primary/10 pl-4"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.author?.photo_url || "/placeholder.svg"} />
        <AvatarFallback className="text-[10px]">
          {comment.author?.display_name?.[0] || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="rounded-2xl bg-muted/50 px-4 py-2 text-sm shadow-sm ring-1 ring-border/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-bold text-xs">{comment.author?.display_name}</p>
              <span className="text-[10px] text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  Reply
                </button>
              )}
              {profile?.id && comment.author?.id === profile.id && (
                <button
                  onClick={() => onCommentDeleted(post.id, comment.id)}
                  className="text-[10px] font-semibold text-destructive hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <p className="mt-0.5 text-xs md:text-sm">{comment.content}</p>
        </div>
        
        {isReplying && (
          <div className="mt-2">
            <CommentInput
              postId={post.id}
              profile={profile}
              parentCommentId={comment.id}
              autoFocus
              onCommentAdded={(reply) => {
                onCommentAdded(post.id, reply);
                setIsReplying(false);
              }}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostImage, setNewPostImage] = useState<string | null>(null)
  const [newPostVideo, setNewPostVideo] = useState<string | null>(null)
  const [newPostMedia, setNewPostMedia] = useState<string[]>([])
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public")
  const [isPosting, setIsPosting] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [view, setView] = useState<'feed' | 'bookmarks'>('feed')
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

  // Realtime: surface a "new posts" banner when someone else publishes.
  useEffect(() => {
    if (view !== 'feed') return
    const channel = supabaseBrowser
      .channel('feed-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload: any) => {
        if (payload?.new?.author_id && payload.new.author_id !== profile?.id) {
          setHasNewPosts(true)
        }
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
      const endpoint = view === 'bookmarks' ? "/api/posts/saved" : "/api/posts"
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        const normalizedPosts = (data.posts || []).map((post: any) => ({
          ...post,
          comments_count: Number(post.comments_count || 0),
          recent_comments: Array.isArray(post.recent_comments) ? post.recent_comments : [],
        }))
        setPosts(normalizedPosts)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error fetching posts:", response.status, errorData)
        // Show empty feed on error instead of hanging
        setPosts([])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCommentAdded = (postId: string, comment?: any) => {
    if (!comment) {
      fetchPosts()
      return
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post
        
        if (comment.parent_comment_id) {
          fetchPosts() // Full refresh for correct threading
          return post
        }

        const existingComments = Array.isArray(post.recent_comments) ? post.recent_comments : []
        const safeCount = Number(post.comments_count || 0)
        return {
          ...post,
          comments_count: safeCount + 1,
          recent_comments: [comment, ...existingComments],
        }
      }),
    )
  }

  const handleCommentDeleted = async (postId: string, commentId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commentId }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: "Failed to delete comment",
          description: data.error || "Unknown error",
          variant: "destructive",
        })
        return
      }

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post
          const existingComments = Array.isArray(post.recent_comments) ? post.recent_comments : []
          const safeCount = Number(post.comments_count || 0)
          return {
            ...post,
            comments_count: Math.max(0, safeCount - 1),
            recent_comments: existingComments.filter((c: any) => c.id !== commentId),
          }
        }),
      )

      toast({ title: "Comment deleted" })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({ title: "Error", description: "Network error while deleting comment", variant: "destructive" })
    }
  }

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: reactionType }),
      })

      if (response.ok) {
        fetchPosts()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to react to post",
        variant: "destructive",
      })
    }
    setShowReactionPicker(null)
  }

  const handleToggleSave = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: "POST"
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: data.saved ? "Post Bookmarked" : "Post Removed from Bookmarks",
          description: data.message,
        })
        
        // Update local state or filter out if we're in bookmarks view
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, user_saved: data.saved } : post
          ).filter((post) => view !== 'bookmarks' || data.saved)
        )
      }
    } catch (error) {
      console.error("Error toggling save:", error)
    }
  }

  const handleUpdatePost = async (postId: string) => {
    if (!editContent.trim()) return
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      if (response.ok) {
        setIsEditing(null)
        setEditContent("")
        toast({ title: "Post updated" })
        fetchPosts()
      }
    } catch (error) {
      console.error("Error updating post:", error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Post deleted" })
        fetchPosts()
      }
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return
    setIsPosting(true)

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: newPostContent,
          image_url: newPostImage,
          video_url: newPostVideo,
          media_urls: newPostMedia,
          visibility: visibility
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setNewPostContent("")
        setNewPostImage(null)
        setNewPostVideo(null)
        setNewPostMedia([])

        toast({
          title: "Post created! 🎉",
          description: "Your post has been shared with the community.",
          className: "bg-green-50 border-green-200 text-green-800",
        })

        fetchPosts()
      } else {
        toast({
          title: "Couldn't create post",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Network error while creating your post.",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'multi') => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("path", "posts")

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })
        const data = await res.json()
        
        if (data.url) {
          if (type === 'image') setNewPostImage(data.url)
          if (type === 'video') setNewPostVideo(data.url)
          if (type === 'multi') setNewPostMedia(prev => [...prev, data.url])
        }
      }
    } catch (err) {
      console.error("Error uploading media:", err)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive"
      })
    }
  }

  const formatTimeAgo = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Feed</h1>
          <p className="text-sm font-medium text-muted-foreground">Catch up with your alumni network</p>
        </div>
        <Badge variant="outline" className="h-8 px-3 text-xs font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/20">
          Community
        </Badge>
      </div>

      {/* Bookmarks Toggle Tab View Selector */}
      <div className="flex border-b border-border/40 px-2 pb-1 gap-4">
        <button
          onClick={() => setView('feed')}
          className={cn(
            "text-sm font-bold pb-2 border-b-2 transition-all px-1",
            view === 'feed' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          All Posts
        </button>
        <button
          onClick={() => setView('bookmarks')}
          className={cn(
            "text-sm font-bold pb-2 border-b-2 transition-all px-1 flex items-center gap-1.5",
            view === 'bookmarks' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Bookmark className="h-4 w-4" />
          Bookmarks
        </button>
      </div>

      {/* Realtime: new posts available */}
      {view === 'feed' && hasNewPosts && (
        <div className="flex justify-center">
          <Button
            size="sm"
            className="rounded-full shadow-md"
            onClick={() => { setHasNewPosts(false); fetchPosts() }}
          >
            New posts available — tap to refresh
          </Button>
        </div>
      )}

      {/* Create Post (only shown when on feed view) */}
      {view === 'feed' && (
        <Card className="border-none bg-gradient-to-br from-background via-background to-primary/5 shadow-xl shadow-primary/5 ring-1 ring-border/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 ring-2 ring-background md:h-12 md:w-12">
                <AvatarImage src={profile?.photo_url || "/placeholder.svg"} alt={profile?.display_name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.display_name?.split(" ").map((n: any) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder={`What's on your mind, ${profile?.display_name?.split(" ")[0] || "Alumnus"}?`}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[100px] border-none bg-transparent p-0 text-lg shadow-none focus-visible:ring-0 md:text-xl"
                />
                {/* Media Upload Options */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary cursor-pointer">
                    <ImageIcon className="h-4 w-4" />
                    <span>Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleMediaUpload(e, 'image')}
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary cursor-pointer">
                    <VideoIcon className="h-4 w-4" />
                    <span>Add Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleMediaUpload(e, 'video')}
                    />
                  </label>
                </div>

                {/* Media Previews */}
                {(newPostImage || newPostVideo) && (
                  <div className="relative mt-2 rounded-lg border overflow-hidden max-h-48 bg-black flex items-center justify-center">
                    {newPostImage && <img src={newPostImage} alt="Upload preview" className="max-h-48 object-contain" />}
                    {newPostVideo && <video src={newPostVideo} controls className="max-h-48 object-contain" />}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1 md:gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 rounded-full">
                          {visibility === "public" ? <Globe className="mr-2 h-4 w-4" /> : 
                           visibility === "friends" ? <Users className="mr-2 h-4 w-4" /> : 
                           <LockIcon className="mr-2 h-4 w-4" />}
                          <span className="hidden sm:inline capitalize">{visibility}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-40 rounded-xl">
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
                  </div>
                  <Button 
                    disabled={!newPostContent.trim() || isPosting} 
                    onClick={handleCreatePost}
                    className="h-10 rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active hashtag filter */}
      {activeTag && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2 text-sm">
          <span>Showing posts tagged <span className="font-semibold text-primary">#{activeTag}</span></span>
          <Button size="sm" variant="ghost" onClick={() => setActiveTag(null)}>Clear</Button>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-10">
        {visiblePosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {activeTag ? `No posts tagged #${activeTag}.` : view === 'bookmarks' ? 'No saved posts found.' : 'No posts in your feed yet.'}
          </div>
        ) : (
          visiblePosts.map((post) => (
            <div key={post.id} className="group relative">
              {/* Header */}
              <div className="flex items-center justify-between px-2 mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                    <AvatarImage src={post.author?.photo_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {post.author?.display_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold leading-none">{post.author?.display_name || "Anonymous"}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
                      <span>{formatTimeAgo(post.created_at)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        {post.visibility === 'public' ? <Globe className="h-2.5 w-2.5" /> : 
                         post.visibility === 'friends' ? <Users className="h-2.5 w-2.5" /> : 
                         <LockIcon className="h-2.5 w-2.5" />}
                        {post.visibility || 'public'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expose Post Edit / Post Delete & Bookmark Actions visually */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="More options">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleToggleSave(post.id)}>
                      <Bookmark className={cn("mr-2 h-4 w-4", post.user_saved && "fill-current text-yellow-500")} />
                      {post.user_saved ? "Unsave Post" : "Save Post"}
                    </DropdownMenuItem>
                    {profile?.id && (post.author?.id === profile.id || profile.role === "admin") && (
                      <>
                        <DropdownMenuSeparator />
                        {post.author?.id === profile.id && (
                          <DropdownMenuItem onClick={() => {
                            setIsEditing(post.id)
                            setEditContent(post.content)
                          }}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Post
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Post
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card Body */}
              <Card className="overflow-hidden border-none bg-card/50 shadow-2xl shadow-black/5 ring-1 ring-border/50 transition-all hover:shadow-primary/5">
                <CardContent className="p-0">
                  {isEditing === post.id ? (
                    <div className="px-5 py-4 space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleUpdatePost(post.id)}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="px-5 py-4">
                        <RichContent
                          text={post.content}
                          className="whitespace-pre-wrap text-sm leading-relaxed md:text-base"
                          onTagClick={setActiveTag}
                        />
                      </div>

                      {/* Rich Media Visualizers (Images, Video Player, multi) */}
                      {post.image_url && (
                        <div className="relative overflow-hidden border-t border-border/10 max-h-96">
                          <img 
                            src={post.image_url} 
                            alt="Post media" 
                            className="w-full h-full object-cover max-h-96"
                          />
                        </div>
                      )}
                      
                      {post.video_url && (
                        <div className="relative overflow-hidden border-t border-border/10 max-h-[400px] bg-black flex items-center justify-center">
                          <video 
                            src={post.video_url} 
                            controls 
                            className="w-full max-h-[400px]"
                            preload="metadata"
                          />
                        </div>
                      )}

                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className={cn(
                          "grid gap-1 border-t border-border/10",
                          post.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        )}>
                          {post.media_urls.map((url: string, index: number) => {
                            const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov');
                            return (
                              <div key={index} className="relative overflow-hidden aspect-video bg-muted">
                                {isVideo ? (
                                  <video src={url} controls className="w-full h-full object-cover" />
                                ) : (
                                  <img src={url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Reactions counts by type summary bar */}
                  {post.reactions_count > 0 && (
                    <div className="flex w-full items-center justify-between px-5 py-2 border-t border-b border-border/5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {Object.entries(post.reactions_by_type || {}).map(([type, count]) => {
                          const Icon = REACTION_ICONS[type] || Heart
                          const color = REACTION_COLORS[type] || ""
                          return (
                            <div key={type} className={cn("flex items-center", color)}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                          )
                        })}
                        <span className="ml-1 font-medium">{post.reactions_count}</span>
                      </div>
                      <div className="flex gap-3">
                        {post.comments_count > 0 && <span>{post.comments_count} comments</span>}
                        {post.shares_count > 0 && <span>{post.shares_count} shares</span>}
                      </div>
                    </div>
                  )}

                  {/* Reaction and action button triggers */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
                    <div className="flex items-center gap-4">
                      {/* Emoji reaction picker trigger */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)}
                          className={cn(
                            "flex items-center gap-1.5 transition-all active:scale-110",
                            post.user_reaction ? REACTION_COLORS[post.user_reaction] + " font-bold" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {(() => {
                            const Icon = post.user_reaction ? REACTION_ICONS[post.user_reaction] : Heart
                            return <Icon className={cn("h-6 w-6", post.user_reaction && "fill-current")} />
                          })()}
                          <span className="text-xs capitalize">{post.user_reaction || "React"}</span>
                        </button>

                        {showReactionPicker === post.id && (
                          <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-xl border bg-background p-2 shadow-xl z-20">
                            {Object.entries(REACTION_ICONS).map(([type, Icon]) => (
                              <button
                                key={type}
                                className={cn(
                                  "h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors",
                                  REACTION_COLORS[type]
                                )}
                                onClick={() => handleReaction(post.id, type)}
                                aria-label={`React with ${type}`}
                              >
                                <Icon className="h-5 w-5" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-xs">{post.comments_count > 0 ? post.comments_count : ""}</span>
                      </button>

                      {/* Connect ShareDialog component to API route */}
                      <ShareDialog postId={post.id} onShared={fetchPosts} />
                    </div>
                  </div>
                  
                  {(Number(post.comments_count || 0) > 0 || (Array.isArray(post.recent_comments) && post.recent_comments.length > 0)) && (
                    <div className="px-4 py-4 space-y-4">
                      <button 
                        onClick={fetchPosts}
                        className="text-xs font-medium text-muted-foreground hover:underline"
                      >
                        Refresh comments ({Number(post.comments_count || 0)})
                      </button>
                      
                      <div className="space-y-4">
                        {post.recent_comments?.map((comment: any) => (
                          <CommentItem 
                            key={comment.id}
                            comment={comment}
                            post={post}
                            profile={profile}
                            onCommentAdded={handleCommentAdded}
                            onCommentDeleted={handleCommentDeleted}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <CommentInput
                    postId={post.id}
                    profile={profile}
                    onCommentAdded={(comment) => handleCommentAdded(post.id, comment)}
                  />
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
