import type { MetadataRoute } from 'next';
import { SITE_URL } from './layout';

// Only the public surfaces are crawlable. Everything else is gated by the proxy
// and would answer a crawler with a 307 to /login, so listing it would waste
// crawl budget and surface login redirects in search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/explore', '/legal'],
        disallow: ['/dashboard', '/portfolio', '/account', '/courses', '/instructor', '/auth', '/api'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
