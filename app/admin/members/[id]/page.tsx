"use client"

import { useEffect, useState, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Mail, Calendar, ArrowLeft, Save, Trophy, Crown } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const TIERS = ["free", "silver", "gold", "platinum"]

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [member, setMember] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch(`/api/admin/members/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Member not found"); return r.json() })
      .then((data) => {
        setMember(data)
        setForm({
          display_name: data.display_name || "", full_name: data.full_name || "",
          bio: data.bio || "", location: data.location || "", job_title: data.job_title || "",
          company: data.company || "", membership_tier: data.membership_tier || "free",
          points: data.points ?? 0, is_admin: !!data.is_admin, status: data.status || "active",
        })
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [id, toast])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, points: Number(form.points) }),
      })
      if (!res.ok) throw new Error((await res.text()) || "Save failed")
      toast({ title: "Saved", description: "Member profile updated." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!member) return (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
      <h2 className="text-2xl font-bold">Member not found</h2>
      <Button asChild variant="outline"><Link href="/admin/members"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Button asChild variant="ghost" size="sm"><Link href="/admin/members"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold truncate">Edit Member</h1>
        </div>
        <Button className="w-full sm:w-auto" onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24"><AvatarImage src={member.photo_url || ""} /><AvatarFallback>{member.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            </div>
            <CardTitle>{form.display_name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              {form.is_admin ? <Badge className="bg-primary">Admin</Badge> : <Badge variant="secondary">Member</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{member.email}</span></div>
            <div className="flex items-center gap-3 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Joined {new Date(member.created_at).toLocaleDateString()}</span></div>
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium"><Trophy className="h-4 w-4 text-amber-500" /> Loyalty points</div>
              <Input type="number" value={form.points} onChange={(e) => set("points", e.target.value)} />
              <div className="flex items-center gap-2 pt-2 text-sm font-medium"><Crown className="h-4 w-4 text-primary" /> Membership tier</div>
              <Select value={form.membership_tier} onValueChange={(v) => set("membership_tier", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="is_admin">Administrator</Label>
              <Switch id="is_admin" checked={form.is_admin} onCheckedChange={(v) => set("is_admin", v)} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label>Display name</Label><Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} /></div>
            <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
            <div><Label>Job title</Label><Input value={form.job_title} onChange={(e) => set("job_title", e.target.value)} /></div>
            <div><Label>Company</Label><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["active", "inactive", "suspended"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
