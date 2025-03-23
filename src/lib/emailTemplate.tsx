// lib/emailTemplate.tsx
import { Html, Body, Container, Text, Button } from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  email: string;
}

export function WelcomeEmail({ name, email }: WelcomeEmailProps) {
  return (
    <Html>
      <Body>
        <Container style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
          <Text style={{ fontSize: "24px", fontWeight: "bold" }}>Welcome, {name}!</Text>
          <Text>Thank you for signing up with your email: {email}</Text>
          <Button
            href="https://your-app.com/verify"
            style={{
              backgroundColor: "#4CAF50",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "5px",
            }}
          >
            Verify Your Email
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
