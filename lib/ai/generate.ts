// Provider-routed text generation. Reads admin-configured AI settings and
// dispatches to OpenAI, Gemini, or a custom VPS/self-hosted LLM.
// Server-only: reads creds via the service-role client so keys never reach the
// browser and RLS can't block the lookup.
import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"

export interface AISettings {
  provider: "openai" | "gemini" | "custom"
  enabled: boolean
  openai_api_key?: string | null
  openai_model?: string | null
  gemini_api_key?: string | null
  gemini_model?: string | null
  custom_url?: string | null
  custom_api_key?: string | null
  custom_model?: string | null
  custom_auth_header?: string | null
  custom_auth_scheme?: string | null
  custom_format?: string | null
}

export async function getAISettings(): Promise<AISettings | null> {
  let db: any
  try {
    db = createAdminClient()
  } catch {
    db = await createServerClient()
  }
  const { data } = await db.from("ai_settings").select("*").eq("id", 1).maybeSingle()
  return data || null
}

export class AINotConfiguredError extends Error {}

export async function generateAIText(opts: {
  prompt: string
  system?: string
  maxTokens?: number
  temperature?: number
}): Promise<{ text: string; provider: string }> {
  const s = await getAISettings()
  if (!s || !s.enabled) {
    throw new AINotConfiguredError("The AI assistant is not configured. An admin can set it up in Settings.")
  }

  const system = opts.system || "You are a helpful assistant."
  const maxTokens = opts.maxTokens ?? 500
  const temperature = opts.temperature ?? 0.7

  if (s.provider === "openai") {
    if (!s.openai_api_key) throw new AINotConfiguredError("OpenAI API key is not set.")
    const text = await callOpenAICompatible({
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: s.openai_api_key,
      authHeader: "Authorization",
      authScheme: "Bearer",
      model: s.openai_model || "gpt-4o-mini",
      system,
      prompt: opts.prompt,
      maxTokens,
      temperature,
    })
    return { text, provider: "openai" }
  }

  if (s.provider === "gemini") {
    if (!s.gemini_api_key) throw new AINotConfiguredError("Gemini API key is not set.")
    const text = await callGemini({
      apiKey: s.gemini_api_key,
      model: s.gemini_model || "gemini-1.5-flash",
      system,
      prompt: opts.prompt,
      maxTokens,
      temperature,
    })
    return { text, provider: "gemini" }
  }

  if (s.provider === "custom") {
    if (!s.custom_url) throw new AINotConfiguredError("Custom LLM endpoint URL is not set.")
    if ((s.custom_format || "openai") === "simple") {
      const text = await callCustomSimple(s, opts.prompt, system)
      return { text, provider: "custom" }
    }
    const text = await callOpenAICompatible({
      url: s.custom_url,
      apiKey: s.custom_api_key || "",
      authHeader: s.custom_auth_header || "Authorization",
      authScheme: s.custom_auth_scheme ?? "Bearer",
      model: s.custom_model || "default",
      system,
      prompt: opts.prompt,
      maxTokens,
      temperature,
    })
    return { text, provider: "custom" }
  }

  throw new AINotConfiguredError("Unknown AI provider configured.")
}

async function callOpenAICompatible(o: {
  url: string
  apiKey: string
  authHeader: string
  authScheme: string
  model: string
  system: string
  prompt: string
  maxTokens: number
  temperature: number
}): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (o.apiKey) {
    headers[o.authHeader || "Authorization"] = o.authScheme ? `${o.authScheme} ${o.apiKey}` : o.apiKey
  }
  const res = await fetch(o.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: o.model,
      messages: [
        { role: "system", content: o.system },
        { role: "user", content: o.prompt },
      ],
      max_tokens: o.maxTokens,
      temperature: o.temperature,
    }),
    cache: "no-store",
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`AI provider error (${res.status}): ${detail.slice(0, 300)}`)
  }
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? ""
  if (!text) throw new Error("AI provider returned an empty response.")
  return String(text).trim()
}

async function callGemini(o: {
  apiKey: string
  model: string
  system: string
  prompt: string
  maxTokens: number
  temperature: number
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    o.model,
  )}:generateContent?key=${encodeURIComponent(o.apiKey)}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: o.system }] },
      contents: [{ role: "user", parts: [{ text: o.prompt }] }],
      generationConfig: { maxOutputTokens: o.maxTokens, temperature: o.temperature },
    }),
    cache: "no-store",
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Gemini error (${res.status}): ${detail.slice(0, 300)}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? ""
  if (!text) throw new Error("Gemini returned an empty response.")
  return String(text).trim()
}

// Simple custom endpoint: POST { prompt, system, model } and read a text-ish field.
async function callCustomSimple(s: AISettings, prompt: string, system: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (s.custom_api_key) {
    const scheme = s.custom_auth_scheme ?? "Bearer"
    headers[s.custom_auth_header || "Authorization"] = scheme ? `${scheme} ${s.custom_api_key}` : s.custom_api_key
  }
  const res = await fetch(s.custom_url!, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt, system, model: s.custom_model || undefined }),
    cache: "no-store",
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Custom LLM error (${res.status}): ${detail.slice(0, 300)}`)
  }
  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("application/json")) {
    return (await res.text()).trim()
  }
  const data = await res.json()
  const text =
    data?.text ??
    data?.response ??
    data?.output ??
    data?.content ??
    data?.message ??
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    ""
  if (!text) throw new Error("Custom LLM returned an unrecognised response shape.")
  return String(text).trim()
}
