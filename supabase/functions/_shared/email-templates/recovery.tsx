/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://jniqqburulrdwcbjetug.supabase.co/storage/v1/object/public/email-assets/vgg-logo.webp'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Password reset request for your VGG 360° Appraisal account</Preview>
    <Body style={main}>
      <Container style={outerContainer}>
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt="Venture Garden Group" width="140" height="auto" style={logo} />
        </Section>
        <Section style={contentSection}>
          <Heading style={h1}>Reset Your Password</Heading>
          <Text style={text}>
            We received a request to reset the password for your VGG 360° Appraisal account. Click the button below to set a new password. This link will expire shortly for your security.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Set New Password
            </Button>
          </Section>
          <Text style={dividerText}>— or copy this link into your browser —</Text>
          <Text style={urlText}>{confirmationUrl}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you did not request a password reset, no action is needed — your account remains secure.
        </Text>
        <Text style={copyright}>© {new Date().getFullYear()} Venture Garden Group. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#f4f6f8', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const outerContainer = { maxWidth: '560px', margin: '0 auto', padding: '48px 20px' }
const headerSection = { textAlign: 'center' as const, padding: '0 0 32px' }
const logo = { margin: '0 auto' }
const contentSection = { backgroundColor: '#ffffff', borderRadius: '16px', padding: '44px 36px', border: '1px solid #e2e6e3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a2e22', margin: '0 0 16px', lineHeight: '1.35', letterSpacing: '-0.3px' }
const text = { fontSize: '15px', color: '#3d4f45', lineHeight: '1.7', margin: '0 0 28px' }
const buttonContainer = { textAlign: 'center' as const, margin: '4px 0 28px' }
const button = { backgroundColor: '#2b8a3e', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '10px', padding: '14px 36px', textDecoration: 'none', display: 'inline-block' }
const dividerText = { fontSize: '11px', color: '#9ca8a0', textAlign: 'center' as const, margin: '0 0 8px', letterSpacing: '0.3px' }
const urlText = { fontSize: '11px', color: '#2b8a3e', wordBreak: 'break-all' as const, margin: '0', textAlign: 'center' as const }
const hr = { borderColor: '#e8ebe9', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#8a9690', textAlign: 'center' as const, margin: '0 0 8px', lineHeight: '1.5' }
const copyright = { fontSize: '11px', color: '#b0b8b3', textAlign: 'center' as const, margin: '0' }
