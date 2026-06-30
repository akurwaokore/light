import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { jwtVerify } from "jose"

// Routes that require authentication
const protectedRoutes = ["/admin", "/dashboard", "/profile", "/settings"]

// Routes that require admin privileges
const adminRoutes = ["/admin"]

// Public routes that don't require authentication
const publicRoutes = ["/", "/clubs", "/jobs", "/events", "/marketplace", "/giving", "/perks", "/careers", "/newsletter"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
 
  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const cookieStore = request.cookies
 
    try {
      // Supabase auth token is usually 'sb-xxx-auth-token' or similar depending on setup
      // For now we assume 'sb-auth-token' as per current implementation
      // Better way is to use Supabase SSR's getUser()
      
      // Use the anon key for session verification. getUser() validates the JWT
      // from cookies; the service-role key must never be used for request-scoped
      // auth because it bypasses RLS.
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        {
          cookies: {
            getAll: () =>
              request.cookies.getAll().map((cookie) => ({
                name: cookie.name,
                value: cookie.value,
              })),
          },
        },
      )

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.redirect(new URL("/auth/signin", request.url))
      }

      // For admin routes, verify admin role
      if (adminRoutes.some((route) => pathname.startsWith(route))) {
        // user is already available from the outer scope if getUser() succeeded
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle()

        if (!profile?.is_admin) {
          return NextResponse.redirect(new URL("/", request.url))
        }
      }

      return NextResponse.next()
    } catch (error) {
      console.error("[akurwas] Auth verification failed:", error)
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }
  }
 
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
