"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, User } from "lucide-react"

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [contact, setContact] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/marketplace/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.order)
        setContact(d.contact || [])
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="container mx-auto max-w-2xl p-6 text-muted-foreground">Loading…</div>
  if (!order) return <div className="container mx-auto max-w-2xl p-6">Order not found.</div>

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Order Receipt</h1>
        <Badge>{order.status.replace("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(order.items || []).map((it: any) => (
            <div key={it.id} className="flex justify-between border-b pb-2 text-sm">
              <span>{it.title_snapshot} × {it.quantity}</span>
              <span>{order.currency} {Number(it.line_total).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold">
            <span>Total</span>
            <span>{order.currency} {Number(order.total).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {contact.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contact.map((c: any) => (
              <div key={c.party} className="text-sm">
                <p className="font-medium capitalize flex items-center gap-1"><User className="h-3 w-3" /> {c.party}: {c.full_name}</p>
                {c.phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {c.phone}</p>}
                {c.email && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {c.email}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
