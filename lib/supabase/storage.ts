import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createAdminClient } from "./admin"

export const CV_BUCKET = "cvs"

/**
 * Short-lived signed URL for a private CV object. Uses the service-role client
 * so it can sign for an entitled non-owner (poster/admin). The CALLER MUST have
 * already verified authorization (e.g. via an RLS-gated read of the cv row).
 */
export async function createCvSignedUrl(storagePath: string, expiresInSeconds = 300): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(CV_BUCKET).createSignedUrl(storagePath, expiresInSeconds)
  if (error) return null
  return data?.signedUrl ?? null
}

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  })
}

export async function uploadCMSImage(file: File, section: string): Promise<string> {
  const supabase = await getSupabaseServerClient()

  const timestamp = Date.now()
  const filename = `${section}/${timestamp}-${file.name}`

  const { data, error } = await supabase.storage.from("cms-images").upload(filename, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const {
    data: { publicUrl },
  } = supabase.storage.from("cms-images").getPublicUrl(filename)

  return publicUrl
}

export async function getCMSImageUrl(path: string): Promise<string> {
  const supabase = await getSupabaseServerClient()
  const {
    data: { publicUrl },
  } = supabase.storage.from("cms-images").getPublicUrl(path)
  return publicUrl
}

export async function deleteCMSImage(path: string): Promise<void> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.storage.from("cms-images").remove([path])
  if (error) throw new Error(`Delete failed: ${error.message}`)
}
