"use client"

import { useCallback, useEffect, useState } from "react"

export type CartItem = {
  id: string
  quantity: number
  unit_price: number
  line_total: number
  product: any
}

const CART_EVENT = "cart:changed"

export function notifyCartChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_EVENT))
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/marketplace/cart", { credentials: "include" })
      if (!res.ok) {
        setItems([])
        setTotal(0)
        return
      }
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener(CART_EVENT, handler)
    return () => window.removeEventListener(CART_EVENT, handler)
  }, [refresh])

  const add = useCallback(async (productId: string, quantity = 1) => {
    const res = await fetch("/api/marketplace/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId, quantity }),
    })
    const data = await res.json().catch(() => ({}))
    notifyCartChanged()
    if (!res.ok) throw new Error(data.error || "Could not add to cart")
    return data
  }, [])

  const updateQty = useCallback(async (itemId: string, quantity: number) => {
    const res = await fetch(`/api/marketplace/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ quantity }),
    })
    notifyCartChanged()
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Could not update item")
    }
  }, [])

  const remove = useCallback(async (itemId: string) => {
    await fetch(`/api/marketplace/cart/${itemId}`, { method: "DELETE", credentials: "include" })
    notifyCartChanged()
  }, [])

  return { items, total, loading, count: items.length, refresh, add, updateQty, remove }
}
