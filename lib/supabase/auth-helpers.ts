import { createServerClient } from "./server"

export async function getAuthUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error("[akurwas] Error getting auth user:", error)
    return null
  }

  return user
}

export async function getUserRole(userId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from("admins").select("role").eq("user_id", userId).single()

  if (error) {
    console.log("[akurwas] User is not an admin:", error.message)
    return null
  }

  return data?.role || null
}

export async function isUserAdmin() {
  const user = await getAuthUser()
  if (!user) return false

  const role = await getUserRole(user.id)
  return role !== null
}
