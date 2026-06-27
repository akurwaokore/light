import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { getNormalizedMembership } from "@/lib/membership"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { memberId } = await request.json()

    // Get member data
    const { data: member, error } = await supabase.from("profiles").select("*").eq("id", memberId).maybeSingle()

    if (error || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const alumniId = `LA-${member.id.substring(0, 8).toUpperCase()}`
    const membership = getNormalizedMembership(member)
    const { expiryDate, type, hasMembership } = membership
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lightalumni.com"

    // Google Wallet Generic Pass object
    // In production, you'd sign this with a service account and create a JWT
    const genericObject = {
      id: `ISSUER_ID.${alumniId}`,
      classId: "ISSUER_ID.light_alumni_membership",
      logo: {
        sourceUri: {
          uri: `${baseUrl}/light-alumni-logo.png`,
        },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: "Light Alumni Logo",
          },
        },
      },
      cardTitle: {
        defaultValue: {
          language: "en-US",
          value: "Light Alumni Connect",
        },
      },
      subheader: {
        defaultValue: {
          language: "en-US",
          value: "Membership Card",
        },
      },
      header: {
        defaultValue: {
          language: "en-US",
          value: member.display_name,
        },
      },
      textModulesData: [
        {
          id: "alumni_id",
          header: "ALUMNI ID",
          body: alumniId,
        },
        {
          id: "school",
          header: "SCHOOL",
          body: member.campus || "Light Academy",
        },
        {
          id: "class",
          header: "CLASS OF",
          body: String(member.graduation_year || "N/A"),
        },
        {
          id: "tier",
          header: "MEMBERSHIP TIER",
          body: type === "lifetime" ? "Lifetime" : hasMembership ? "Annual" : "No Membership",
        },
        {
          id: "expiry",
          header: "VALID UNTIL",
          body: expiryDate ? expiryDate.toLocaleDateString() : "N/A",
        },
      ],
      barcode: {
        type: "QR_CODE",
        value: JSON.stringify({
          id: member.id,
          alumniId,
          verifyUrl: `${baseUrl}/verify/${member.id}`,
        }),
        alternateText: alumniId,
      },
      hexBackgroundColor: "#1e3a5f",
      validTimeInterval: expiryDate
        ? {
            end: {
              date: expiryDate.toISOString(),
            },
          }
        : undefined,
    }

    // Note: In production, you would:
    // 1. Set up Google Wallet API in Google Cloud Console
    // 2. Create a service account with proper permissions
    // 3. Sign a JWT with the pass object
    // 4. Return a "Add to Google Wallet" URL

    return NextResponse.json({
      message: "Google Wallet integration requires Google Cloud setup",
      passData: genericObject,
      instructions: [
        "1. Enable Google Wallet API in Google Cloud Console",
        "2. Create a service account with wallet permissions",
        "3. Create an Issuer account at pay.google.com/business/console",
        "4. Use google-auth-library to sign JWTs",
        "5. Generate save URLs: https://pay.google.com/gp/v/save/{JWT}",
      ],
      // Demo URL - would be a signed JWT URL in production
      saveUrl: null,
    })
  } catch (error) {
    console.error("Error creating Google Wallet pass:", error)
    return NextResponse.json({ error: "Failed to create Google Wallet pass" }, { status: 500 })
  }
}
