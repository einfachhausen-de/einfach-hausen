import type { Metadata } from 'next';
import { canonical, ogImages } from '@/lib/seo';
import { ServiceDetailPage } from '@/components/marketing/service-detail-page';
import { getServiceCategory } from '@/components/marketing/service-catalog';

const service = getServiceCategory('heizung')!;

export const metadata: Metadata = {
  title: service.seo.title,
  description: service.seo.description,
  alternates: { canonical: canonical('/leistungen/heizung') },
  openGraph: { type: 'website', title: service.seo.title, description: service.seo.description, url: '/leistungen/heizung', images: ogImages('leistungen') },
};

export default function Page() {
  return <ServiceDetailPage service={service} />;
}
