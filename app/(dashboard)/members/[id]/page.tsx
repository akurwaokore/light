"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Briefcase, 
  MapPin, 
  Phone, 
  Linkedin, 
  Mail, 
  Loader2, 
  Lock,
  MessageSquare,
  ArrowLeft,
  UserPlus,
  Clock,
  LayoutGrid,
  FileText,
  PlayCircle,
  ImageIcon
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ChatWindow } from "@/components/chat/chat-window"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MemberProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [activity, setActivity] = useState<{ posts: any[], media: any[] }>({ posts: [], media: [] })
  const [loadingActivity, setLoadingActivity] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProfile()
    }
  }, [params.id])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        if (!data.is_restricted) {
            fetchActivity()
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = async () => {
    if (!profile) return
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: profile.id }),
      })
      if (res.ok) {
        const { conversationId } = await res.json()
        // Dispatch global event for ChatContainer
        window.dispatchEvent(new CustomEvent('open-chat', {
          detail: { id: conversationId, name: profile.display_name }
        }))
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.details || data.error || "Could not start chat", 
          variant: "destructive" 
        })
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not start chat", variant: "destructive" })
    }
  }

  const fetchActivity = async () => {
    setLoadingActivity(true)
    try {
      const res = await fetch(`/api/profile/${params.id}/activity`)
      if (res.ok) {
        setActivity(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleConnect = async () => {
    if (!profile || isConnecting) return
    setIsConnecting(true)

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friend_id: profile.id }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Friend request sent successfully",
        })
        fetchProfile()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to send friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to send friend request:", error)
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold">Profile not found</h2>
        <Button variant="link" asChild className="mt-4">
          <Link href="/friends">Back to Network</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12 mb-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.photo_url || "/placeholder.svg"} alt={profile.display_name} />
              <AvatarFallback className="text-4xl">
                {profile.display_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                {profile.is_restricted && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Limited Profile
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {profile.campus} • Class of {profile.graduation_year}
              </p>
            </div>
            {!profile.is_restricted && (
              <Button onClick={handleStartChat}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            )}
          </div>

          <Separator className="my-6" />

          {profile.is_restricted ? (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Profile is Restricted</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  You must be connected with {profile.display_name} to view their full profile details, postings, and albums.
                </p>
              </div>
              {profile.friendship_status === "pending" ? (
                <Button disabled variant="outline" className="gap-2">
                  <Clock className="h-4 w-4" />
                  {profile.is_requester ? "Request Pending" : "Respond in Friends Tab"}
                </Button>
              ) : (
                <Button onClick={handleConnect} disabled={isConnecting} className="gap-2">
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Connect to View Profile
                </Button>
              )}
            </div>
          ) : (
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="about" className="gap-2">
                  <UserPlus className="h-4 w-4" /> About
                </TabsTrigger>
                <TabsTrigger value="posts" className="gap-2">
                  <FileText className="h-4 w-4" /> Postings
                </TabsTrigger>
                <TabsTrigger value="media" className="gap-2">
                  <LayoutGrid className="h-4 w-4" /> Gallery
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <div className="grid gap-8 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">About</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {profile.bio || "No bio provided."}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <Briefcase className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Current Role</p>
                            <p className="font-medium">{profile.job_title || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <Briefcase className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Company</p>
                            <p className="font-medium">{profile.company || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <MapPin className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Location</p>
                            <p className="font-medium">{profile.location || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{profile.email || "Private"}</span>
                        </div>
                        {profile.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{profile.phone}</span>
                          </div>
                        )}
                        {profile.linkedin && (
                          <div className="flex items-center gap-3">
                            <Linkedin className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={profile.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline truncate"
                            >
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="posts">
                {loadingActivity ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>
                ) : activity.posts.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">No past postings to show.</div>
                ) : (
                  <div className="space-y-6">
                    {activity.posts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="pt-6">
                          <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
                          {post.image_url && <img src={post.image_url} alt="Post image" className="rounded-lg max-h-96 w-full object-cover mb-4" />}
                          {post.video_url && <video src={post.video_url} controls className="rounded-lg w-full mb-4" />}
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            Posted on {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="media">
                {loadingActivity ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>
                ) : activity.media.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">No photos or videos shared yet.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {activity.media.map((item, i) => (
                      <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-muted">
                        {item.type === 'image' ? (
                          <img src={item.url} alt="Member media" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-black">
                            <PlayCircle className="h-10 w-10 text-white opacity-50" />
                            <video src={item.url} className="absolute inset-0 h-full w-full object-cover opacity-30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                           <Badge variant="outline" className="text-[8px] bg-black/50 text-white border-0">
                             {item.type === 'image' ? <ImageIcon className="h-2 w-2 mr-1" /> : <PlayCircle className="h-2 w-2 mr-1" />}
                             {new Date(item.created_at).toLocaleDateString()}
                           </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
