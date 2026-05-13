import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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
