"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Globe,
  Bell,
  Shield,
  Database,
  Zap,
  DollarSign,
  Users,
  Calendar,
  ShoppingBag,
  Save,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"
import { toast } from "sonner"

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    siteName: "Light Alumni Connect",
    siteDescription: "Official alumni platform for Light Academy",
    adminEmail: "admin@lightalumni.com",
    supportEmail: "support@lightalumni.com",
    defaultCurrency: "KES",
    enableRegistration: true,
    requireEmailVerification: false,
    enableMarketplace: true,
    marketplaceCommission: "5",
    enableDonations: true,
    enableEvents: true,
    maxEventAttendees: "500",
    enableJobBoard: true,
    emailNotifications: true,
    pushNotifications: false,
    maintenanceMode: false,
    analyticsEnabled: true,
    pesapal_consumer_key: "",
    pesapal_consumer_secret: "",
    pesapal_environment: "sandbox",
    pesapalConsumerKey: "",
    pesapalConsumerSecret: "",
    pesapalEnvironment: "sandbox",
  })

  const [ai, setAi] = useState({
    provider: "openai",
    enabled: false,
    openai_api_key: "",
    openai_model: "gpt-4o-mini",
    gemini_api_key: "",
    gemini_model: "gemini-1.5-flash",
    custom_url: "",
    custom_api_key: "",
    custom_model: "",
    custom_auth_header: "Authorization",
    custom_auth_scheme: "Bearer",
    custom_format: "openai",
  })
  const [aiSaving, setAiSaving] = useState(false)

  useEffect(() => {
    const fetchAi = async () => {
      try {
        const res = await fetch("/api/admin/ai-settings")
        if (res.ok) {
          const data = await res.json()
          if (data && Object.keys(data).length > 0) {
            setAi((prev) => ({
              ...prev,
              ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null)),
            }))
          }
        }
      } catch {
        /* ignore */
      }
    }
    fetchAi()
  }, [])

  const handleSaveAi = async () => {
    setAiSaving(true)
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ai),
      })
      if (res.ok) toast.success("AI assistant settings saved")
      else toast.error("Failed to save AI settings")
    } catch {
      toast.error("An error occurred while saving AI settings")
    } finally {
      setAiSaving(false)
    }
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const data = await response.json()
          if (data && Object.keys(data).length > 0) {
            setSettings((prev) => ({ ...prev, ...data }))
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success("Settings saved successfully")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("An error occurred while saving settings")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure platform settings and preferences</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Site Information
              </CardTitle>
              <CardDescription>Basic platform information and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  value={settings.defaultCurrency}
                  onValueChange={(value) => setSettings({ ...settings, defaultCurrency: value })}
                >
                  <SelectTrigger id="defaultCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                    <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Registration
              </CardTitle>
              <CardDescription>Configure user sign-up and verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Enable Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow new users to create accounts</p>
                </div>
                <Switch
                  checked={settings.enableRegistration}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableRegistration: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Users must verify their email before accessing the platform
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Marketplace Settings
              </CardTitle>
              <CardDescription>Configure marketplace and commission rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Enable Marketplace</Label>
                  <p className="text-sm text-muted-foreground">Allow users to buy and sell products</p>
                </div>
                <Switch
                  checked={settings.enableMarketplace}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableMarketplace: checked })}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="commission">Platform Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.marketplaceCommission}
                  onChange={(e) => setSettings({ ...settings, marketplaceCommission: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">Commission charged on marketplace transactions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events Settings
              </CardTitle>
              <CardDescription>Configure event management features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Enable Events</Label>
                  <p className="text-sm text-muted-foreground">Allow users to create and manage events</p>
                </div>
                <Switch
                  checked={settings.enableEvents}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableEvents: checked })}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Event Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  value={settings.maxEventAttendees}
                  onChange={(e) => setSettings({ ...settings, maxEventAttendees: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">Maximum number of attendees per event</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Other Features
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Enable Donations</Label>
                  <p className="text-sm text-muted-foreground">Allow fundraising campaigns and donations</p>
                </div>
                <Switch
                  checked={settings.enableDonations}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableDonations: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Enable Job Board</Label>
                  <p className="text-sm text-muted-foreground">Allow job postings and applications</p>
                </div>
                <Switch
                  checked={settings.enableJobBoard}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableJobBoard: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
              <CardDescription>Configure payment gateways and methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>M-Pesa Configuration</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="Consumer Key" />
                  <Input placeholder="Consumer Secret" type="password" />
                  <Input placeholder="Shortcode" />
                  <Input placeholder="Passkey" type="password" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>PayPal Configuration</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="Client ID" />
                  <Input placeholder="Client Secret" type="password" />
                  <Select defaultValue="sandbox">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Pesapal Configuration</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Consumer Key</Label>
                    <Input
                      placeholder="Consumer Key"
                      value={settings.pesapal_consumer_key || settings.pesapalConsumerKey}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        pesapal_consumer_key: e.target.value,
                        pesapalConsumerKey: e.target.value 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Consumer Secret</Label>
                    <Input
                      placeholder="Consumer Secret"
                      type="password"
                      value={settings.pesapal_consumer_secret || settings.pesapalConsumerSecret}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        pesapal_consumer_secret: e.target.value,
                        pesapalConsumerSecret: e.target.value 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Environment</Label>
                    <Select
                      value={settings.pesapal_environment || settings.pesapalEnvironment}
                      onValueChange={(value) => setSettings({ 
                        ...settings, 
                        pesapal_environment: value,
                        pesapalEnvironment: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Power the "Generate with AI" features (marketplace descriptions, newsletters) with your own provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Enable AI Assistant</Label>
                  <p className="text-sm text-muted-foreground">Turn AI generation on across the platform</p>
                </div>
                <Switch checked={ai.enabled} onCheckedChange={(checked) => setAi({ ...ai, enabled: checked })} />
              </div>
              <Separator />

              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={ai.provider} onValueChange={(value) => setAi({ ...ai, provider: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="custom">Custom VPS / Self-hosted LLM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {ai.provider === "openai" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>OpenAI API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={ai.openai_api_key}
                      onChange={(e) => setAi({ ...ai, openai_api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      placeholder="gpt-4o-mini"
                      value={ai.openai_model}
                      onChange={(e) => setAi({ ...ai, openai_model: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {ai.provider === "gemini" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gemini API Key</Label>
                    <Input
                      type="password"
                      placeholder="AIza..."
                      value={ai.gemini_api_key}
                      onChange={(e) => setAi({ ...ai, gemini_api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      placeholder="gemini-1.5-flash"
                      value={ai.gemini_model}
                      onChange={(e) => setAi({ ...ai, gemini_model: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {ai.provider === "custom" && (
                <div className="space-y-4 rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your own LLM running on a VPS. Use <strong>OpenAI-compatible</strong> if your server exposes a
                    <code className="mx-1 rounded bg-muted px-1">/chat/completions</code> endpoint; otherwise use{" "}
                    <strong>Simple</strong> (we POST <code className="rounded bg-muted px-1">{`{ prompt, system, model }`}</code>{" "}
                    and read the text from the response).
                  </p>
                  <div className="space-y-2">
                    <Label>Endpoint URL</Label>
                    <Input
                      placeholder="https://your-vps.example.com/v1/chat/completions"
                      value={ai.custom_url}
                      onChange={(e) => setAi({ ...ai, custom_url: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Model name</Label>
                      <Input
                        placeholder="llama-3.1-8b-instruct"
                        value={ai.custom_model}
                        onChange={(e) => setAi({ ...ai, custom_model: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Request format</Label>
                      <Select value={ai.custom_format} onValueChange={(value) => setAi({ ...ai, custom_format: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI-compatible</SelectItem>
                          <SelectItem value="simple">Simple (prompt → text)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-1">
                      <Label>Auth token</Label>
                      <Input
                        type="password"
                        placeholder="optional"
                        value={ai.custom_api_key}
                        onChange={(e) => setAi({ ...ai, custom_api_key: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auth header</Label>
                      <Input
                        placeholder="Authorization"
                        value={ai.custom_auth_header}
                        onChange={(e) => setAi({ ...ai, custom_auth_header: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auth scheme</Label>
                      <Input
                        placeholder="Bearer (blank = raw token)"
                        value={ai.custom_auth_scheme}
                        onChange={(e) => setAi({ ...ai, custom_auth_scheme: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveAi} disabled={aiSaving} className="w-full sm:w-auto">
                  {aiSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>Platform security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input id="sessionTimeout" type="number" defaultValue="60" />
                <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>System-level configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Put site in maintenance mode</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label>Analytics Tracking</Label>
                  <p className="text-sm text-muted-foreground">Enable platform analytics</p>
                </div>
                <Switch
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, analyticsEnabled: checked })}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Database Backup</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Database className="mr-2 h-4 w-4" />
                    Backup Now
                  </Button>
                  <Select defaultValue="daily">
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
