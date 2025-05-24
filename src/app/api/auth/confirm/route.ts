import { NextRequest, NextResponse } from "next/server";
import { emailNotifications } from "@/lib/email-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, user_metadata } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Send welcome email when user confirms their account
    try {
      const fullName = user_metadata?.full_name || "User";
      const companyName = user_metadata?.company_name || "Your Organization";

      await emailNotifications.onUserSignup(email, fullName, companyName);

      return NextResponse.json({
        success: true,
        message: "Welcome email sent successfully",
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the request if email fails
      return NextResponse.json({
        success: true,
        message: "Account confirmed but welcome email failed to send",
        emailError:
          emailError instanceof Error ? emailError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Auth confirm API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
