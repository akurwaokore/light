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

    // PKPass structure (simplified - in production you'd sign this properly)
    // Apple Wallet requires signing with Apple certificates
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.lightalumni.membership",
      serialNumber: alumniId,
      teamIdentifier: "TEAM_ID",
      organizationName: "Light Alumni Connect",
      description: "Light Alumni Membership Card",
      logoText: "Light Alumni",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(30, 58, 95)",
      generic: {
        primaryFields: [
          {
            key: "member",
            label: "MEMBER",
            value: member.display_name,
          },
        ],
        secondaryFields: [
          {
            key: "school",
            label: "SCHOOL",
            value: member.campus || "Light Academy",
          },
          {
            key: "year",
            label: "CLASS OF",
            value: String(member.graduation_year || "N/A"),
          },
        ],
        auxiliaryFields: [
          {
            key: "alumniId",
            label: "ALUMNI ID",
            value: alumniId,
          },
          {
            key: "tier",
            label: "TIER",
            value: type === "lifetime" ? "Lifetime" : hasMembership ? "Annual" : "No Membership",
          },
        ],
        backFields: [
          {
            key: "expiry",
            label: "Valid Until",
            value: expiryDate ? expiryDate.toLocaleDateString() : "N/A",
          },
          {
            key: "motto",
            label: "Motto",
            value: "Once Students, Always Family",
          },
        ],
      },
      barcode: {
        message: JSON.stringify({
          id: member.id,
          alumniId,
          name: member.display_name,
          school: member.campus,
        }),
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
      },
      expirationDate: expiryDate?.toISOString(),
    }

    // Note: In production, you would:
    // 1. Create a proper .pkpass file (ZIP with pass.json, images, manifest, signature)
    // 2. Sign it with your Apple Developer certificate
    // For demo purposes, we return the pass structure as JSON

    return NextResponse.json({
      message: "Apple Wallet integration requires Apple Developer certificate signing",
      passData: passJson,
      instructions: [
        "1. Register for Apple Developer Program",
        "2. Create a Pass Type ID in your Apple Developer account",
        "3. Generate signing certificates",
        "4. Use a library like passkit-generator to create signed .pkpass files",
      ],
    })
  } catch (error) {
    console.error("Error creating Apple Wallet pass:", error)
    return NextResponse.json({ error: "Failed to create Apple Wallet pass" }, { status: 500 })
  }
}
