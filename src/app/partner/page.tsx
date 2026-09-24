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
    'Passende Anfragen aus deiner Region, Kunden, die dich als festen Ansprechpartner speichern, und 0 % Auftragsprovision. Das Partnernetzwerk von Einfach Hausen.',
  alternates: { canonical: canonical('/partner') },
  openGraph: ogBlock({
    url: '/partner',
    title: 'Für Betriebe · Einfach Hausen',
    description: 'Mehr Stammkunden. Null Provision. Das regionale Partnernetzwerk für Handwerksbetriebe.',
    motiv: 'partner',
  }),
};

type PartnerPlan = { slug: string; title: string; monthly_amount: number; monthly_lead_limit: number | null; trial_days: number };

const PROMISE = '0 % Auftragsprovision';
const TEAM_SWITCH = 'Pro Mitarbeitendem gibt es nur App-Zugang und einen Schalter: Aufträge verwalten AN / AUS. Fertig.';

const PRO_FAQ = [
  {
    q: 'Muss ich pro Auftrag etwas abgeben?',
    a: `Nein. Du zahlst ausschließlich deinen Monatstarif – im Free-Tarif gar nichts. Es gilt ${PROMISE}, du bleibst Rechnungssteller.`,
  },
  {
    q: 'Wie werden Anfragen verteilt?',
    a: 'Nach Eignung: Entfernung, Fachgebiet, Qualifikation, Verfügbarkeit, Kapazität, Kundenzufriedenheit und bestehende Kundenbeziehungen. Ein höherer Tarif kauft keine bessere Position.',
  },
  {
    q: 'Was wird bei der Prüfung verlangt?',
    a: 'Gewerbenachweis, erforderliche Qualifikationen und Zulassungen, Betriebshaftpflicht und Referenzen bzw. vorhandene Bewertungen – plus ein aktiver Partnervertrag.',
  },
  {
    q: 'Kann ich Anfragen ablehnen?',
    a: 'Jederzeit. Du entscheidest, welche Aufträge du annimmst, und kannst deine Kapazität in der App anpassen.',
  },
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja. Die bezahlten Tarife sind monatlich planbar und starten mit einer kostenlosen Testphase.',
  },
] as const;

export default function PartnerPage() {
  const plans = db
    .prepare('SELECT slug,title,monthly_amount,monthly_lead_limit,trial_days FROM partner_plans WHERE active=1 ORDER BY monthly_amount')
    .all() as PartnerPlan[];
  const trialDays = Math.max(0, ...plans.map((plan) => plan.trial_days));

  return (
    <ProShell>
      <ProHero trialDays={trialDays || 60} promise={PROMISE} />
      <ProComparison />
      <ProBenefits teamSwitch={TEAM_SWITCH} />
      <ProSteps />
      <ProAppFeature />
      <ProPricing plans={plans} promise={PROMISE} />
      <ProFaq items={PRO_FAQ} />
      <ProFinalCta />
    </ProShell>
  );
}
