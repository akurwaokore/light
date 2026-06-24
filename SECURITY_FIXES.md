# Security Fixes — Phase 1 (Isolation & Data-Leak Hardening)

This phase closes confirmed cross-account data leaks and fixes a build-breaking bug. It is the
foundation pass agreed before the marketplace / jobs-CV / social redos.

## Migrations to run (in this order)

Run these in the Supabase SQL editor / your DB console. All are idempotent (safe to re-run).

1. `scripts/secure-profiles-rls-v1.sql` — locks down the `profiles` table (RLS + column
   privileges), adds the safe `public_profiles` view and the `get_profile_contact(uuid)` RPC.
2. `scripts/create-product-comments-v1.sql` — creates the missing `product_comments` table
   (the marketplace comments endpoint was 500ing) with RLS.

> The existing `friendships` RLS (`scripts/fix-friendships-schema.sql`) already restricts
> delete/update to the two parties — the API IDOR fix below is defense-in-depth on top of it.

## Code fixes

| # | Area | File(s) | What changed |
|---|------|---------|--------------|
| 1 | **Build blocker** | `app/api/marketplace/purchase/route.ts` | Resolved an unresolved git merge conflict; single `award_points` RPC call. |
| 2 | **Friends IDOR** | `app/api/friends/[id]/route.ts` | DELETE now verifies the caller is a party to the friendship before deleting (was deleting by id with no ownership check). |
| 3 | **Points leak** | `app/api/points/current/route.ts` (+ callers in `dashboard/page.tsx`, `components/layout/app-header.tsx`) | Endpoint ignores client `userId` and always scopes to the session; 401 if unauthenticated. |
| 4 | **Friends-only chat** | `app/api/chat/route.ts` | A conversation can only be started between users with an `accepted` friendship; admins may bypass. |
| 5 | **Share visibility** | `app/api/posts/[id]/share/route.ts` | Sharing no longer forces `public`: `private` posts can't be reshared by others; `friends` posts stay `friends`. |
| 6 | **PII in browse surfaces** | `app/api/events/route.ts`, `events/[id]/route.ts`, `events/[id]/approve/route.ts`, `marketplace/products/route.ts`, `marketplace/products/user/route.ts`, `marketplace/products/[id]/route.ts`, `marketplace/purchases/route.ts`, `profile/listings/route.ts` | Removed `email`/`phone` from organizer/seller selects returned to all viewers. |
| 7 | **Unauthed AI spend** | `app/api/marketplace/ai-description/route.ts` | Requires an authenticated session. |
| 8 | **Events delete RBAC** | `app/api/events/[id]/route.ts` | Fixed a check against the non-existent `profiles.role` column; now uses `checkAdminAccess()` and allows the organizer. |
| 9 | **Service-role in proxy** | `proxy.ts` | Uses the anon key for session verification instead of the service-role key (which bypasses RLS). `proxy.ts` is Next.js 16's middleware entrypoint and runs on page routes (its matcher excludes `/api`), so this fix is live. |
| 10 | **Mock auth footgun** | `lib/auth-helpers.ts` (deleted) | Removed unused mock "presentation mode" auth that returned `null`. |

## Verification (two accounts, A and B)

- B cannot delete/decline A's friendship → expect **403**.
- `GET /api/points/current?userId=<A's id>` while logged in as B → returns **B's** points, never A's.
- B starting a chat with a non-friend → **403**; with an accepted friend → succeeds.
- Sharing a `private`/`friends` post does not create a `public` post.
- `POST /api/marketplace/ai-description` unauthenticated → **401**.
- `GET /api/marketplace/products/<id>/comments` → **200** after migration #2.
- Browsing events/marketplace as any user no longer returns organizer/seller email.

## Optional final lockdown (recommended, needs a DB-connected test pass)

`secure-profiles-rls-v1.sql` keeps `email`/`phone` readable to the `authenticated` role so the
remaining entitled routes (admin panels, job-application review, post-purchase seller contact)
keep working unchanged. To fully prevent *any* authenticated user from directly querying others'
PII via PostgREST:

1. `REVOKE SELECT (email, phone) ON public.profiles FROM authenticated;`
2. Migrate the entitled reads to the `get_profile_contact(uuid)` RPC (or, for admin panels, a
   service-role server route). Affected: `app/api/admin/*`, `app/api/jobs/[id]/applications`,
   `app/api/profile/jobs/[id]/applications`, `app/api/marketplace/purchase` (seller contact).

This step is deferred because it must be validated against a live database (PostgREST returns a
hard 403 for a privilege-less column, so every remaining selector must be migrated first).
