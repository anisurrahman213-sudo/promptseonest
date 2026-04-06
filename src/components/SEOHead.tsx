import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown>;
}

const BASE_URL = 'https://www.promptseonest.com';
const OG_IMAGE = `${BASE_URL}/og-image.png`;

const defaultStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Prompt SEO Nest",
  "url": BASE_URL,
  "description": "AI-Powered Image SEO Generator that creates optimized alt text, file names, and metadata for images.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export const SEOHead = ({ title, description, path, keywords, noindex = false, structuredData }: SEOHeadProps) => {
  const fullTitle = `${title} | Prompt SEO Nest`;
  const url = `${BASE_URL}${path}`;
  const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';
  const jsonLd = structuredData || defaultStructuredData;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};
