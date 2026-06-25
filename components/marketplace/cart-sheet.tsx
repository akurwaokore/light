"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, Trash2, Minus, Plus, Loader2 } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"

export function CartSheet() {
  const { items, total, count, updateQty, remove, refresh } = useCart()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [checkingOut, setCheckingOut] = useState(false)

  const handleCheckout = async () => {
    if (!phone.match(/^2547\d{8}$/)) {
      toast.error("Enter your M-Pesa number as 2547XXXXXXXX")
      return
    }
    setCheckingOut(true)
    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "mpesa", phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Checkout failed")
      toast.success(data.message || "Check your phone to authorize payment.")
      await refresh()
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {count > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 min-w-5 justify-center rounded-full px-1 text-xs">
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
            <ShoppingCart className="mb-3 h-10 w-10 opacity-40" />
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="-mx-6 flex-1 px-6">
              <div className="space-y-4 py-4">
                {items.map((it) => (
                  <div key={it.id} className="flex gap-3 border-b pb-4">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium">{it.product?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        KSh {Number(it.unit_price).toLocaleString()} each
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline" size="icon" className="h-7 w-7"
                          onClick={() => updateQty(it.id, Math.max(1, it.quantity - 1)).catch((e) => toast.error(e.message))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{it.quantity}</span>
                        <Button
                          variant="outline" size="icon" className="h-7 w-7"
                          onClick={() => updateQty(it.id, it.quantity + 1).catch((e) => toast.error(e.message))}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="ml-auto h-7 w-7 text-destructive"
                          onClick={() => remove(it.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-semibold">
                      KSh {Number(it.line_total).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>KSh {Number(total).toLocaleString()}</span>
              </div>
              <Input
                placeholder="M-Pesa number (2547XXXXXXXX)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.trim())}
                inputMode="numeric"
              />
              <Button className="w-full" onClick={handleCheckout} disabled={checkingOut}>
                {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Pay with M-Pesa
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Items from different sellers become separate orders.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
