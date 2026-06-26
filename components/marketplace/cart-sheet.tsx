"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingCart, Trash2, Minus, Plus, Loader2, ShieldCheck, ImageIcon } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"

const money = (n: number) => `KSh ${Number(n || 0).toLocaleString()}`

export function CartSheet() {
  const { items, total, count, updateQty, remove, refresh } = useCart()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [checkingOut, setCheckingOut] = useState(false)

  const qtyTotal = items.reduce((s, it) => s + (it.quantity || 0), 0)

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
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {count > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 min-w-5 justify-center rounded-full px-1 text-xs">
              {count}
            </Badge>
          )}
          <span className="sr-only">Open cart</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
            {qtyTotal > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                · {qtyTotal} item{qtyTotal === 1 ? "" : "s"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-muted-foreground">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-8 w-8 opacity-40" />
            </div>
            <p className="font-medium text-foreground">Your cart is empty</p>
            <p className="mt-1 text-sm">Browse the marketplace and add items to get started.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <ul className="divide-y">
                {items.map((it) => {
                  const img = it.product?.image_url || it.product?.images?.[0] || ""
                  return (
                    <li key={it.id} className="flex gap-3 p-4">
                      {/* Thumbnail */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={it.product?.title || "Product"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">
                            {it.product?.title || "Product"}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mr-1 -mt-1 h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(it.id)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{money(it.unit_price)} each</p>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          {/* Quantity stepper */}
                          <div className="inline-flex items-center rounded-full border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQty(it.id, Math.max(1, it.quantity - 1)).catch((e) => toast.error(e.message))}
                              disabled={it.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-7 text-center text-sm font-medium tabular-nums">{it.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQty(it.id, it.quantity + 1).catch((e) => toast.error(e.message))}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm font-bold tabular-nums">{money(it.line_total)}</span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>

            {/* Sticky summary + checkout */}
            <div className="space-y-4 border-t bg-background/95 p-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{money(total)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold tabular-nums">{money(total)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mpesa-phone" className="text-xs text-muted-foreground">
                  M-Pesa number
                </Label>
                <Input
                  id="mpesa-phone"
                  placeholder="2547XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.trim())}
                  inputMode="numeric"
                  className="h-11"
                />
              </div>

              <Button className="h-11 w-full rounded-full text-base" onClick={handleCheckout} disabled={checkingOut}>
                {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Pay {money(total)} with M-Pesa
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure payment · items from different sellers become separate orders.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
