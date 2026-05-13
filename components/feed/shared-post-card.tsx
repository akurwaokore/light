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
          <Avatar className="h-8 w-8">
            <AvatarImage src={sharedPost.author.photo_url || "/placeholder.svg"} />
            <AvatarFallback>
              {sharedPost.author.display_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{sharedPost.author.display_name}</p>
              {sharedPost.author.campus && (
                <span className="text-xs text-muted-foreground">• {sharedPost.author.campus}</span>
              )}
            </div>
            <p className="mt-2 text-sm">{sharedPost.content}</p>
            {sharedPost.image_url && (
              <img
                src={sharedPost.image_url || "/placeholder.svg"}
                alt="Shared post"
                className="mt-2 max-h-64 rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
