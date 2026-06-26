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

  if (loading) return <div className="container mx-auto max-w-2xl p-4 text-muted-foreground md:p-6">Loading…</div>
  if (!order) return <div className="container mx-auto max-w-2xl p-4 md:p-6">Order not found.</div>

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">Order Receipt</h1>
        <Badge className="w-fit">{order.status.replace("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(order.items || []).map((it: any) => (
            <div key={it.id} className="flex flex-col gap-1 border-b pb-2 text-sm sm:flex-row sm:justify-between sm:gap-2">
              <span className="min-w-0 break-words">{it.title_snapshot} × {it.quantity}</span>
              <span className="shrink-0 break-words">{order.currency} {Number(it.line_total).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex flex-col gap-1 pt-2 font-bold sm:flex-row sm:justify-between sm:gap-2">
            <span>Total</span>
            <span className="break-words">{order.currency} {Number(order.total).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {contact.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contact.map((c: any) => (
              <div key={c.party} className="text-sm">
                <p className="font-medium capitalize flex items-center gap-1 min-w-0"><User className="h-3 w-3 shrink-0" /> <span className="break-words">{c.party}: {c.full_name}</span></p>
                {c.phone && <p className="flex items-center gap-1 text-muted-foreground min-w-0"><Phone className="h-3 w-3 shrink-0" /> <span className="break-words">{c.phone}</span></p>}
                {c.email && <p className="flex items-center gap-1 text-muted-foreground min-w-0"><Mail className="h-3 w-3 shrink-0" /> <span className="break-words">{c.email}</span></p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
