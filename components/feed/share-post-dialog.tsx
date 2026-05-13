"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SharePostDialogProps {
  postId: string
  originalPost: {
    author: {
      display_name: string
      photo_url: string | null
    }
    content: string
    image_url: string | null
  }
  currentUser: {
    display_name: string
    photo_url: string | null
  }
  onShareSuccess?: () => void
}

export function SharePostDialog({ postId, originalPost, currentUser, onShareSuccess }: SharePostDialogProps) {
  const [open, setOpen] = useState(false)
  const [shareText, setShareText] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleShare = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_text: shareText }),
      })

      if (response.ok) {
        toast({
          title: "Post shared",
          description: "The post has been shared to your timeline",
        })
        setOpen(false)
        setShareText("")
        onShareSuccess?.()
      } else {
        throw new Error("Failed to share post")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Share2 className="mr-1 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
          <DialogDescription>Add your thoughts about this post</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current User */}
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={currentUser.photo_url || "/placeholder.svg"} />
              <AvatarFallback>
                {currentUser.display_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{currentUser.display_name}</p>
              <p className="text-sm text-muted-foreground">Sharing publicly</p>
            </div>
          </div>

          {/* Share Text Input */}
          <Textarea
            placeholder="Say something about this..."
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            className="min-h-[80px] resize-none"
          />

          {/* Original Post Preview */}
          <Card className="border-2">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={originalPost.author.photo_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {originalPost.author.display_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{originalPost.author.display_name}</p>
                  <p className="mt-2 text-sm">{originalPost.content}</p>
                  {originalPost.image_url && (
                    <img
                      src={originalPost.image_url || "/placeholder.svg"}
                      alt="Post"
                      className="mt-2 max-h-48 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
