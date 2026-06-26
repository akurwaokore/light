"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SharedPostCardProps {
  sharedPost: {
    id: string
    content: string
    image_url: string | null
    author: {
      display_name: string
      photo_url: string | null
      campus: string | null
    }
    created_at: string
  }
}

export function SharedPostCard({ sharedPost }: SharedPostCardProps) {
  return (
    <Card className="mt-3 border-2 bg-muted/20">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={sharedPost.author.photo_url || "/placeholder.svg"} />
            <AvatarFallback>
              {sharedPost.author.display_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium">{sharedPost.author.display_name}</p>
              {sharedPost.author.campus && (
                <span className="shrink-0 text-xs text-muted-foreground">• {sharedPost.author.campus}</span>
              )}
            </div>
            <p className="mt-2 break-words text-sm">{sharedPost.content}</p>
            {sharedPost.image_url && (
              <img
                src={sharedPost.image_url || "/placeholder.svg"}
                alt="Shared post"
                className="mt-2 max-h-64 max-w-full rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
