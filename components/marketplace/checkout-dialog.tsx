"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, ShoppingCart, Award, ShieldCheck, CheckCircle2, Phone, MessageSquare, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CheckoutDialogProps {
  product: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  formatPrice: (price: number, currency?: string) => string
}

export function CheckoutDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
  formatPrice,
}: CheckoutDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [seller, setSeller] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleConfirmPurchase = async () => {
    console.log("[Checkout] Starting purchase for product:", product.id)
    setIsProcessing(true)
    try {
      console.log("[Checkout] Body payload:", {
        productId: product.id,
        amount: product.price,
        sellerId: product.seller_id || product.seller?.id,
      })

      const response = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          amount: product.price,
          sellerId: product.seller_id || product.seller?.id,
        }),
      })

      const data = await response.json()
      console.log("[Checkout] Purchase response:", data)

      if (response.ok && data.success) {
        console.log("[Checkout] Success! Setting seller and state.", data.seller)
        setSeller(data.seller)
        setIsSuccess(true)
        // Ensure parent state is updated about the successful transaction
        onSuccess()
      } else {
        toast({
          title: "Purchase Failed",
          description: data.error || "Something went wrong during checkout.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!product) return null

  const estimatedPoints = Math.floor(product.price * 0.0001 * 100) / 100

  const handleMessageSeller = async () => {
    if (!seller?.id) return

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: seller.id }),
      })

      const data = await response.json()

      if (!response.ok || !data.conversationId) {
        toast({
          title: "Unable to start chat",
          description: data.error || "Please try again in a moment.",
          variant: "destructive",
        })
        return
      }

      window.dispatchEvent(
        new CustomEvent("open-chat", {
          detail: {
            id: data.conversationId,
            name: seller.full_name || "Seller",
          },
        }),
      )
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Unable to start chat",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setIsSuccess(false)
        setSeller(null)
      }
      onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" aria-describedby={undefined}>
        {isSuccess ? (
          <div className="p-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-green-100 p-3 text-green-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <DialogTitle className="text-2xl font-bold">Purchase Confirmed!</DialogTitle>
              <DialogDescription className="mt-2 text-balance">
                Notification sent to the seller! They have been notified of your interest in <span className="font-semibold">{product.title}</span>.
              </DialogDescription>
            </div>

            <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={seller?.avatar_url} />
                  <AvatarFallback>{seller?.full_name?.charAt(0) || "S"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{seller?.full_name || "Seller"}</p>
                  <p className="text-xs text-muted-foreground truncate">Verified Alumni Seller</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  asChild
                  variant="outline" 
                  className="w-full gap-2 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <a href={`tel:${seller?.phone_number || ""}`}>
                    <Phone className="h-4 w-4" />
                    Call Seller
                  </a>
                </Button>
                <Button 
                  variant="default" 
                  className="w-full gap-2 rounded-xl shadow-md shadow-primary/10"
                  onClick={handleMessageSeller}
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
              </div>

              <div className="pt-2">
                <Button 
                  variant="link" 
                  className="w-full text-xs text-primary font-bold h-auto p-0"
                  onClick={() => {
                    router.push('/profile/listings')
                    onOpenChange(false)
                  }}
                >
                  View My Purchases <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              
              {seller?.phone_number && (
                <div className="pt-2 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Phone Number</p>
                  <p className="text-sm font-mono font-semibold">{seller.phone_number}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                Close Dialog
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative h-40 w-full bg-muted">
               <div className="flex h-full w-full items-center justify-center bg-primary/5">
                  <ShoppingCart className="h-12 w-12 text-primary/20" />
               </div>
            </div>
            
            <div className="p-6">
              <DialogHeader className="mb-4 text-left">
                <DialogTitle className="text-xl font-bold">{product.title}</DialogTitle>
                <DialogDescription>
                  <Badge variant="outline" className="mt-2 uppercase tracking-wider text-[10px]">
                    {product.category}
                  </Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="text-right absolute top-44 right-6">
                <p className="text-2xl font-black text-primary">
                  {formatPrice(product.price, product.currency)}
                </p>
              </div>

              <div className="space-y-4 rounded-lg bg-muted/30 p-4 text-sm mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Item Price</span>
                  <span className="font-medium">{formatPrice(product.price, product.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-green-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Award className="h-4 w-4" />
                    Estimated Points
                  </span>
                  <span className="font-bold">+{estimatedPoints} pts</span>
                </div>
                <div className="border-t border-border pt-3 flex items-center justify-between font-bold text-base">
                  <span>Total Amount</span>
                  <span>{formatPrice(product.price, product.currency)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-md bg-blue-500/5 p-3 text-[11px] text-blue-600/80">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Secure transaction handled via the Light Alumni network. By confirming, you agree to the marketplace terms.
              </div>

              <DialogFooter className="mt-8 flex flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-full" 
                  onClick={() => onOpenChange(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-[2] rounded-full shadow-lg shadow-primary/20" 
                  onClick={handleConfirmPurchase}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Purchase"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
