import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BLOG_POSTS } from '@/lib/seo-cluster';
import { LEXIKON_EINTRAEGE, LEXIKON_KATEGORIEN } from '@/lib/lexikon';
import { SERVICE_PATHS } from '@/components/marketing/service-catalog';

/**
 * SEO P0: statische Sitemap aller oeffentlichen Marketing-Routen.
 * Privat: /app/*, /admin/*, /pro/*, Auth (/login, /register*), dynamische
 * App-Routen (/chat/*, /onboarding/*, /transfer/*), funktionale
 * Tools (/mein-haus) sind
 * bewusst NICHT enthalten (diese tragen zusaetzlich noindex-Metadata).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; changeFrequency: 'weekly' | 'monthly' | 'yearly'; priority: number }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/leistungen', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/preise', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/so-funktionierts', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/pilotphase', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/eigenheimbesitzer', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/hausakte', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/beratung', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/notfall', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/versicherung', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/immobilienverkauf', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/partner', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/hilfe', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/lexikon', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/kontakt', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/ueber-uns', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/sicherheit', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/barrierefreiheit', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/agb', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/datenschutz', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/impressum', changeFrequency: 'yearly', priority: 0.3 },
  ];
  const servicePages: Array<{ path: string; changeFrequency: 'weekly' | 'monthly' | 'yearly'; priority: number }> = SERVICE_PATHS.map((path) => ({
    path, changeFrequency: 'monthly' as const, priority: 0.8,
  }));
  const cluster: Array<{ path: string; changeFrequency: 'weekly' | 'monthly' | 'yearly'; priority: number }> = [
    ...BLOG_POSTS.map((p) => ({ path: `/blog/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...LEXIKON_KATEGORIEN.map((k) => ({ path: `/lexikon/kategorie/${k.slug}`, changeFrequency: 'monthly' as const, priority: 0.55 })),
    ...LEXIKON_EINTRAEGE.map((t) => ({ path: `/lexikon/${t.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
  const now = new Date();
  return [...pages, ...servicePages, ...cluster].map(({ path, changeFrequency, priority }) => ({
    // Prozent-kodiert: Slugs duerfen Umlaute enthalten (/lexikon/lueftungsanlage).
    url: path === '/' ? `${SITE_URL}/` : `${SITE_URL}${encodeURI(path)}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
