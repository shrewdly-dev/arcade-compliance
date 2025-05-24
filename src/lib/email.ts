import { Resend } from "resend";

// Initialize Resend only when needed and with proper error handling
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY not found. Email functionality will be disabled."
    );
    return null;
  }
  return new Resend(apiKey);
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn("Email service not available - RESEND_API_KEY missing");
      return { success: false, error: "Email service not configured" };
    }

    const result = await resend.emails.send({
      from: from || process.env.FROM_EMAIL || "noreply@yourdomain.com",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
}

// Email templates for compliance notifications
export const emailTemplates = {
  welcomeEmail: (name: string, organizationName: string) => ({
    subject: "Welcome to Arcade Compliance Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Arcade Compliance Portal</h1>
        <p>Dear ${name},</p>
        <p>Welcome to the Arcade Compliance Portal for ${organizationName}. Your account has been successfully created.</p>
        <p>You can now access:</p>
        <ul>
          <li>Compliance documentation and guidelines</li>
          <li>Training programs and assessments</li>
          <li>Incident reporting system</li>
          <li>Audit logs and compliance tracking</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>Arcade Compliance Team</p>
      </div>
    `,
  }),

  trainingReminder: (name: string, trainingTitle: string, dueDate: string) => ({
    subject: `Training Reminder: ${trainingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Training Reminder</h1>
        <p>Dear ${name},</p>
        <p>This is a reminder that you have a pending training requirement:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0; color: #dc2626;">${trainingTitle}</h3>
          <p style="margin: 8px 0 0 0;">Due Date: ${dueDate}</p>
        </div>
        <p>Please complete this training as soon as possible to maintain compliance.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Access Training</a></p>
        <p>Best regards,<br>Arcade Compliance Team</p>
      </div>
    `,
  }),

  incidentAlert: (
    reporterName: string,
    incidentTitle: string,
    severity: string
  ) => ({
    subject: `Incident Alert: ${incidentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Incident Alert</h1>
        <p>A new incident has been reported:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0; color: #dc2626;">${incidentTitle}</h3>
          <p style="margin: 8px 0 0 0;">Severity: ${severity}</p>
          <p style="margin: 8px 0 0 0;">Reported by: ${reporterName}</p>
        </div>
        <p>Please review this incident and take appropriate action.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Incident</a></p>
        <p>Best regards,<br>Arcade Compliance Team</p>
      </div>
    `,
  }),

  documentExpiry: (
    name: string,
    documentTitle: string,
    expiryDate: string
  ) => ({
    subject: `Document Expiry Notice: ${documentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #d97706;">Document Expiry Notice</h1>
        <p>Dear ${name},</p>
        <p>The following document is approaching its expiry date:</p>
        <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0; color: #d97706;">${documentTitle}</h3>
          <p style="margin: 8px 0 0 0;">Expires: ${expiryDate}</p>
        </div>
        <p>Please review and update this document to maintain compliance.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Update Document</a></p>
        <p>Best regards,<br>Arcade Compliance Team</p>
      </div>
    `,
  }),

  assessmentResults: (
    name: string,
    assessmentTitle: string,
    score: number,
    passed: boolean
  ) => ({
    subject: `Assessment Results: ${assessmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${passed ? "#059669" : "#dc2626"};">Assessment Results</h1>
        <p>Dear ${name},</p>
        <p>Your assessment results are now available:</p>
        <div style="background-color: ${passed ? "#ecfdf5" : "#fef2f2"}; border-left: 4px solid ${passed ? "#059669" : "#dc2626"}; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0; color: ${passed ? "#059669" : "#dc2626"};">${assessmentTitle}</h3>
          <p style="margin: 8px 0 0 0;">Score: ${score}%</p>
          <p style="margin: 8px 0 0 0;">Status: ${passed ? "PASSED" : "FAILED"}</p>
        </div>
        ${
          passed
            ? "<p>Congratulations! You have successfully completed this assessment.</p>"
            : "<p>Unfortunately, you did not pass this assessment. Please review the material and retake the assessment.</p>"
        }
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Results</a></p>
        <p>Best regards,<br>Arcade Compliance Team</p>
      </div>
    `,
  }),
};
