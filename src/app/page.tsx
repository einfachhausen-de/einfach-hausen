import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canonical } from '@/lib/seo';
import { getCurrentUser } from '@/lib/auth';
import { SiteShell } from '@/components/site/site-shell';
import { Hero } from '@/components/site/home/hero';
import { CategoryMarquee } from '@/components/site/home/category-marquee';
import { AppBento } from '@/components/site/home/app-bento';
import { SavingsCalculator } from '@/components/site/home/savings-calculator';
import { TariffFeature } from '@/components/site/home/tariff-feature';
import { CraftsmenFeature } from '@/components/site/home/craftsmen-feature';
import { AiManagerFeature } from '@/components/site/home/ai-manager-feature';
import { HowItWorks } from '@/components/site/home/how-it-works';
import { Comparison } from '@/components/site/home/comparison';
import { SocialProof } from '@/components/site/home/social-proof';
import { PricingPromise } from '@/components/site/home/pricing-promise';
import { HomeFaq } from '@/components/site/home/home-faq';
import { FinalCta } from '@/components/site/home/final-cta';
import { MobileCtaBar } from '@/components/site/home/mobile-cta-bar';

export const metadata: Metadata = {
  title: { absolute: 'Einfach Hausen · Die App fürs Eigenheim: Tarife, Handwerker & KI-Hausmanager' },
  description:
    'Tarife vergleichen und mit einem Klick wechseln, geprüfte Handwerker finden und speichern, digitale Hausakte und KI-Hausmanager. Kostenlos für Eigentümer.',
  alternates: { canonical: canonical('/') },
};

/**
 * Dramaturgie: Versprechen + sofortige Handlung (Hero-Suche) → Verlustaversion (Sparrechner)
 * → Produktbreite (Bento) → drei Kernnutzen im Detail → geringe Einstiegshürde → Vergleich
 * → soziale Bewährtheit → Preis-Transparenz → Einwände → Abschluss.
 */
export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === 'provider' ? '/pro' : '/app');

  return (
    <SiteShell>
      <Hero />
      <CategoryMarquee />
      <SavingsCalculator />
      <AppBento />
      <TariffFeature />
      <CraftsmenFeature />
      <AiManagerFeature />
      <HowItWorks />
      <Comparison />
      <SocialProof />
      <PricingPromise />
      <HomeFaq />
      <FinalCta />
      <MobileCtaBar />
    </SiteShell>
  );
}
