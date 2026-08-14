import type { MetadataRoute } from 'next';
import { SITE_URL } from './layout';

// Public routes only — the gated app can't be indexed and shouldn't be listed.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/explore', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/register', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/login', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/legal/privacy', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/legal/terms', priority: 0.2, changeFrequency: 'yearly' },
  ];
  const lastModified = new Date();
  return pages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
