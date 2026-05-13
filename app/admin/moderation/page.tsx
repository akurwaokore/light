"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  Briefcase,
  ShoppingBag,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
} from "lucide-react"

const pendingContent = [
  {
    id: "1",
    type: "job",
    title: "Senior Software Engineer at Tech Corp",
    author: "John Mwangi",
    authorAvatar: "JM",
    content: "Looking for an experienced software engineer...",
    submittedAt: "2024-12-01 10:30",
    category: "Technology",
    status: "pending",
    flags: 0,
    image: null,
  },
  {
    id: "2",
    type: "product",
    title: "MacBook Pro 2023 for Sale",
    author: "Alice Njeri",
    authorAvatar: "AN",
    content: "Selling my MacBook Pro in excellent condition...",
    submittedAt: "2024-12-01 09:15",
    category: "Electronics",
    status: "pending",
    flags: 0,
    image: "/iphone-14-pro-space-black-smartphone.jpg",
  },
  {
    id: "3",
    type: "event",
    title: "Networking Dinner - December",
    author: "Events Committee",
    authorAvatar: "EC",
    content: "Join us for our monthly networking dinner...",
    submittedAt: "2024-12-01 08:45",
    category: "Networking",
    status: "pending",
    flags: 0,
    image: "/professional-networking-event-kenya-nairobi.jpg",
  },
  {
    id: "4",
    type: "post",
    title: "Excited to announce my new startup!",
    author: "David Omondi",
    authorAvatar: "DO",
    content: "After months of hard work, I'm proud to launch...",
    submittedAt: "2024-12-01 07:20",
    category: "Business",
    status: "pending",
    flags: 2,
    image: null,
  },
]

const flaggedContent = [
  {
    id: "5",
    type: "post",
    title: "Controversial opinion about...",
    author: "Mary Wangari",
    authorAvatar: "MW",
    content: "I think we need to discuss...",
    submittedAt: "2024-11-30 18:30",
    category: "Discussion",
    status: "flagged",
    flags: 5,
    flagReasons: ["Inappropriate content", "Spam", "Misinformation"],
    image: null,
  },
  {
    id: "6",
    type: "product",
    title: "Cheap deals on electronics",
    author: "Peter Kamau",
    authorAvatar: "PK",
    content: "Get amazing discounts...",
    submittedAt: "2024-11-30 16:00",
    category: "Electronics",
    status: "flagged",
    flags: 3,
    flagReasons: ["Spam", "Suspicious"],
    image: "/placeholder.jpg",
  },
]

const moderationStats = [
  { label: "Pending Review", value: "47", icon: Clock, color: "yellow" },
  { label: "Flagged Content", value: "12", icon: Flag, color: "red" },
  { label: "Approved Today", value: "89", icon: CheckCircle, color: "green" },
  { label: "Rejected Today", value: "8", icon: XCircle, color: "gray" },
]

export default function ContentModeration() {
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      job: Briefcase,
      product: ShoppingBag,
      event: Calendar,
      post: MessageSquare,
    }
    const Icon = icons[type] || MessageSquare
    return <Icon className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      job: "blue",
      product: "purple",
      event: "green",
      post: "orange",
    }
    return colors[type] || "gray"
  }

  const handleApprove = (content: any) => {
    console.log("[akurwas] Approving content:", content.id)
    setIsReviewDialogOpen(false)
  }

  const handleReject = (content: any) => {
    console.log("[akurwas] Rejecting content:", content.id, "Reason:", rejectionReason)
    setIsReviewDialogOpen(false)
    setRejectionReason("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">Review and manage user-generated content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {moderationStats.map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 text-${stat.color}-500`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Content</TabsTrigger>
          <TabsTrigger value="approved">Recently Approved</TabsTrigger>
          <TabsTrigger value="rejected">Recently Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pending content..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="job">Jobs</SelectItem>
                    <SelectItem value="product">Products</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="post">Posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingContent.map((content) => (
                  <Card key={content.id} className="p-4">
                    <div className="flex gap-4">
                      {content.image && (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={content.image || "/placeholder.svg"}
                            alt={content.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`text-${getTypeColor(content.type)}-500 border-${getTypeColor(content.type)}-500`}
                              >
                                {getTypeIcon(content.type)}
                                <span className="ml-1">{content.type}</span>
                              </Badge>
                              {content.flags > 0 && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Flag className="h-3 w-3" />
                                  {content.flags} flags
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg">{content.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{content.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`/african-male-professional-headshot.jpg?query=${content.author}`} />
                              <AvatarFallback className="text-xs">{content.authorAvatar}</AvatarFallback>
                            </Avatar>
                            <span>{content.author}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{content.submittedAt}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedContent(content)
                                setIsReviewDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleApprove(content)}
                            >
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedContent(content)
                                setIsReviewDialogOpen(true)
                              }}
                            >
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Flagged Content Requiring Attention</CardTitle>
              <CardDescription>Content reported by community members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flaggedContent.map((content) => (
                  <Card key={content.id} className="p-4 border-red-200 dark:border-red-900">
                    <div className="flex gap-4">
                      {content.image && (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={content.image || "/placeholder.svg"}
                            alt={content.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`text-${getTypeColor(content.type)}-500 border-${getTypeColor(content.type)}-500`}
                              >
                                {getTypeIcon(content.type)}
                                <span className="ml-1">{content.type}</span>
                              </Badge>
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {content.flags} reports
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg">{content.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{content.content}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {content.flagReasons?.map((reason, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`/african-woman-professional.jpg?query=${content.author}`} />
                              <AvatarFallback className="text-xs">{content.authorAvatar}</AvatarFallback>
                            </Avatar>
                            <span>{content.author}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{content.submittedAt}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedContent(content)
                                setIsReviewDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Review
                            </Button>
                            <Button size="sm" variant="default" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Keep
                            </Button>
                            <Button size="sm" variant="destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recently Approved Content</CardTitle>
              <CardDescription>Content approved in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">No recently approved content to display</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recently Rejected Content</CardTitle>
              <CardDescription>Content rejected in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">No recently rejected content to display</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
            <DialogDescription>Detailed content review and moderation</DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-${getTypeColor(selectedContent.type)}-500`}>
                  {getTypeIcon(selectedContent.type)}
                  <span className="ml-1">{selectedContent.type}</span>
                </Badge>
                {selectedContent.flags > 0 && (
                  <Badge variant="destructive">
                    <Flag className="h-3 w-3 mr-1" />
                    {selectedContent.flags} flags
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-bold text-xl mb-2">{selectedContent.title}</h3>
                <p className="text-muted-foreground">{selectedContent.content}</p>
              </div>

              {selectedContent.image && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedContent.image || "/placeholder.svg"}
                    alt={selectedContent.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={`/african-businesswoman.png?query=${selectedContent.author}`} />
                  <AvatarFallback>{selectedContent.authorAvatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedContent.author}</p>
                  <p className="text-sm text-muted-foreground">Submitted on {selectedContent.submittedAt}</p>
                </div>
              </div>

              {selectedContent.flagReasons && (
                <div className="space-y-2">
                  <Label>Flag Reasons:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.flagReasons.map((reason: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => selectedContent && handleApprove(selectedContent)}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedContent && handleReject(selectedContent)}
              disabled={!rejectionReason}
            >
              <ThumbsDown className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
