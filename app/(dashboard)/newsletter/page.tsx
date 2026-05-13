"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Send, Clock, Mail, Eye, Edit, Trash2, FileText, Wand2, Loader2 } from "lucide-react"

const pastNewsletters = [
  {
    id: 1,
    title: "November Alumni Digest",
    sentDate: "Nov 15, 2024",
    recipients: 2850,
    openRate: "68%",
    status: "sent",
  },
  {
    id: 2,
    title: "Career Spotlight: Tech Industry",
    sentDate: "Nov 1, 2024",
    recipients: 2820,
    openRate: "72%",
    status: "sent",
  },
  {
    id: 3,
    title: "October Events Recap",
    sentDate: "Oct 28, 2024",
    recipients: 2780,
    openRate: "65%",
    status: "sent",
  },
  {
    id: 4,
    title: "Annual Gala Announcement",
    sentDate: "Oct 15, 2024",
    recipients: 2750,
    openRate: "78%",
    status: "sent",
  },
]

const scheduledNewsletters = [
  {
    id: 1,
    title: "December Holiday Edition",
    scheduledDate: "Dec 1, 2024",
    recipients: 2900,
    status: "scheduled",
  },
  {
    id: 2,
    title: "Year in Review 2024",
    scheduledDate: "Dec 20, 2024",
    recipients: 2900,
    status: "draft",
  },
]

export default function NewsletterPage() {
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")

  const handleAIGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setContent(`Dear Light Alumni Community,

We hope this message finds you well and thriving in your endeavors!

${prompt}

As we continue to strengthen our alumni network, we invite you to participate in our upcoming initiatives and events. Your involvement makes our community stronger.

Stay connected, stay inspired!

Warm regards,
Light Alumni Connect Team`)
    setIsGenerating(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Newsletter</h1>
        <p className="text-muted-foreground">Create and manage newsletters with AI-powered assistance</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose">
            <Edit className="mr-2 h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="mr-2 h-4 w-4" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Mail className="mr-2 h-4 w-4" />
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* AI Assistant */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Writing Assistant
                </CardTitle>
                <CardDescription>Generate newsletter content using AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>What would you like to write about?</Label>
                  <Textarea
                    placeholder="e.g., Announce the upcoming annual reunion event with details about networking opportunities, guest speakers, and how to register..."
                    className="min-h-[120px]"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select defaultValue="professional">
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAIGenerate} disabled={isGenerating || !prompt.trim()}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Compose Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Compose Newsletter</CardTitle>
                <CardDescription>Write or edit your newsletter content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members (2,900)</SelectItem>
                      <SelectItem value="premium">Premium Members (1,250)</SelectItem>
                      <SelectItem value="active">Active Members (2,450)</SelectItem>
                      <SelectItem value="batch-2020">Class of 2020+ (980)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your newsletter content here or use AI to generate..."
                    className="min-h-[300px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                  <Button>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Newsletters</CardTitle>
              <CardDescription>Upcoming newsletters to be sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledNewsletters.map((newsletter) => (
                  <div key={newsletter.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{newsletter.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Scheduled for {newsletter.scheduledDate} | {newsletter.recipients} recipients
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={newsletter.status === "scheduled" ? "default" : "secondary"}>
                        {newsletter.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Newsletters</CardTitle>
              <CardDescription>History of sent newsletters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastNewsletters.map((newsletter) => (
                  <div key={newsletter.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{newsletter.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Sent {newsletter.sentDate} | {newsletter.recipients} recipients
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{newsletter.openRate}</p>
                        <p className="text-xs text-muted-foreground">Open rate</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
