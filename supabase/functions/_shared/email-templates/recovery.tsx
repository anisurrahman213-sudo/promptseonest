/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import { main, container, brandBar, h1, text, button, footer } from './_styles.ts'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {siteName} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>{siteName}</Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset the password for your {siteName} account.
          Click the button below to choose a new one. The link expires shortly for your security.
        </Text>
        <Button style={button} href={confirmationUrl}>Reset password</Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email — your password will not change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
