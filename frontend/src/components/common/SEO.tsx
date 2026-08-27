import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string[];
    canonical?: string;
    type?: string;
    image?: string;
    schema?: Record<string, any> | Record<string, any>[];
}

export default function SEO({
    title,
    description,
    keywords,
    canonical,
    type = 'website',
    image = '/og-image.png',
    schema
}: SEOProps) {
    const location = useLocation();
    const siteTitle = 'CampusConsult | AI University Advisor & Study Abroad Platform';
    const fullTitle = title === 'Home' ? siteTitle : title.includes('CampusConsult') ? title : `${title} | CampusConsult`;

    // Auto-generate canonical URL if not explicitly provided
    const siteOrigin = 'https://www.uniadvisorai.com';
    const canonicalUrl = canonical || `${siteOrigin}${location.pathname}`;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name='description' content={description} />
            {keywords && keywords.length > 0 && (
                <meta name="keywords" content={keywords.join(', ')} />
            )}
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={canonicalUrl} />

            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Schema.org JSON-LD */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}
