"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Smartphone, CreditCard } from "lucide-react"
import { MpesaCheckout } from "./mpesa-checkout"
import { PayPalCheckout } from "./paypal-checkout"

interface PaymentMethodSelectorProps {
  amount: number
  currency?: string
  description: string
  onSuccess?: (transactionId: string, method: string) => void
  onError?: (error: string) => void
  defaultMethod?: "mpesa" | "paypal"
}

export function PaymentMethodSelector({
  amount,
  currency = "KES",
  description,
  onSuccess,
  onError,
  defaultMethod = "mpesa",
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState(defaultMethod)

  return (
    <div className="space-y-4">
      <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as "mpesa" | "paypal")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
          <TabsTrigger
            value="mpesa"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
          >
            <Smartphone className="h-4 w-4" />
            <span>M-Pesa</span>
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800 text-xs">
              Recommended
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="paypal"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
          >
            <CreditCard className="h-4 w-4" />
            <span>PayPal</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mpesa" className="mt-4">
          <MpesaCheckout
            amount={amount}
            currency={currency}
            description={description}
            onSuccess={(txId) => onSuccess?.(txId, "mpesa")}
            onError={onError}
          />
        </TabsContent>

        <TabsContent value="paypal" className="mt-4">
          <PayPalCheckout
            amount={amount}
            currency={currency === "KES" ? "USD" : currency}
            description={description}
            onSuccess={(txId) => onSuccess?.(txId, "paypal")}
            onError={onError}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
