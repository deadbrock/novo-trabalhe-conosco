import { company } from '@/constants/company'
import { useCmsSeo } from '@/context/CmsContext'

export function SeoHead({
  title,
  description,
  canonical,
  noindex = false,
  ogImage = '/og-default.jpg',
  ogType = 'website',
}) {
  const seo = useCmsSeo()
  const siteName = seo.siteName || company.name
  const metaDescription = description ?? seo.defaultDescription ?? company.description
  const fullTitle = title
    ? `${title} — ${siteName}`
    : seo.defaultTitle || `${siteName} — Carreiras`

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {seo.defaultKeywords && <meta name="keywords" content={seo.defaultKeywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </>
  )
}
