// Shared brand styles for PromptNest auth emails.
// Email body must remain white per platform rule, but accents follow brand purple.
export const brand = {
  primary: '#8b5cf6', // PromptNest purple
  primaryHover: '#7c3aed',
  primaryFg: '#ffffff',
  text: '#1f2937',
  muted: '#6b7280',
  faint: '#9ca3af',
  radius: '10px',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
}

export const main = { backgroundColor: '#ffffff', fontFamily: brand.fontFamily }
export const container = { padding: '32px 28px', maxWidth: '560px' }
export const brandBar = {
  fontSize: '13px',
  fontWeight: 700 as const,
  letterSpacing: '1.5px',
  color: brand.primary,
  textTransform: 'uppercase' as const,
  margin: '0 0 16px',
}
export const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: brand.text,
  margin: '0 0 20px',
  lineHeight: '1.3',
}
export const text = {
  fontSize: '15px',
  color: brand.muted,
  lineHeight: '1.6',
  margin: '0 0 22px',
}
export const link = { color: brand.primary, textDecoration: 'underline' }
export const button = {
  backgroundColor: brand.primary,
  color: brand.primaryFg,
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: brand.radius,
  padding: '13px 26px',
  textDecoration: 'none',
  display: 'inline-block',
}
export const codeStyle = {
  fontFamily: "'SF Mono', Menlo, Consolas, monospace",
  fontSize: '28px',
  fontWeight: 700 as const,
  letterSpacing: '6px',
  color: brand.text,
  backgroundColor: '#f4f3ff',
  padding: '16px 20px',
  borderRadius: brand.radius,
  display: 'inline-block',
  margin: '0 0 28px',
}
export const footer = {
  fontSize: '12px',
  color: brand.faint,
  lineHeight: '1.5',
  margin: '32px 0 0',
}
