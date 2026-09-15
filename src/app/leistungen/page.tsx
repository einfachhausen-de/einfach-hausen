import type { Metadata } from 'next';
import { breadcrumbJsonLd, canonical, leistungenServiceJsonLd, ogBlock } from '@/lib/seo';
import { MarketingShell } from '@/components/marketing/site-shell';
import { EHScope, EHSection, EHPageHero, EHServiceIndex, EHProductExcerpt, EHSectionHeading, EHProcess, EHFAQ, EHClosing, EHButton } from '@/design-system';
import { SERVICE_CATEGORIES } from '@/components/marketing/service-catalog';

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
  return <MarketingShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Leistungen', path: '/leistungen' }])) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(leistungenServiceJsonLd()) }} />
    <EHScope>
      <EHPageHero eyebrow="Hilfe rund um dein Haus" title="Was ansteht, muss nicht liegen bleiben."
        text="Eine Reparatur, die nächste Wartung oder ein Vorhaben, für das dir der passende Betrieb fehlt: Beschreibe dein Anliegen. Wir helfen beim Einordnen und Organisieren – abhängig von Leistung und regionaler Verfügbarkeit."
        actions={<><EHButton href="/register?role=homeowner" arrow>Mein Anliegen starten</EHButton><EHButton href="#leistungsbereiche" variant="secondary">Alle Bereiche ansehen</EHButton></>}
        media={<EHProductExcerpt label="Beispiele · dein nächster Schritt" title="Wobei brauchst du Hilfe?" rows={[
          { title: 'Etwas funktioniert nicht.', text: 'Zum Beispiel eine tropfende Armatur oder eine auffällige Heizung.' },
          { title: 'Etwas ist wieder fällig.', text: 'Zum Beispiel Wartung, Reinigung oder Gartenpflege.' },
          { title: 'Du möchtest etwas verändern.', text: 'Zum Beispiel ein Bad modernisieren oder eine Wallbox planen.' },
        ]} note="Du musst das passende Gewerk nicht vorab kennen. Eine Beschreibung ist noch kein Auftrag." />} />
      <EHSection tone="white">
        <EHSectionHeading eyebrow="Mit einem konkreten Anliegen anfangen" title="So darf dein erster Satz klingen."
          text="Wähle ein Beispiel als Ausgangspunkt. Es wird in der Registrierung vorbefüllt – du kannst es dort anpassen." />
        <EHServiceIndex items={EXAMPLES.map((example, index) => ({
          label: 'Beispiel ' + String(index + 1).padStart(2, '0'),
          title: example,
          text: 'Als Ausgangspunkt für mein Anliegen verwenden',
          href: '/register?role=homeowner&request=' + encodeURIComponent(example),
        }))} />
      </EHSection>
      <EHSection id="leistungsbereiche">
        <EHSectionHeading eyebrow="Zur Orientierung" title="Zwölf Bereiche für dein Zuhause."
          text="Hier findest du mehr zum jeweiligen Leistungsbereich. Die Einordnung deines Anliegens kannst du uns überlassen." />
        <EHServiceIndex items={SERVICE_CATEGORIES.map(({ title, description, slug }) => ({ title, text: description, href: '/leistungen/' + slug }))} />
      </EHSection>
      <EHSection tone="white">
        <EHSectionHeading eyebrow="Wie es weitergeht" title="Du beschreibst. Du prüfst. Du entscheidest." />
        <EHProcess items={[
          { title: 'Die Situation klären.', text: 'Was ist zu tun, wo und wie dringend? Ergänzende Angaben helfen dabei, den Bedarf einzuordnen.' },
          { title: 'Passende Hilfe prüfen.', text: 'Ist ein geeigneter Partner verfügbar, klärst du den Leistungsumfang, das Angebot und den Termin.' },
          { title: 'Bewusst beauftragen.', text: 'Du entscheidest, ob das Angebot passt. Hinterlegte Absprachen und Unterlagen bleiben beim Vorgang.' },
        ]} />
        <EHButton href="/so-funktionierts" variant="secondary">Den Ablauf genauer ansehen</EHButton>
      </EHSection>
      <EHSection>
        <EHSectionHeading eyebrow="Gut zu wissen" title="Passt Einfachhausen zu meinem Anliegen?" />
        <EHFAQ items={[
          { q: 'Mein Anliegen passt in keine Kategorie. Was nun?', a: 'Beschreibe es in deinen Worten. Die Kategorien dienen der Orientierung. Ob und welcher Betrieb helfen kann, hängt vom konkreten Bedarf und regionalen Partnernetz ab.' },
          { q: 'Macht Einfachhausen die Arbeiten selbst?', a: 'Die vereinbarten Arbeiten übernehmen eigenständige Partnerbetriebe. Einfachhausen hilft beim Einordnen und Organisieren deines Anliegens.' },
          { q: 'Kann ich erst eine Frage klären?', a: <>Ja. Du musst nicht gleich einen Auftrag vorbereiten. <a href="/beratung">Mehr zur Beratung</a>.</> },
          { q: 'Was kostet die Anfrage?', a: <>Das Hauskonto ist kostenlos. Handwerkerleistungen und zusätzliche Betreuung werden separat vereinbart. <a href="/preise">Zu den Preisen</a>.</> },
          { q: 'Ist ein Betrieb in meiner Region verfügbar?', a: 'Das Partnernetz wird regional aufgebaut. Leistung, Standort und freie Kapazitäten bestimmen, welche Hilfe möglich ist. Eine bestimmte Verfügbarkeit wird nicht pauschal zugesagt.' },
          { q: 'Was gilt bei einem dringenden Fall?', a: <>Beschreibe die Dringlichkeit. Einfachhausen ist kein garantierter 24/7-Notdienst; bei akuter Gefahr nutze den zuständigen Notruf. <a href="/notfall">Hinweise für dringende Fälle</a>.</> },
        ]} />
      </EHSection>
      <EHClosing title="Fang mit dem an, was dich gerade beschäftigt."
        text="Du brauchst keine fertige Leistungsbeschreibung. Dein erster Satz ist der Anfang."
        href="/register?role=homeowner" label="Mein Anliegen starten"
        secondary={<EHButton href="/so-funktionierts" variant="secondary">Erst den Ablauf kennenlernen</EHButton>} />
    </EHScope>
  </MarketingShell>;
}
