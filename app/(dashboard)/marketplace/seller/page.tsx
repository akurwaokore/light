"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Package, Clock, ListChecks } from "lucide-react"

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/seller/stats").then((r) => r.json()),
      fetch("/api/marketplace/orders?role=seller").then((r) => r.json()),
    ])
      .then(([s, o]) => {
        setStats(s)
        setOrders(o.orders || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: "Earnings (KSh)", value: stats?.earnings?.toLocaleString() ?? "0", icon: Wallet },
    { label: "Paid orders", value: stats?.paid_orders ?? 0, icon: ListChecks },
    { label: "Pending", value: stats?.pending_orders ?? 0, icon: Clock },
    { label: "Listings", value: stats?.listings ?? 0, icon: Package },
  ]

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">Seller Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <c.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{loading ? "…" : c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Incoming Orders</h2>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardContent className="flex items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.items?.length || 0} item(s) · KSh {Number(o.total).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className="shrink-0">{o.status.replace("_", " ")}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
