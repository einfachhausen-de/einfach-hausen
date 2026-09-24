import type { Metadata } from 'next';
import { canonical, ogBlock } from '@/lib/seo';
import { db } from '@/lib/db';
import { ProShell } from '@/components/site/pro/pro-shell';
import {
  ProAppFeature, ProBenefits, ProComparison, ProFaq, ProFinalCta, ProHero, ProPricing, ProSteps,
} from '@/components/site/pro/pro-sections';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Für Handwerker & Betriebe – mehr Stammkunden, 0 % Provision',
  description:
    'Passende Aufträge aus deiner Region, Kunden, die dich als festen Ansprechpartner speichern, und 0 % Provision. Das Partnernetzwerk von Einfach Hausen.',
  alternates: { canonical: canonical('/partner') },
  openGraph: ogBlock({
    url: '/partner',
    title: 'Für Betriebe · Einfach Hausen',
    description: 'Mehr Stammkunden. Null Provision. Das regionale Partnernetzwerk für Handwerksbetriebe.',
    motiv: 'partner',
  }),
};

type PartnerPlan = { slug: string; title: string; monthly_amount: number; monthly_lead_limit: number | null; trial_days: number };

export default function PartnerPage() {
  const plans = db
    .prepare('SELECT slug,title,monthly_amount,monthly_lead_limit,trial_days FROM partner_plans WHERE active=1 ORDER BY monthly_amount')
    .all() as PartnerPlan[];
  const trialDays = Math.max(0, ...plans.map((plan) => plan.trial_days));

  return (
    <ProShell>
      <ProHero trialDays={trialDays || 60} />
      <ProComparison />
      <ProBenefits />
      <ProSteps />
      <ProAppFeature />
      <ProPricing plans={plans} />
      <ProFaq />
      <ProFinalCta />
    </ProShell>
  );
}
