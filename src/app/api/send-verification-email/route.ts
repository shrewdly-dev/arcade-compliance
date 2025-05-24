import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { VerificationEmail } from "@/components/emails/verification-email";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, name, organizationName, verificationUrl } =
      await request.json();

    if (!to || !name || !organizationName || !verificationUrl) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: to, name, organizationName, verificationUrl",
        },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Arcade Compliance <onboarding@resend.dev>",
      to: [to],
      subject: "Verify Your Account - Arcade Compliance",
      react: React.createElement(VerificationEmail, {
        name,
        organizationName,
        verificationUrl,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Email sent successfully:", data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
