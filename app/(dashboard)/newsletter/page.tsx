"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Send, Clock, Mail, Edit, Trash2, FileText, Wand2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Newsletter {
  id: string
  title: string
  subject: string | null
  content: string | null
  status: string
  recipients: number | null
  sent_at: string | null
  created_at: string
}

export default function NewsletterPage() {
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [tone, setTone] = useState("professional")
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const drafts = newsletters.filter((n) => n.status !== "sent")
  const sent = newsletters.filter((n) => n.status === "sent")

  const fetchNewsletters = async () => {
    try {
      const res = await fetch("/api/admin/newsletter")
      if (res.ok) {
        const data = await res.json()
        setNewsletters(data.newsletters || [])
      } else if (res.status === 401 || res.status === 403) {
        toast.error("You need admin access to manage newsletters")
      }
    } catch {
      // non-fatal; tabs show empty states
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const handleAIGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      // Try the admin-configured AI provider first.
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You write alumni-community newsletters in a ${tone} tone. Return only the newsletter body.`,
          prompt: `Write a newsletter about: ${prompt}`,
          maxTokens: 600,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.text) {
          setContent(data.text)
          if (!subject) setSubject(prompt.slice(0, 80))
          return
        }
      }
      // 503 = AI not configured; fall through to the local template.
    } catch {
      // network error — fall back below
    } finally {
      setIsGenerating(false)
    }

    // Fallback: lightweight client-side composer (no AI dependency).
    const greeting =
      tone === "casual" || tone === "friendly" ? "Hi Light Alumni," : "Dear Light Alumni Community,"
    setContent(`${greeting}

We hope this message finds you well and thriving in your endeavors!

${prompt}

As we continue to strengthen our alumni network, we invite you to participate in our upcoming initiatives and events. Your involvement makes our community stronger.

Stay connected, stay inspired!

Warm regards,
Light Alumni Connect Team`)
    if (!subject) setSubject(prompt.slice(0, 80))
  }

  const persistDraft = async (): Promise<Newsletter | null> => {
    const payload = {
      title: title.trim() || subject.trim() || "Untitled newsletter",
      subject: subject.trim(),
      content,
      status: "draft",
    }
    const res = await fetch("/api/admin/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => "")
      throw new Error(msg || "Failed to save newsletter")
    }
    return res.json()
  }

  const resetForm = () => {
    setTitle("")
    setSubject("")
    setContent("")
    setPrompt("")
  }

  const handleSaveDraft = async () => {
    if (!subject.trim() && !title.trim()) {
      toast.error("Add a subject or title first")
      return
    }
    if (!content.trim()) {
      toast.error("Write some content first")
      return
    }
    setIsSaving(true)
    try {
      await persistDraft()
      toast.success("Draft saved")
      resetForm()
      fetchNewsletters()
    } catch (e: any) {
      toast.error(e.message || "Could not save draft")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendNow = async () => {
    if (!subject.trim() && !title.trim()) {
      toast.error("Add a subject or title first")
      return
    }
    if (!content.trim()) {
      toast.error("Write some content first")
      return
    }
    if (!confirm("Send this newsletter to all active subscribers?")) return
    setIsSending(true)
    try {
      const created = await persistDraft()
      if (!created?.id) throw new Error("Could not create newsletter")
      const res = await fetch(`/api/admin/newsletter/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      })
      if (!res.ok) throw new Error(await res.text().catch(() => "Send failed"))
      toast.success("Newsletter sent")
      resetForm()
      fetchNewsletters()
    } catch (e: any) {
      toast.error(e.message || "Could not send newsletter")
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this newsletter?")) return
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" })
      if (res.ok) {
        setNewsletters((prev) => prev.filter((n) => n.id !== id))
        toast.success("Newsletter removed")
      } else {
        toast.error("Delete failed")
      }
    } catch {
      toast.error("Delete failed")
    }
  }

  const handleSend = async (id: string) => {
    if (!confirm("Send this newsletter to all active subscribers?")) return
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      })
      if (res.ok) {
        toast.success("Newsletter sent")
        fetchNewsletters()
      } else {
        toast.error("Send failed")
      }
    } catch {
      toast.error("Send failed")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Newsletter</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Create and send newsletters to the alumni community
        </p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose">
            <Edit className="mr-2 h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="drafts">
            <Clock className="mr-2 h-4 w-4" />
            Drafts
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
                  Writing Assistant
                </CardTitle>
                <CardDescription>Generate a starting draft from a short brief</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>What would you like to write about?</Label>
                  <Textarea
                    placeholder="e.g., Announce the upcoming annual reunion with networking, guest speakers, and how to register..."
                    className="min-h-[120px]"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
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
                  <Label htmlFor="title">Internal Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. March 2026 Alumni Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="The subject alumni will see in their inbox..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your newsletter content here or use the assistant to generate..."
                    className="min-h-[300px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSending}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Save Draft
                </Button>
                <Button onClick={handleSendNow} disabled={isSaving || isSending}>
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Now
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle>Drafts</CardTitle>
              <CardDescription>Newsletters not yet sent</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </div>
              ) : drafts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No drafts yet.</p>
              ) : (
                <div className="space-y-4">
                  {drafts.map((n) => (
                    <div
                      key={n.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-medium">{n.title}</h3>
                          <p className="truncate text-sm text-muted-foreground">{n.subject || "No subject"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {n.status}
                        </Badge>
                        <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={() => handleSend(n.id)}>
                          <Send className="h-4 w-4" /> Send
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(n.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {isLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </div>
              ) : sent.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No newsletters sent yet.</p>
              ) : (
                <div className="space-y-4">
                  {sent.map((n) => (
                    <div
                      key={n.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-medium">{n.title}</h3>
                          <p className="truncate text-sm text-muted-foreground">
                            Sent {n.sent_at ? new Date(n.sent_at).toLocaleDateString() : "—"} · {n.recipients || 0}{" "}
                            recipients
                          </p>
                        </div>
                      </div>
                      <Badge>{n.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
