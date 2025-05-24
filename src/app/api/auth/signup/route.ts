import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      name,
      organizationName,
      organizationType,
      licenseNumber,
      address,
      phone,
    } = await request.json();

    if (!email || !password || !name || !organizationName) {
      return NextResponse.json(
        { error: "Email, password, name, and organization name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Check if organization name already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { name: organizationName },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "An organization with this name already exists" },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          type: organizationType as any,
          licenseNo: licenseNumber || null,
          address: address || null,
          phone: phone || null,
          email: email,
        },
      });

      // Create admin user (unverified)
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "ADMIN", // First user is admin
          emailVerified: false,
          verificationToken,
        },
      });

      // Create organization membership
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      return { user, organization };
    });

    // Send verification email using the dedicated email API
    let emailSent = false;
    let emailError = null;

    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;

      // Send to the actual email address from the signup form
      const emailTo = email;

      console.log("Attempting to send verification email to:", emailTo);
      console.log("Verification URL:", verificationUrl);

      const emailResponse = await fetch(
        `${process.env.NEXTAUTH_URL}/api/send-verification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: emailTo,
            name,
            organizationName,
            verificationUrl,
          }),
        }
      );

      const emailResult = await emailResponse.json();
      console.log("Email API response:", emailResult);

      if (emailResponse.ok && emailResult.success) {
        emailSent = true;
        console.log("Verification email sent successfully:", emailResult.data);
      } else {
        emailError = emailResult.error || "Unknown email error";
        console.error("Failed to send verification email:", emailResult.error);
      }
    } catch (error) {
      emailError = error instanceof Error ? error.message : String(error);
      console.error("Failed to send verification email:", error);
    }

    // Remove sensitive data from response
    const {
      password: _,
      verificationToken: __,
      ...userWithoutSensitiveData
    } = result.user;

    // Prepare response based on email sending result
    let responseMessage =
      "Organization and admin account created successfully.";
    let responseData: any = {
      user: userWithoutSensitiveData,
      organization: result.organization,
      emailSent,
    };

    if (emailSent) {
      responseMessage += " Please check your email to verify your account.";
    } else {
      responseMessage +=
        " However, there was an issue sending the verification email.";
      responseData.emailError = emailError;
      responseData.verificationToken = verificationToken; // Include token for manual verification
    }

    return NextResponse.json(
      {
        message: responseMessage,
        ...responseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
