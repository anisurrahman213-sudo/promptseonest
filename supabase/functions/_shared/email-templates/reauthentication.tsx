/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import { main, container, brandBar, h1, text, codeStyle, footer } from './_styles.ts'

interface ReauthenticationEmailProps {
  siteName?: string
  token: string
}

export const ReauthenticationEmail = ({ siteName = 'PromptNest', token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brandBar}>{siteName}</Text>
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Enter the verification code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn't request it, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
