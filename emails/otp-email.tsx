import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import type { CSSProperties, ReactNode } from "react"

const colors = {
  background: "#fbfaf7",
  border: "#e7e1d8",
  card: "#ffffff",
  foreground: "#174334",
  muted: "#5c8174",
  primary: "#1f7a5c",
  primaryLight: "#e8f4ef",
  gold: "#cc9933",
}

const fontFamily = "Outfit, Arial, sans-serif"

type OtpEmailProps = {
  preview: string
  heading: string
  body: string
  otp: string
  footerNote: string
  children?: ReactNode
}

export function OtpEmail({
  preview,
  heading,
  body,
  otp,
  footerNote,
  children,
}: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brand}>Qaza</Text>
            <Text style={tagline}>Your prayer companion</Text>
          </Section>

          <Section style={card}>
            <Text style={eyebrow}>Account security</Text>
            <Heading style={headingStyle}>{heading}</Heading>
            <Text style={bodyText}>{body}</Text>

            <Section style={codeWrap}>
              <Text style={codeLabel}>Your code</Text>
              <Text style={code}>{otp}</Text>
              <Text style={expiry}>Expires in 15 minutes</Text>
            </Section>

            {children}

            <Text style={note}>{footerNote}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Need help? Reply to this email and we will help you out.</Text>
            <Text style={footerBrand}>Qaza</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main: CSSProperties = {
  backgroundColor: colors.background,
  color: colors.foreground,
  fontFamily,
  margin: 0,
  padding: "32px 12px",
}

const container: CSSProperties = {
  margin: "0 auto",
  maxWidth: "560px",
  width: "100%",
}

const brandSection: CSSProperties = {
  padding: "8px 4px 20px",
  textAlign: "center",
}

const brand: CSSProperties = {
  color: colors.primary,
  fontSize: "28px",
  fontWeight: 800,
  letterSpacing: "0",
  lineHeight: "32px",
  margin: "0",
}

const tagline: CSSProperties = {
  color: colors.muted,
  fontSize: "14px",
  lineHeight: "20px",
  margin: "4px 0 0",
}

const card: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: "14px",
  padding: "34px 28px",
}

const eyebrow: CSSProperties = {
  color: colors.gold,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  lineHeight: "16px",
  margin: "0 0 10px",
  textTransform: "uppercase",
}

const headingStyle: CSSProperties = {
  color: colors.foreground,
  fontSize: "26px",
  fontWeight: 800,
  letterSpacing: "0",
  lineHeight: "32px",
  margin: "0 0 12px",
}

const bodyText: CSSProperties = {
  color: colors.muted,
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 24px",
}

const codeWrap: CSSProperties = {
  backgroundColor: colors.primaryLight,
  border: `1px solid ${colors.primary}`,
  borderRadius: "12px",
  margin: "0 0 24px",
  padding: "22px 18px",
  textAlign: "center",
}

const codeLabel: CSSProperties = {
  color: colors.primary,
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: "18px",
  margin: "0 0 8px",
}

const code: CSSProperties = {
  color: colors.foreground,
  fontFamily: "Arial, sans-serif",
  fontSize: "34px",
  fontWeight: 800,
  letterSpacing: "8px",
  lineHeight: "40px",
  margin: "0",
}

const expiry: CSSProperties = {
  color: colors.muted,
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "18px",
  margin: "10px 0 0",
}

const note: CSSProperties = {
  color: colors.muted,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
}

const footer: CSSProperties = {
  padding: "20px 12px 0",
  textAlign: "center",
}

const footerText: CSSProperties = {
  color: colors.muted,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px",
}

const footerBrand: CSSProperties = {
  color: colors.primary,
  fontSize: "13px",
  fontWeight: 800,
  lineHeight: "18px",
  margin: "0",
}
