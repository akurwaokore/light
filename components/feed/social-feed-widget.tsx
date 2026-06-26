"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  MessageSquare,
  ImageIcon,
  Send,
  MoreHorizontal,
  Loader2,
  Laugh,
  Frown,
  ThumbsUp,
  Sparkles,
  Bookmark,
  MapPin,
  Globe,
  Users,
  Lock,
  Share2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface Post {
  id: string
  content: string
  image_url: string | null
  visibility: string
  location: string | null
  created_at: string
  author: {
    id: string
    display_name: string
    photo_url: string | null
    campus: string | null
    is_hiring?: boolean
    open_to_work?: boolean
  }
  reactions_count: number
  reactions_by_type: Record<string, number>
  user_reaction: string | null
  shares_count: number
  comments_count: number
}

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

export function SocialFeedWidget({ profile }: { profile: any }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostVisibility, setNewPostVisibility] = useState("public")
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts?limit=5")
      const data = await response.json()
      
      if (response.ok && data && !data.error) {
        setPosts(data.posts || [])
      } else {
        console.error("[akurwas] Posts API error:", data?.error || "Unknown error")
        setPosts([])
      }
    } catch (err) {
      console.error("[akurwas] Failed to load posts:", err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !profile) return

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          visibility: newPostVisibility,
        }),
      })

      if (response.ok) {
        setNewPostContent("")
        setNewPostVisibility("public")
        fetchPosts()
        toast({
          title: "Post created",
          description: "Your post has been shared successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="h-3 w-3" />
      case "friends":
        return <Users className="h-3 w-3" />
      case "private":
        return <Lock className="h-3 w-3" />
      default:
        return <Globe className="h-3 w-3" />
    }
  }

  if (!profile) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <Card className="glass-strong rounded-3xl border-primary/20 shadow-xl">
        <CardHeader>
          <h3 className="font-serif text-lg font-semibold">Share with Community</h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={profile.photo_url || "/placeholder.svg"} alt={profile.display_name} />
              <AvatarFallback>
                {profile.display_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Share something with your alumni community..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] resize-none glass"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Photo
                  </Button>
                  <Select value={newPostVisibility} onValueChange={setNewPostVisibility}>
                    <SelectTrigger className="w-32 h-9 glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Friends
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-3 w-3" />
                          Private
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {posts.slice(0, 3).map((post) => {
            const ReactionIcon = post.user_reaction ? REACTION_ICONS[post.user_reaction] : Heart
            const reactionColor = post.user_reaction ? REACTION_COLORS[post.user_reaction] : ""

            return (
              <Card key={post.id} className="glass-strong rounded-3xl border-primary/20 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="shrink-0">
                        <AvatarImage src={post.author.photo_url || "/placeholder.svg"} alt={post.author.display_name} />
                        <AvatarFallback>
                          {post.author.display_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="truncate font-medium">{post.author.display_name}</p>
                           {post.author.is_hiring && <Badge className="h-4 text-[9px] bg-blue-600 px-1 border-0">Hiring</Badge>}
                           {post.author.open_to_work && <Badge variant="secondary" className="h-4 text-[9px] bg-green-600 text-white px-1 border-0">Open to Work</Badge>}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>{formatTimeAgo(post.created_at)}</span>
                          <span>•</span>
                          {getVisibilityIcon(post.visibility)}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Bookmark className="mr-2 h-4 w-4" />
                          Save Post
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="whitespace-pre-wrap break-words">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url || "/placeholder.svg"} alt="Post" className="mt-3 h-auto max-w-full rounded-lg" />
                  )}
                  {post.location && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {post.location}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-3 pt-0">
                  {post.reactions_count > 0 && (
                    <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {Object.entries(post.reactions_by_type).map(([type, count]) => {
                          const Icon = REACTION_ICONS[type]
                          const color = REACTION_COLORS[type]
                          return (
                            <div key={type} className={`flex items-center ${color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                          )
                        })}
                        <span>{post.reactions_count}</span>
                      </div>
                      <div className="flex gap-3">
                        {post.comments_count > 0 && <span>{post.comments_count} comments</span>}
                        {post.shares_count > 0 && <span>{post.shares_count} shares</span>}
                      </div>
                    </div>
                  )}
                  <Separator />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex gap-2">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)}
                          className={reactionColor}
                        >
                          <ReactionIcon className={`mr-1 h-4 w-4 ${post.user_reaction ? "fill-current" : ""}`} />
                          {post.user_reaction
                            ? post.user_reaction.charAt(0).toUpperCase() + post.user_reaction.slice(1)
                            : "React"}
                        </Button>
                        {showReactionPicker === post.id && (
                          <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-lg border bg-background p-2 shadow-lg z-10">
                            {Object.entries(REACTION_ICONS).map(([type, Icon]) => (
                              <Button
                                key={type}
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${REACTION_COLORS[type]}`}
                                onClick={() => handleReaction(post.id, type)}
                              >
                                <Icon className="h-5 w-5" />
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/feed?post=${post.id}`}>
                          <MessageSquare className="mr-1 h-4 w-4" />
                          Comment
                        </Link>
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Share2 className="mr-1 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}

          {/* View More Link */}
          <div className="flex justify-center">
            <Button variant="outline" asChild className="glass bg-transparent">
              <Link href="/feed">
                View All Posts
                <MessageSquare className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
