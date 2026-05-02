/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import { main, container, brandBar, h1, text, link, button, footer } from './_styles.ts'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to start using {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>{siteName}</Text>
        <Heading style={h1}>Verify your email address</Heading>
        <Text style={text}>
          Welcome aboard! Please confirm{' '}
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>{' '}
          to activate your{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>{' '}
          account and unlock AI-powered metadata generation.
        </Text>
        <Button style={button} href={confirmationUrl}>Verify email</Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
