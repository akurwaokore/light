"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Check, X, Search, Loader2, UserCheck, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ChatWindow } from "@/components/chat/chat-window"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Friend {
  id: string
  status: string
  requested_at: string
  accepted_at: string | null
  is_requester: boolean
  profile: {
    id: string
    display_name: string
    photo_url: string | null
    campus: string | null
    job_title: string | null
    company: string | null
  }
}

interface Suggestion {
  id: string
  display_name: string
  photo_url: string | null
  campus: string | null
  graduation_year: number | null
  job_title: string | null
  company: string | null
}

export default function FriendsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedFriendName, setSelectedFriendName] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchFriends()
    fetchPendingRequests()
    fetchSuggestions()
  }, [])

  const fetchFriends = async () => {
    try {
      const response = await fetch("/api/friends?status=accepted")
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      // Fetch all non-accepted friendships
      const response = await fetch("/api/friends")
      if (response.ok) {
        const data = await response.json()
        // Show both incoming and outgoing pending requests
        setPendingRequests(data.friends?.filter((f: Friend) => f.status === 'pending') || [])
      }
    } catch (error) {
      console.error("Failed to fetch pending requests:", error)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/friends/suggestions")
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
    }
  }

  const sendFriendRequest = async (friendId: string, friendName: string) => {
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friendId }),
      })

      if (response.ok) {
        setSelectedFriendName(friendName)
        setIsRequestDialogOpen(true)
        setSuggestions(suggestions.filter((s) => s.id !== friendId))
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      })
    }
  }

  const handleFriendRequest = async (friendshipId: string, action: "accept" | "decline", requesterId?: string) => {
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast({
          title: action === "accept" ? "Friend request accepted" : "Friend request declined",
          description: action === "accept" ? "You are now connected" : "Request has been declined",
        })
        
        if (action === "accept" && requesterId) {
          router.push(`/members/${requesterId}`)
        } else {
          fetchFriends()
          fetchPendingRequests()
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      })
    }
  }

  const removeFriend = async (friendshipId: string) => {
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Friend removed",
          description: "Connection has been removed",
        })
        fetchFriends()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      })
    }
  }

  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null)

  const handleStartChat = async (recipientId: string, name: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      })
      if (res.ok) {
        const { conversationId } = await res.json()
        setActiveChat({ id: conversationId, name })
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not start chat", variant: "destructive" })
    }
  }

  const filteredFriends = friends.filter((f) =>
    f.profile.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6 relative">
      {activeChat && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
          <ChatWindow 
            conversationId={activeChat.id} 
            recipientName={activeChat.name} 
            onClose={() => setActiveChat(null)} 
          />
        </div>
      )}
      <div>
        <h1 className="font-serif text-3xl font-bold">My Network</h1>
        <p className="mt-1 text-muted-foreground">Connect with fellow alumni and expand your network</p>
      </div>

      {/* Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5" />
              Friend Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-lg bg-background p-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.profile.photo_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {request.profile.display_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.profile.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.profile.job_title && request.profile.company
                        ? `${request.profile.job_title} at ${request.profile.company}`
                        : request.profile.campus || "Alumni"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleFriendRequest(request.id, "accept", request.profile.id)}>
                    <Check className="mr-1 h-4 w-4" />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleFriendRequest(request.id, "decline")}>
                    <X className="mr-1 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="friends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="friends">
            <Users className="mr-2 h-4 w-4" />
            My Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <UserPlus className="mr-2 h-4 w-4" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFriends.map((friend) => (
              <Card key={friend.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={friend.profile.photo_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {friend.profile.display_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Link href={`/members/${friend.profile.id}`} className="mt-4 hover:underline">
                      <h3 className="font-semibold">{friend.profile.display_name}</h3>
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {friend.profile.job_title && friend.profile.company
                        ? `${friend.profile.job_title} at ${friend.profile.company}`
                        : friend.profile.campus || "Alumni"}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => handleStartChat(friend.profile.id, friend.profile.display_name)}>
                        Message
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeFriend(friend.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFriends.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No friends yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery ? "No friends match your search" : "Start connecting with fellow alumni"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Link href={`/members/${suggestion.id}`}>
                      <Avatar className="h-20 w-20 hover:opacity-80 transition-opacity">
                        <AvatarImage src={suggestion.photo_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {suggestion.display_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link href={`/members/${suggestion.id}`} className="mt-4 hover:underline">
                      <h3 className="font-semibold">{suggestion.display_name}</h3>
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {suggestion.job_title && suggestion.company
                        ? `${suggestion.job_title} at ${suggestion.company}`
                        : suggestion.campus || "Alumni"}
                    </p>
                    {suggestion.campus && (
                      <Badge variant="secondary" className="mt-2">
                        {suggestion.campus}
                      </Badge>
                    )}
                    <Button className="mt-4 w-full" onClick={() => sendFriendRequest(suggestion.id, suggestion.display_name)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Friend
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {suggestions.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No suggestions available</h3>
                <p className="mt-2 text-sm text-muted-foreground">Check back later for more connection suggestions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Connection Request Sent Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Connection Request Sent</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your request to connect with <span className="font-semibold text-foreground">{selectedFriendName}</span> has been sent. You will be notified once they accept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button type="button" onClick={() => setIsRequestDialogOpen(false)} className="px-8">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
