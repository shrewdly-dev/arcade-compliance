import * as React from "react";

interface VerificationEmailProps {
  name: string;
  organizationName: string;
  verificationUrl: string;
}

export const VerificationEmail: React.FC<Readonly<VerificationEmailProps>> = ({
  name,
  organizationName,
  verificationUrl,
}) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      maxWidth: "600px",
      margin: "0 auto",
    }}
  >
    <h2 style={{ color: "#4F46E5" }}>Welcome to Arcade Compliance!</h2>

    <p>Hello {name},</p>

    <p>
      Thank you for registering your organization "
      <strong>{organizationName}</strong>" with Arcade Compliance.
    </p>

    <p>
      To complete your registration and activate your account, please click the
      button below to verify your email address:
    </p>

    <div style={{ textAlign: "center", margin: "30px 0" }}>
      <a
        href={verificationUrl}
        style={{
          backgroundColor: "#4F46E5",
          color: "white",
          padding: "12px 24px",
          textDecoration: "none",
          borderRadius: "6px",
          display: "inline-block",
        }}
      >
        Verify Email Address
      </a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p style={{ wordBreak: "break-all", color: "#6B7280" }}>
      {verificationUrl}
    </p>

    <div
      style={{
        backgroundColor: "#F3F4F6",
        padding: "15px",
        borderRadius: "6px",
        margin: "20px 0",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#374151" }}>What's Next?</h3>
      <ul style={{ color: "#6B7280" }}>
        <li>Verify your email address using the link above</li>
        <li>Sign in to your account</li>
        <li>Complete your organization profile</li>
        <li>Add team members to your organization</li>
        <li>Start managing your compliance requirements</li>
      </ul>
    </div>

    <p style={{ color: "#6B7280", fontSize: "14px" }}>
      This verification link will expire in 24 hours. If you didn't create this
      account, please ignore this email.
    </p>

    <hr
      style={{
        border: "none",
        borderTop: "1px solid #E5E7EB",
        margin: "30px 0",
      }}
    />

    <p style={{ color: "#9CA3AF", fontSize: "12px" }}>
      Arcade Compliance - Helping you stay compliant with gaming regulations
    </p>
  </div>
);
