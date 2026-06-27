export type MembershipLike = {
  membership_tier?: string | null
  membership_type?: "annual" | "lifetime" | null
  membership_expiry?: string | null
  membership_start_date?: string | null
  created_at?: string | null
}

export function getNormalizedMembership(member?: MembershipLike | null) {
  if (!member) {
    return {
      hasMembership: false,
      isLifetime: false,
      isActive: false,
      type: null,
      tier: null,
      expiryDate: null as Date | null,
      startDate: null as Date | null,
    }
  }

  const tier = member.membership_tier || null
  const paidTier = !!tier && tier !== "free" && tier !== "guest"
  const inferredType =
    member.membership_type ||
    (tier === "platinum" ? "lifetime" : paidTier ? "annual" : null)

  const isLifetime = inferredType === "lifetime"
  const expiryDate = member.membership_expiry ? new Date(member.membership_expiry) : null
  const startDate = member.membership_start_date
    ? new Date(member.membership_start_date)
    : member.created_at && paidTier
      ? new Date(member.created_at)
      : null

  const hasMembership = !!inferredType || paidTier
  const isActive = hasMembership
    ? isLifetime
      ? true
      : expiryDate
        ? expiryDate >= new Date()
        : paidTier
    : false

  return {
    hasMembership,
    isLifetime,
    isActive,
    type: inferredType,
    tier,
    expiryDate,
    startDate,
  }
}
