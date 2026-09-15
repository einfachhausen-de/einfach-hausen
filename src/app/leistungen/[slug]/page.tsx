import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { canonical, ogImages } from '@/lib/seo';
import { ServiceDetailPage } from '@/components/marketing/service-detail-page';
import { SERVICE_CATEGORIES, getServiceCategory } from '@/components/marketing/service-catalog';

export function generateStaticParams() {
  return SERVICE_CATEGORIES.filter((service) => service.slug !== 'heizung').map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceCategory(slug);
  if (!service) return {};
  return {
    title: service.seo.title,
    description: service.seo.description,
    alternates: { canonical: canonical(`/leistungen/${service.slug}`) },
    openGraph: { type: 'website', title: service.seo.title, description: service.seo.description, url: `/leistungen/${service.slug}`, images: ogImages('leistungen') },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceCategory(slug);
  if (!service || service.slug === 'heizung') notFound();
  return <ServiceDetailPage service={service} />;
}
