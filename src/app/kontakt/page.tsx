import type { Metadata } from 'next';
import { CircleAlert, CircleHelp, FolderOpen, Hammer, MessageSquarePlus, ShieldCheck } from 'lucide-react';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { AlertPanel, ClosingCta, ExampleCard, Heading, LinkCards, PageHero, Section } from '@/components/site/page/blocks';
import { Stagger } from '@/components/marketing/motion';
import { ButtonLink } from '@/design-system/site';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Der richtige Weg für dein Anliegen: Hausanliegen starten, bestehenden Vorgang öffnen, Partnerfragen, Datenschutz.',
  alternates: { canonical: canonical('/kontakt') },
};

export default function Page() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Kontakt & Support"
        title="Sag uns, worum es geht. Wir zeigen dir den richtigen Weg."
        text="Hausanliegen, laufende Reparaturen und Partneranfragen bleiben dort gebündelt, wo der Zusammenhang liegt. So musst du deine Geschichte nicht mehrfach erzählen."
        actions={
          <>
            <ButtonLink href="/register?role=homeowner" size="lg" arrow>
              Neues Anliegen starten
            </ButtonLink>
            <ButtonLink href="/login" variant="outline" size="lg">
              Bestehenden Vorgang öffnen
            </ButtonLink>
          </>
        }
        aside={
          <ExampleCard
            label="Der kürzeste Weg"
            title="Wo ist dein Anliegen am besten aufgehoben?"
            rows={[
              { title: 'Neu am Haus', text: 'Beschreibe es im Hauskonto. Dort bleiben Fotos und Antworten zusammen.' },
              { title: 'Schon in Arbeit', text: 'Nachrichten, Angebote und Termine findest du beim Vorgang.' },
              { title: 'Rechtlich oder vertraulich', text: 'Nutze die Kontaktdaten aus Impressum und Datenschutzerklärung.' },
            ]}
          />
        }
      />

      <Section>
        <Heading eyebrow="Kontaktwege" title="Vier Wege, je nach Anliegen." />
        <LinkCards
          columns={4}
          items={[
            { icon: MessageSquarePlus, title: 'Neues Anliegen starten', text: 'Beschreibe kurz, was ansteht. Wir helfen beim Einordnen und bei der Suche nach passender Hilfe.', href: '/register?role=homeowner' },
            { icon: FolderOpen, title: 'Bestehender Vorgang', text: 'Ansprechpartner, Angebote, Termine und Dokumente im Hauskonto einsehen.', href: '/login' },
            { icon: CircleHelp, title: 'Fragen & Antworten', text: 'Kosten, Hausakte und Sicherheit im Hilfebereich nachlesen.', href: '/hilfe' },
            { icon: Hammer, title: 'Für Handwerksbetriebe', text: 'Informationen für Partnerbetriebe, Konditionen und Registrierung.', href: '/partner' },
          ]}
        />
      </Section>

      <Section tone="cream">
        <Heading
          eyebrow="Wichtig bei dringenden Fällen"
          title="Einfach Hausen ersetzt keinen Notruf."
          text="Wir sind kein garantierter 24/7-Notdienst. Bei Gefahr zählt jede Minute – dann ist der öffentliche Notruf der richtige Weg."
        />
        <Stagger className="grid gap-5 md:grid-cols-2" y={16}>
          <AlertPanel tone="warn" icon={CircleAlert} title="Akute Gefahr für Leib und Leben">
            Bei Feuer, Gasgeruch, Einbruch oder akuter Einsturzgefahr wähle sofort die <strong className="text-ink">112</strong> bzw. die{' '}
            <strong className="text-ink">110</strong>.
          </AlertPanel>
          <AlertPanel icon={ShieldCheck} title="Dringende Hausschäden">
            Bei Rohrbruch oder Heizungsausfall im Winter kannst du den Fall im Hauskonto als dringend kennzeichnen. Hilfe hängt von regionaler Verfügbarkeit ab.{' '}
            <a href="/notfall" className="font-semibold text-brand underline underline-offset-4">
              Hinweise für dringende Fälle
            </a>
          </AlertPanel>
        </Stagger>
      </Section>

      <Section>
        <div className="grid gap-8 rounded-card bg-cream p-7 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-14">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">Offizieller Kontakt für rechtliche und vertrauliche Anliegen.</h2>
            <p className="leading-relaxed text-body">
              Für Datenschutzanfragen, rechtliche Mitteilungen oder Sicherheitsmeldungen stehen die Kontaktdaten im Impressum und in der Datenschutzerklärung
              zur Verfügung. Anfragen zu deinem Haus laufen am besten über dein Hauskonto.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink href="/impressum" variant="outline">
              Impressum
            </ButtonLink>
            <ButtonLink href="/datenschutz" variant="outline">
              Datenschutz
            </ButtonLink>
            <ButtonLink href="/sicherheit" variant="outline">
              Sicherheit
            </ButtonLink>
          </div>
        </div>
      </Section>

      <ClosingCta
        title="Brauchst du Hilfe bei deinem Eigenheim?"
        text="Kostenlos anmelden und dein Anliegen in eigenen Worten beschreiben."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/hilfe', label: 'Erst Antworten lesen' }}
      />
    </SiteShell>
  );
}
