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
    const { expiryDate, isActive, hasMembership } = membership

    // Generate PDF using a simple HTML to PDF approach
    // For production, you would use a proper PDF library like @react-pdf/renderer or puppeteer
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .card { 
              width: 400px; 
              height: 250px; 
              background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #0a1929 100%);
              border-radius: 16px; 
              padding: 24px;
              color: white;
              position: relative;
              box-sizing: border-box;
            }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .logo { font-weight: bold; font-size: 14px; }
            .status { 
              padding: 4px 12px; 
              border-radius: 20px; 
              font-size: 12px;
              background: ${isActive ? "rgba(16, 185, 129, 0.2)" : hasMembership ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)"};
              color: ${isActive ? "#6ee7b7" : hasMembership ? "#fcd34d" : "#fca5a5"};
            }
            .member-info { margin-top: 40px; }
            .name { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            .school { font-size: 14px; opacity: 0.7; }
            .footer { 
              position: absolute; 
              bottom: 24px; 
              left: 24px; 
              right: 24px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              border-top: 1px solid rgba(255,255,255,0.1);
              padding-top: 12px;
            }
            .field-label { opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; }
            .field-value { font-weight: bold; margin-top: 2px; }
            .motto { 
              position: absolute;
              bottom: 8px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 9px;
              opacity: 0.4;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">LIGHT ALUMNI<br><span style="opacity: 0.6; font-size: 12px;">CONNECT</span></div>
              <div class="status">${isActive ? "ACTIVE" : hasMembership ? "EXPIRED" : "UNPAID"}</div>
            </div>
            <div class="member-info">
              <div class="name">${member.display_name}</div>
              <div class="school">${member.campus || "Light Academy"} - Class of ${member.graduation_year || "N/A"}</div>
            </div>
            <div class="footer">
              <div>
                <div class="field-label">Alumni ID</div>
                <div class="field-value">${alumniId}</div>
              </div>
              <div>
                <div class="field-label">Member Since</div>
                <div class="field-value">${new Date(member.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div class="field-label">Valid Until</div>
                <div class="field-value" style="color: ${isActive ? "#6ee7b7" : "#fca5a5"}">
                  ${expiryDate ? expiryDate.toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
            <div class="motto">"Once Students, Always Family"</div>
          </div>
        </body>
      </html>
    `

    // Return HTML as a downloadable file for now
    // In production, convert to PDF using puppeteer or similar
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="light-alumni-card-${alumniId}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
