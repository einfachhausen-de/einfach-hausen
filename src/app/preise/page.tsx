import type { Metadata } from 'next';
import { BadgeCheck, Scale, ShieldCheck } from 'lucide-react';
import { canonical, ogBlock } from '@/lib/seo';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, FeatureCards, Heading, PageHero, Section } from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { Reveal, Stagger } from '@/components/marketing/motion';
import { ButtonLink, CheckList, cn } from '@/design-system/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Preise – dein kostenloses Hauskonto und Betriebstarife',
  description: 'Das Hauskonto für Eigentümer ist kostenlos. Transparente Betriebstarife für Handwerksbetriebe. Handwerkerleistungen werden separat vereinbart.',
  alternates: { canonical: canonical('/preise') },
  openGraph: ogBlock({ url: '/preise', title: 'Preise · Einfach Hausen', description: 'Kostenloses Hauskonto für Eigentümer und transparente Betriebstarife.', motiv: 'preise' }),
};

type PartnerPlan = { slug: string; title: string; monthly_amount: number; monthly_lead_limit: number | null; trial_days: number };

const HAUSKONTO_FEATURES = [
  'Digitale Hausakte und Dokumente',
  'Wartungen und Jahresübersicht',
  'Anliegen beschreiben und Angebote prüfen',
  'Ansprechpartner verwalten und finden',
  'Keine Mitgliedschaft als Zugangsvoraussetzung',
] as const;

export default function Page() {
  const partner = db
    .prepare('SELECT slug,title,monthly_amount,monthly_lead_limit,trial_days FROM partner_plans WHERE active=1 ORDER BY monthly_amount')
    .all() as PartnerPlan[];

  return (
    <SiteShell>
      <PageHero
        eyebrow="Preise"
        title="Dein Haus. Dein Tempo. Kostenlos."
        text="Dein Hauskonto ist kostenlos – dauerhaft. Es gibt keine Mitgliedschaft und kein Abo für Eigentümer. Die Arbeit am Haus vereinbarst du separat mit dem Betrieb."
        actions={
          <>
            <ButtonLink href="/register?role=homeowner" size="lg" arrow>
              Kostenloses Hauskonto anlegen
            </ButtonLink>
            <ButtonLink href="#betriebe" variant="outline" size="lg">
              Ich bin Partnerbetrieb
            </ButtonLink>
          </>
        }
        aside={
          <div className="flex flex-col gap-6 rounded-card bg-ink p-8 text-white shadow-lift sm:p-10">
            <p className="text-meta font-semibold uppercase tracking-wider text-lime">Für Eigentümer</p>
            <p className="font-display text-7xl font-bold leading-none tracking-tight sm:text-8xl">
              0 €
              <span className="ml-2 align-middle text-lg font-semibold tracking-normal text-white/70">dauerhaft</span>
            </p>
            <p className="text-lg leading-relaxed text-white/80">Unterlagen, Wartungen und deine Anliegen an einem Ort.</p>
            <div className="h-px bg-white/10" aria-hidden="true" />
            <CheckList tone="dark" items={['Kein Abo, keine Freischaltung', 'Keine Provision auf deinen Auftrag']} />
          </div>
        }
      />

      <Section id="hauskonto">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Heading
            eyebrow="Für dein Zuhause"
            title="Kostenlos. Ohne Tarifwahl."
            text="Das Hauskonto ist vollständig kostenlos: Hausakte, Dokumente, Wartungen, Anliegen und Angebote prüfen. Es gibt keine Mitgliedschaftsstufe und keine Freischaltung, die du kaufen müsstest. Die Rechnung des Handwerksbetriebs zahlst du direkt an den Betrieb."
          />
          <Reveal y={24}>
            <div className="flex flex-col gap-6 rounded-card bg-cream p-7 ring-1 ring-hairline sm:p-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-2xl font-bold text-ink">Hauskonto</h3>
                  <p className="text-body">Alle freigegebenen Kernfunktionen für Eigentümer.</p>
                </div>
                <p className="font-display text-5xl font-bold tracking-tight text-ink">
                  0 €<span className="text-base font-semibold tracking-normal text-body"> / dauerhaft</span>
                </p>
              </div>
              <CheckList items={HAUSKONTO_FEATURES} />
              <ButtonLink href="/register?role=homeowner" variant="ink" size="lg" arrow className="w-full sm:w-fit">
                Kostenloses Hauskonto anlegen
              </ButtonLink>
              <p className="text-meta text-body">
                Kein kostenpflichtiger Eigentümer-Tarif, keine Vermittlungs- oder Servicegebühr auf Handwerkeraufträge. Reparaturen, Material und
                zusätzliche Arbeiten rechnest du direkt mit dem Betrieb ab.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Zwei klare Vereinbarungen" title="Hausorganisation und Handwerk. Sauber getrennt." text="Du sollst vor deiner Entscheidung wissen, wofür du zahlst." />
        <Stagger className="grid gap-5 md:grid-cols-2" y={20}>
          {[
            {
              title: 'Dein Hauskonto',
              tag: 'Kostenlos',
              items: ['Das Hauskonto ist kostenlos und bleibt kostenlos.', 'Keine Mitgliedschaft, kein Abo, keine Freischaltung.', 'Keine Vermittlungs- oder Servicegebühr auf Aufträge.'],
              className: 'bg-white ring-1 ring-hairline',
            },
            {
              title: 'Dein Auftrag beim Betrieb',
              tag: 'Nach Angebot',
              items: ['Leistung und Preis vereinbarst du mit dem ausführenden Betrieb.', 'Arbeit, Material und Anfahrt richten sich nach dem Angebot.', 'Einfach Hausen erhebt keine Provision auf den Auftragswert.'],
              className: 'bg-lime-soft',
            },
          ].map((card) => (
            <div key={card.title} className={cn('flex h-full flex-col gap-5 rounded-card p-7 sm:p-9', card.className)}>
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-2xl font-bold text-ink">{card.title}</h3>
                <span className="rounded-pill bg-ink px-3 py-1 text-meta font-semibold text-lime">{card.tag}</span>
              </div>
              <CheckList items={card.items} />
            </div>
          ))}
        </Stagger>
      </Section>

      <Section tone="dark">
        <Heading tone="dark" eyebrow="Unser Preisprinzip" title="Du bezahlst für Handwerk. Nicht für Zugang." />
        <FeatureCards
          tone="dark"
          items={[
            { icon: Scale, title: 'Deine Entscheidung zählt.', text: 'Eine Frage ist noch kein Auftrag. Du entscheidest über den nächsten Schritt.' },
            { icon: ShieldCheck, title: 'Kein Zugang gegen Geld.', text: 'Hausakte, Anliegen und Ansprechpartner sind kostenlos. Es gibt keinen Tarif, der sie freischaltet.' },
            { icon: BadgeCheck, title: 'Eignung vor Tarif.', text: 'Ein zahlender Partner kauft keine bessere Position im Qualitätsmatching.' },
          ]}
        />
      </Section>

      <Section id="betriebe">
        <Heading
          eyebrow="Für Partnerbetriebe"
          title="Ein Arbeitsbereich. Ein planbarer Tarif."
          text="Wähle den Umfang für deinen Betrieb. Die Tarifgrenze für neue Anfragen ist keine Zusage über tatsächlich eingehende Aufträge."
        />
        {partner.length === 0 ? (
          <p className="max-w-xl rounded-card bg-cream p-8 text-body">
            Die Betriebstarife werden gerade aktualisiert. Registriere deinen Betrieb kostenlos – vor jeder Kostenpflicht informieren wir dich.
          </p>
        ) : (
          <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-4" y={20} gap={0.06}>
            {partner.map((plan) => {
              const featured = plan.slug === 'pro';
              const free = plan.monthly_amount === 0;
              return (
                <div
                  key={plan.slug}
                  className={cn('relative flex h-full flex-col gap-6 rounded-card p-7', featured ? 'bg-ink text-white' : 'bg-white ring-1 ring-hairline')}
                >
                  {featured && <span className="absolute -top-3 left-7 rounded-pill bg-lime px-3 py-1 text-meta font-bold text-ink">Häufig gewählt</span>}
                  <div className="flex flex-col gap-2">
                    <h3 className="font-display text-xl font-bold">{plan.title}</h3>
                    <p className="font-display text-4xl font-bold tracking-tight">
                      {euroExact(plan.monthly_amount)}
                      <span className={cn('text-base font-semibold tracking-normal', featured ? 'text-white/70' : 'text-body')}> / Monat</span>
                    </p>
                    <p className={cn('text-sm', featured ? 'text-white/75' : 'text-body')}>
                      {free ? 'Den Partnerbereich kennenlernen.' : 'Für die Zusammenarbeit mit Kunden und deinem Betrieb.'}
                    </p>
                  </div>
                  <CheckList
                    tone={featured ? 'dark' : 'light'}
                    className="flex-1 text-sm"
                    items={[
                      plan.monthly_lead_limit === null ? 'Keine tarifliche Monatsgrenze für neue Anfragen' : `Bis zu ${plan.monthly_lead_limit} neue Anfragen pro Monat`,
                      '0 % Auftragsprovision an Einfach Hausen',
                      'Tarifneutrales Qualitätsmatching',
                      ...(plan.trial_days > 0 ? [`${plan.trial_days} Tage Testphase laut Tarif`] : []),
                    ]}
                  />
                  <ButtonLink href={free ? '/register?role=provider' : '/kontakt'} variant={featured ? 'lime' : 'outline'} className="w-full">
                    {free ? 'Als Betrieb starten' : `${plan.title} besprechen`}
                  </ButtonLink>
                </div>
              );
            })}
          </Stagger>
        )}
        <p className="max-w-3xl text-sm text-body">
          Alle Preise zzgl. MwSt. Betriebstarife betreffen ausschließlich Handwerksbetriebe. Das Hauskonto für Eigentümer ist kostenlos und hat keinen Tarif.
          Konkrete Funktionen, Abrechnung und Bedingungen vor Abschluss prüfen.
        </p>
      </Section>

      <Section tone="cream">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Vor deiner Entscheidung" title="Die wichtigen Fragen. Klar beantwortet." />
          <PageFaq
            tone="white"
            items={[
              { q: 'Brauche ich ein Abo, um Hilfe anzufragen?', a: 'Nein. Das Hauskonto ist kostenlos und bleibt kostenlos. Du kannst dein Anliegen beschreiben und passende Angebote prüfen, ohne einen Tarif zu wählen.' },
              { q: 'Sind Reparaturen im Preis enthalten?', a: 'Es gibt keinen Monatspreis für Eigentümer. Handwerkerleistungen, Material und zusätzliche Arbeiten rechnest du direkt mit dem ausführenden Betrieb ab.' },
              { q: 'Welcher Tarif passt zu mir?', a: 'Es gibt keine Tarifwahl für Eigentümer. Du legst dein Hauskonto an und nutzt die Kernfunktionen vollständig; eine Mitgliedschaft musst du nicht abschließen.' },
              { q: 'Bekomme ich als zahlender Betrieb garantiert Aufträge?', a: 'Nein. Tarifgrenzen regeln das mögliche Anfragevolumen. Ob Anfragen passen, hängt unter anderem von Region, Leistung, Verfügbarkeit und Qualität ab.' },
              { q: 'Wie verdient Einfach Hausen Geld?', a: 'Über die Betriebstarife der teilnehmenden Handwerksbetriebe und über Vergütungen aus dem freiwilligen Vergleichsbereich für Verträge. Für Eigentümer ist die Nutzung kostenlos; auf den Handwerker-Auftragswert erheben wir keine Provision.' },
            ]}
          />
        </div>
      </Section>

      <ClosingCta
        title="Ein gutes Zuhause beginnt mit Überblick."
        text="Starte kostenlos mit deiner Hausakte. Ohne Tarifwahl, ohne Abo."
        primary={{ href: '/register?role=homeowner', label: 'Kostenloses Hauskonto anlegen' }}
        secondary={{ href: '/kontakt', label: 'Eine Frage stellen' }}
      />
    </SiteShell>
  );
}
