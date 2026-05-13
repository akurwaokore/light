"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react"

interface PayPalCheckoutProps {
  amount: number
  currency?: string
  description: string
  onSuccess?: (transactionId: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export function PayPalCheckout({
  amount,
  currency = "USD",
  description,
  onSuccess,
  onError,
  onCancel,
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Load PayPal SDK
    const script = document.createElement("script")
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sandbox"}&currency=${currency}`
    script.addEventListener("load", () => setLoading(false))
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [currency])

  const handlePayPalPayment = async () => {
    setProcessing(true)
    setStatus("processing")
    setMessage("Redirecting to PayPal...")

    try {
      // Create PayPal order
      const response = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create PayPal order")
      }

      // Redirect to PayPal for payment
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      } else {
        throw new Error("No PayPal approval URL received")
      }
    } catch (err: any) {
      setStatus("error")
      setMessage(err.message || "PayPal payment failed. Please try again.")
      setProcessing(false)
      onError?.(err.message)
    }
  }

  // Convert amount to USD for display (approximate)
  const convertedAmount = currency === "KES" ? (amount / 130).toFixed(2) : amount.toFixed(2)

  return (
    <Card className="glass-card border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="font-[Belleza]">PayPal Payment</CardTitle>
            <CardDescription className="font-[Alegreya]">Pay securely with PayPal or credit card</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Display */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-muted-foreground font-[Alegreya]">Total Amount</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-[Belleza]">
            {currency === "KES" ? `$${convertedAmount} USD` : `${currency} ${amount.toLocaleString()}`}
          </p>
          {currency === "KES" && (
            <p className="text-xs text-muted-foreground font-[Alegreya] mt-1">
              Approximately KES {amount.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground font-[Alegreya] mt-1">{description}</p>
        </div>

        {/* Status Messages */}
        {status === "success" && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-400">Success!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "processing" && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-400">Processing...</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">{message}</AlertDescription>
          </Alert>
        )}

        {/* PayPal Button */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              onClick={handlePayPalPayment}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with PayPal
                </>
              )}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={processing}>
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Info */}
        {status === "idle" && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="font-semibold text-sm font-[Belleza]">Secure payment with PayPal:</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-[Alegreya]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Pay with your PayPal account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Use credit/debit card without PayPal account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Buyer protection included</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>Secure encryption for all transactions</span>
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
