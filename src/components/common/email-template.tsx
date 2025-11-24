import * as React from "react";

const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "24px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  color: "#333",
  lineHeight: 1.6,
};

const headerStyle = {
  color: "#2563eb",
  fontSize: "24px",
  marginBottom: "24px",
  borderBottom: "2px solid #e5e7eb",
  paddingBottom: "12px",
};

const codeContainerStyle = {
  padding: "16px 32px",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeStyle = {
  fontFamily: "monospace",
  fontSize: "24px",
  letterSpacing: "4px",
  color: "#1e40af",
  fontWeight: "bold" as const,
};

const securityListStyle = {
  backgroundColor: "#fff7ed",
  padding: "16px 32px",
  borderRadius: "8px",
  border: "1px solid #fed7aa",
  margin: "16px 0",
};

const footerStyle = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "32px",
  textAlign: "center" as const,
  borderTop: "1px solid #e5e7eb",
  paddingTop: "16px",
};

export const ResetPasswordEmailTemplate: React.FC<Readonly<{
  firstName: string;
  url: string;
}>> = ({
  firstName,
  url,
}) => (
  <div style={containerStyle}>
    <h1 style={headerStyle}>Reset Your Password</h1>
    <p>Hello {firstName},</p>
    <p>You recently requested to reset your password. Click the button below to reset your password:</p>
    
    <div style={codeContainerStyle}>
      <a 
        href={url}
        style={{
          ...codeStyle,
          textDecoration: "none",
          display: "inline-block",
          padding: "12px 24px",
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "6px",
        }}
      >
        Reset Password
      </a>
    </div>

    <p><strong>Important Security Notice:</strong></p>
    <ul style={securityListStyle}>
      <li>If you did not request this password reset, please ignore this email.</li>
      <li>This link will expire in 30 minutes.</li>
      <li>We will never ask for your password via email or phone.</li>
    </ul>

    <p style={footerStyle}>
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
);