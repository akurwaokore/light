// M-Pesa Daraja (STK Push) helper. Server-only.
//
// Required env vars (set in your hosting provider — none are committed):
//   MPESA_ENV               "sandbox" | "production"   (default: sandbox)
//   MPESA_CONSUMER_KEY
//   MPESA_CONSUMER_SECRET
//   MPESA_SHORTCODE         Paybill/Till shortcode (e.g. 174379 on sandbox)
//   MPESA_PASSKEY           Lipa Na M-Pesa Online passkey
//   MPESA_CALLBACK_URL      Public https URL to /api/donations/mpesa/callback
//
// Until these are configured, isMpesaConfigured() returns false and callers
// should surface a friendly "payments not configured yet" message.

export function isMpesaConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_CALLBACK_URL,
  )
}

function baseUrl(): string {
  return process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke"
}

// Normalise a Kenyan phone number to the 2547XXXXXXXX / 2541XXXXXXXX format.
export function normalizePhone(input: string): string {
  let p = (input || "").replace(/[^0-9]/g, "")
  if (p.startsWith("0")) p = "254" + p.slice(1)
  else if (p.startsWith("7") || p.startsWith("1")) p = "254" + p
  else if (p.startsWith("254")) p = p
  return p
}

function timestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
}

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!
  const secret = process.env.MPESA_CONSUMER_SECRET!
  const auth = Buffer.from(`${key}:${secret}`).toString("base64")

  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`M-Pesa auth failed (${res.status})`)
  }
  const data = await res.json()
  if (!data.access_token) throw new Error("M-Pesa auth returned no token")
  return data.access_token
}

export interface StkPushResult {
  MerchantRequestID?: string
  CheckoutRequestID?: string
  ResponseCode?: string
  ResponseDescription?: string
  CustomerMessage?: string
  errorMessage?: string
}

export async function stkPush(opts: {
  phone: string
  amount: number
  accountReference: string
  description: string
}): Promise<StkPushResult> {
  const token = await getAccessToken()
  const shortcode = process.env.MPESA_SHORTCODE!
  const passkey = process.env.MPESA_PASSKEY!
  const ts = timestamp()
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64")

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.max(1, Math.round(opts.amount)),
    PartyA: normalizePhone(opts.phone),
    PartyB: shortcode,
    PhoneNumber: normalizePhone(opts.phone),
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: opts.accountReference.slice(0, 12) || "Donation",
    TransactionDesc: opts.description.slice(0, 13) || "Donation",
  }

  const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  return res.json()
}
