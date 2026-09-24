import type { Metadata } from 'next';
import { breadcrumbJsonLd, canonical, leistungenServiceJsonLd, ogBlock } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, ExampleCard, Heading, JsonLd, LinkCards, PageHero, Section, StepList } from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { SERVICE_CATEGORIES } from '@/components/marketing/service-catalog';
import { ButtonLink } from '@/design-system/site';

export const metadata: Metadata = { title: 'Leistungen', description: 'Alles rund ums Eigenheim: Reparatur, Heizung, Dach, Garten, Sanierung, Wartung. Du beschreibst, wir ordnen zu.' , alternates: { canonical: canonical('/leistungen') }, openGraph: ogBlock({ url: '/leistungen', title: 'Leistungen · Einfach Hausen', description: 'Alles rund ums Eigenheim: Reparatur, Heizung, Dach, Garten, Sanierung, Wartung. Du beschreibst, wir ordnen zu.', motiv: 'leistungen' }) };

const EXAMPLES = [
  'Die Heizung macht seit gestern klackernde Geräusche.',
  'Im Bad ist die Silikonfuge schwarz und löst sich.',
  'Wir wollen eine Wallbox, wissen aber nicht, ob der Anschluss reicht.',
  'Die Hecke ist zu hoch, der Nachbar hat sich beschwert.',
  'Nach dem Sturm liegt ein Ziegel im Garten.',
  'Wir ziehen um und brauchen jemanden fürs Ausräumen des Kellers.',
] as const;

export default function Page() {
  return (
    <SiteShell>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Leistungen', path: '/leistungen' }])} />
      <JsonLd data={leistungenServiceJsonLd()} />

      <PageHero
        eyebrow="Hilfe rund um dein Haus"
        title="Was ansteht, muss nicht liegen bleiben."
        text="Eine Reparatur, die nächste Wartung oder ein Vorhaben, für das dir der passende Betrieb fehlt: Beschreibe dein Anliegen. Wir helfen beim Einordnen und Organisieren – abhängig von Leistung und regionaler Verfügbarkeit."
        actions={
          <>
            <ButtonLink href="/register?role=homeowner" size="lg" arrow>
              Mein Anliegen starten
            </ButtonLink>
            <ButtonLink href="#leistungsbereiche" variant="outline" size="lg">
              Alle Bereiche ansehen
            </ButtonLink>
          </>
        }
        aside={
          <ExampleCard
            label="Beispiele · dein nächster Schritt"
            title="Wobei brauchst du Hilfe?"
            rows={[
              { title: 'Etwas funktioniert nicht.', text: 'Zum Beispiel eine tropfende Armatur oder eine auffällige Heizung.' },
              { title: 'Etwas ist wieder fällig.', text: 'Zum Beispiel Wartung, Reinigung oder Gartenpflege.' },
              { title: 'Du möchtest etwas verändern.', text: 'Zum Beispiel ein Bad modernisieren oder eine Wallbox planen.' },
            ]}
            note="Du musst das passende Gewerk nicht vorab kennen. Eine Beschreibung ist noch kein Auftrag."
          />
        }
      />

      <Section>
        <Heading
          eyebrow="Mit einem konkreten Anliegen anfangen"
          title="So darf dein erster Satz klingen."
          text="Wähle ein Beispiel als Ausgangspunkt. Es wird in der Registrierung vorbefüllt – du kannst es dort anpassen."
        />
        <LinkCards
          items={EXAMPLES.map((example, index) => ({
            label: 'Beispiel ' + String(index + 1).padStart(2, '0'),
            title: `„${example}“`,
            text: 'Als Ausgangspunkt für mein Anliegen verwenden',
            href: '/register?role=homeowner&request=' + encodeURIComponent(example),
          }))}
        />
      </Section>

      <Section tone="cream" id="leistungsbereiche">
        <Heading
          eyebrow="Zur Orientierung"
          title="Zwölf Bereiche für dein Zuhause."
          text="Hier findest du mehr zum jeweiligen Leistungsbereich. Die Einordnung deines Anliegens kannst du uns überlassen."
        />
        <LinkCards
          columns={4}
          items={SERVICE_CATEGORIES.map(({ title, description, slug, icon }) => ({ icon, title, text: description, href: '/leistungen/' + slug }))}
        />
      </Section>

      <Section>
        <Heading eyebrow="Wie es weitergeht" title="Du beschreibst. Du prüfst. Du entscheidest." />
        <StepList
          steps={[
            { title: 'Die Situation klären.', text: 'Was ist zu tun, wo und wie dringend? Ergänzende Angaben helfen dabei, den Bedarf einzuordnen.' },
            { title: 'Passende Hilfe prüfen.', text: 'Ist ein geeigneter Partner verfügbar, klärst du den Leistungsumfang, das Angebot und den Termin.' },
            { title: 'Bewusst beauftragen.', text: 'Du entscheidest, ob das Angebot passt. Hinterlegte Absprachen und Unterlagen bleiben beim Vorgang.' },
          ]}
        />
        <ButtonLink href="/so-funktionierts" variant="outline" className="w-fit">
          Den Ablauf genauer ansehen
        </ButtonLink>
      </Section>

      <Section tone="cream">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Gut zu wissen" title="Passt Einfach Hausen zu meinem Anliegen?" />
          <PageFaq
            tone="white"
            items={[
              { q: 'Mein Anliegen passt in keine Kategorie. Was nun?', a: 'Beschreibe es in deinen Worten. Die Kategorien dienen der Orientierung. Ob und welcher Betrieb helfen kann, hängt vom konkreten Bedarf und regionalen Partnernetz ab.' },
              { q: 'Macht Einfach Hausen die Arbeiten selbst?', a: 'Die vereinbarten Arbeiten übernehmen eigenständige Partnerbetriebe. Einfach Hausen hilft beim Einordnen und Organisieren deines Anliegens.' },
              { q: 'Kann ich erst eine Frage klären?', a: <>Ja. Du musst nicht gleich einen Auftrag vorbereiten. <a href="/beratung">Mehr zur Beratung</a>.</> },
              { q: 'Was kostet die Anfrage?', a: <>Das Hauskonto ist kostenlos. Handwerkerleistungen und zusätzliche Betreuung werden separat vereinbart. <a href="/preise">Zu den Preisen</a>.</> },
              { q: 'Ist ein Betrieb in meiner Region verfügbar?', a: 'Das Partnernetz wird regional aufgebaut. Leistung, Standort und freie Kapazitäten bestimmen, welche Hilfe möglich ist. Eine bestimmte Verfügbarkeit wird nicht pauschal zugesagt.' },
              { q: 'Was gilt bei einem dringenden Fall?', a: <>Beschreibe die Dringlichkeit. Einfach Hausen ist kein garantierter 24/7-Notdienst; bei akuter Gefahr nutze den zuständigen Notruf. <a href="/notfall">Hinweise für dringende Fälle</a>.</> },
            ]}
          />
        </div>
      </Section>

      <ClosingCta
        title="Fang mit dem an, was dich gerade beschäftigt."
        text="Du brauchst keine fertige Leistungsbeschreibung. Dein erster Satz ist der Anfang."
        primary={{ href: '/register?role=homeowner', label: 'Mein Anliegen starten' }}
        secondary={{ href: '/so-funktionierts', label: 'Erst den Ablauf kennenlernen' }}
      />
    </SiteShell>
  );
}
