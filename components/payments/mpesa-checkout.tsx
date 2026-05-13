"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Smartphone, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react"

interface MpesaCheckoutProps {
  amount: number
  currency?: string
  description: string
  onSuccess?: (transactionId: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export function MpesaCheckout({
  amount,
  currency = "KES",
  description,
  onSuccess,
  onError,
  onCancel,
}: MpesaCheckoutProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-numeric characters
    const cleaned = phone.replace(/\D/g, "")

    // Convert to Kenya format (254...)
    if (cleaned.startsWith("0")) {
      return "254" + cleaned.substring(1)
    }
    if (cleaned.startsWith("254")) {
      return cleaned
    }
    if (cleaned.startsWith("+254")) {
      return cleaned.substring(1)
    }
    return cleaned
  }

  const validatePhoneNumber = (phone: string) => {
    const cleaned = formatPhoneNumber(phone)
    // Kenya phone numbers should be 12 digits (254 + 9 digits)
    return cleaned.length === 12 && cleaned.startsWith("254")
  }

  const handlePayment = async () => {
    if (!phoneNumber) {
      setStatus("error")
      setMessage("Please enter your M-Pesa phone number")
      return
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setStatus("error")
      setMessage("Please enter a valid Kenyan phone number (e.g., 0712345678)")
      return
    }

    setProcessing(true)
    setStatus("processing")
    setMessage("Initiating M-Pesa payment...")

    try {
      // Call M-Pesa STK Push API
      const response = await fetch("/api/payments/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formatPhoneNumber(phoneNumber),
          amount,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }

      setMessage("Please check your phone and enter your M-Pesa PIN...")

      // Poll for payment status
      const checkoutRequestId = data.checkoutRequestId
      let attempts = 0
      const maxAttempts = 30 // 30 seconds timeout

      const pollStatus = setInterval(async () => {
        attempts++

        if (attempts > maxAttempts) {
          clearInterval(pollStatus)
          setStatus("error")
          setMessage("Payment timeout. Please try again.")
          setProcessing(false)
          onError?.("Payment timeout")
          return
        }

        try {
          const statusResponse = await fetch(`/api/payments/mpesa/status?checkoutRequestId=${checkoutRequestId}`)
          const statusData = await statusResponse.json()

          if (statusData.status === "completed") {
            clearInterval(pollStatus)
            setStatus("success")
            setMessage("Payment successful! Your membership has been activated.")
            setProcessing(false)
            onSuccess?.(statusData.transactionId)
          } else if (statusData.status === "failed" || statusData.status === "cancelled") {
            clearInterval(pollStatus)
            setStatus("error")
            setMessage(statusData.message || "Payment failed. Please try again.")
            setProcessing(false)
            onError?.(statusData.message)
          }
        } catch (err) {
          // Continue polling
        }
      }, 1000)
    } catch (err: any) {
      setStatus("error")
      setMessage(err.message || "Payment failed. Please try again.")
      setProcessing(false)
      onError?.(err.message)
    }
  }

  return (
    <Card className="glass-card border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="font-[Belleza]">M-Pesa Payment</CardTitle>
            <CardDescription className="font-[Alegreya]">Pay securely with M-Pesa mobile money</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Display */}
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-muted-foreground font-[Alegreya]">Total Amount</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 font-[Belleza]">
            {currency} {amount.toLocaleString()}
          </p>
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

        {/* Phone Number Input */}
        {status !== "success" && (
          <div className="space-y-2">
            <Label htmlFor="mpesa-phone" className="font-[Alegreya]">
              M-Pesa Phone Number
            </Label>
            <Input
              id="mpesa-phone"
              type="tel"
              placeholder="0712 345 678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={processing}
              className="font-[Alegreya] text-lg"
            />
            <p className="text-xs text-muted-foreground font-[Alegreya] flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              Enter the phone number registered with M-Pesa
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {status !== "success" ? (
            <>
              <Button
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Pay {currency} {amount.toLocaleString()}
                  </>
                )}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={processing}>
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <Button className="w-full" onClick={() => onSuccess?.(message)}>
              Continue
            </Button>
          )}
        </div>

        {/* Instructions */}
        {status === "idle" && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="font-semibold text-sm font-[Belleza]">How it works:</h4>
            <ol className="space-y-1.5 text-xs text-muted-foreground font-[Alegreya]">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
                <span>Enter your M-Pesa registered phone number</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  2
                </span>
                <span>Click the &quot;Pay&quot; button to initiate payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  3
                </span>
                <span>You&apos;ll receive an STK push on your phone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  4
                </span>
                <span>Enter your M-Pesa PIN to complete</span>
              </li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
