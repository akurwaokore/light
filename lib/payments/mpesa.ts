// M-Pesa Daraja STK Push helper (sandbox endpoints; swap host for production).
const BASE = process.env.MPESA_ENV === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke"

function ts() {
  return new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)
}

async function getToken() {
  const key = process.env.MPESA_CONSUMER_KEY
  const secret = process.env.MPESA_CONSUMER_SECRET
  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` },
  })
  if (!res.ok) throw new Error("M-Pesa auth failed")
  const json = await res.json()
  return json.access_token as string
}

export async function initiateStkPush(opts: {
  phone: string
  amount: number
  accountRef: string
  description: string
  callbackUrl: string
}): Promise<{ checkoutRequestId: string; merchantRequestId: string }> {
  const shortcode = process.env.MPESA_SHORTCODE!
  const passkey = process.env.MPESA_PASSKEY!
  const timestamp = ts()
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64")
  const token = await getToken()

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.floor(opts.amount)),
      PartyA: opts.phone,
      PartyB: shortcode,
      PhoneNumber: opts.phone,
      CallBackURL: opts.callbackUrl,
      AccountReference: opts.accountRef.slice(0, 12),
      TransactionDesc: opts.description.slice(0, 13),
    }),
  })
  const data = await res.json()
  if (data.ResponseCode !== "0") {
    throw new Error(data.ResponseDescription || data.errorMessage || "STK push failed")
  }
  return { checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID }
}
