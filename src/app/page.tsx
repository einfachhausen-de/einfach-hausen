import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canonical } from '@/lib/seo';
import { getCurrentUser } from '@/lib/auth';
import { SiteShell } from '@/components/site/site-shell';
import { Hero } from '@/components/site/home/hero';
import { CategoryStrip } from '@/components/site/home/category-strip';
import { AppBento } from '@/components/site/home/app-bento';
import { SavingsCalculator } from '@/components/site/home/savings-calculator';
import { TariffFeature } from '@/components/site/home/tariff-feature';
import { CraftsmenFeature } from '@/components/site/home/craftsmen-feature';
import { AiManagerFeature } from '@/components/site/home/ai-manager-feature';
import { HowItWorks } from '@/components/site/home/how-it-works';
import { Comparison } from '@/components/site/home/comparison';
import { Promises } from '@/components/site/home/promises';
import { PricingPromise } from '@/components/site/home/pricing-promise';
import { HomeFaq } from '@/components/site/home/home-faq';
import { FinalCta } from '@/components/site/home/final-cta';
import { MobileCtaBar } from '@/components/site/home/mobile-cta-bar';

export const metadata: Metadata = {
  title: { absolute: 'Einfach Hausen · Die App fürs Eigenheim: Tarife, Handwerker & KI-Hausmanager' },
  description:
    'Tarife vergleichen und wechseln, Angebote geprüfter Handwerker vergleichen und speichern, digitale Hausakte und KI-Hausmanager. Kostenlos für Eigentümer.',
  alternates: { canonical: canonical('/') },
};

/**
 * Dramaturgie: Versprechen + sofortige Handlung (Hero-Suche) → Verlustaversion (Sparrechner)
 * → Produktbreite (Bento) → drei Kernnutzen im Detail → geringe Einstiegshürde → Vergleich
 * → Risikoumkehr (Versprechen statt erfundener Bewertungen) → Preis-Transparenz → Einwände → Abschluss.
 */
export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === 'provider' ? '/pro' : '/app');

  return (
    <SiteShell>
      <Hero />
      <CategoryStrip />
      <SavingsCalculator />
      <AppBento />
      <TariffFeature />
      <CraftsmenFeature />
      <AiManagerFeature />
      <HowItWorks />
      <Comparison />
      <Promises />
      <PricingPromise />
      <HomeFaq />
      <FinalCta />
      <MobileCtaBar />
    </SiteShell>
  );
}
