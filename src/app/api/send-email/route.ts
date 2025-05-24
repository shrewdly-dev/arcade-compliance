import { NextRequest, NextResponse } from "next/server";
import { sendEmail, emailTemplates } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    // Verify user is authenticated using NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let emailContent;
    let recipients: string[] = [];

    switch (type) {
      case "welcome":
        emailContent = emailTemplates.welcomeEmail(
          data.name,
          data.organizationName
        );
        recipients = [data.email];
        break;

      case "training-reminder":
        emailContent = emailTemplates.trainingReminder(
          data.name,
          data.trainingTitle,
          data.dueDate
        );
        recipients = [data.email];
        break;

      case "incident-alert":
        emailContent = emailTemplates.incidentAlert(
          data.reporterName,
          data.incidentTitle,
          data.severity
        );
        recipients = data.recipients || [];
        break;

      case "document-expiry":
        emailContent = emailTemplates.documentExpiry(
          data.name,
          data.documentTitle,
          data.expiryDate
        );
        recipients = [data.email];
        break;

      case "assessment-results":
        emailContent = emailTemplates.assessmentResults(
          data.name,
          data.assessmentTitle,
          data.score,
          data.passed
        );
        recipients = [data.email];
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients specified" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to: recipients,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
