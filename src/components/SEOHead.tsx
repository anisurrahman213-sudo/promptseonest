import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  noindex?: boolean;
}

const BASE_URL = 'https://www.promptseonest.com';
const OG_IMAGE = `${BASE_URL}/og-image.png`;

export const SEOHead = ({ title, description, path, keywords, noindex = false }: SEOHeadProps) => {
  const fullTitle = `${title} | Prompt SEO Nest`;
  const url = `${BASE_URL}${path}`;
  const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';

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
    </Helmet>
  );
};
