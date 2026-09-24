import type { Metadata } from 'next';
import { BookOpen, LibraryBig, MessagesSquare, ShieldCheck } from 'lucide-react';
import { canonical, ogBlock } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, ExampleCard, Heading, LinkCards, PageHero, Section } from '@/components/site/page/blocks';
import { ButtonLink } from '@/design-system/site';
import { FaqExplorer } from './faq-explorer';

export const metadata: Metadata = {
  title: 'Hilfe & FAQ',
  description: 'Antworten zu Ablauf, Kosten, Ansprechpartnern, Hausakte und Partnern. Ehrlich und ohne Kleingedrucktes.',
  alternates: { canonical: canonical('/hilfe') },
  openGraph: ogBlock({ url: '/hilfe', title: 'Hilfe & FAQ · Einfach Hausen', description: 'Antworten zu Ablauf, Kosten, Ansprechpartnern, Hausakte und Partnern.', motiv: 'hilfe' }),
};

const faq = [
  { q: 'Löst eine normale Frage automatisch einen Auftrag aus?', a: 'Nein. Eine Frage bleibt eine Frage. Du entscheidest separat, ob du einen Ansprechpartner sprechen oder einen Auftrag organisieren lassen willst.', cat: 'Ablauf' },
  { q: 'Kann ich erst mit einem Menschen sprechen?', a: 'Ja. Ein passender geprüfter Ansprechpartner kann für Fragen verbunden werden, ohne dass daraus eine Buchung entsteht.', cat: 'Ablauf' },
  { q: 'Wie schnell meldet sich jemand?', a: 'In der Pilotphase bekommst du in der Regel innerhalb eines Werktags einen Vorschlag mit Partner und Kostenrahmen. Dringende Fälle kennzeichnest du beim Beschreiben.', cat: 'Ablauf' },
  { q: 'Sind alle Leistungen überall verfügbar?', a: 'Nein. Verfügbarkeit hängt vom regional aktiven Partnernetz und dessen Kapazität ab. Nach der Registrierung siehst du, was in deiner Region möglich ist.', cat: 'Ablauf' },
  { q: 'Was kostet das Hauskonto?', a: 'Nichts. Das Hauskonto ist für Eigentümer kostenlos und bleibt kostenlos. Es gibt keine Mitgliedschaft und keine kostenpflichtigen Pakete.', cat: 'Kosten' },
  { q: 'Was kostet ein Auftrag?', a: 'Das, was du mit dem Partnerbetrieb vereinbarst. Du siehst vorher einen Kostenrahmen und gibst erst dann frei. Einfach Hausen nimmt keine Provision.', cat: 'Kosten' },
  { q: 'Gibt es einen Pilot-Vorteil oder Paketrabatt?', a: 'Nein. Frühere Pilot- und Rabattmodelle auf kostenpflichtige Pakete wurden eingestellt, weil es für Eigentümer keine kostenpflichtigen Pakete mehr gibt. Die Nutzung ist vollständig kostenlos.', cat: 'Kosten' },
  { q: 'Wie werden Partner ausgewählt?', a: 'Nach fachlicher Eignung, Region, Qualifikation, Verfügbarkeit, Kapazität, Kundenzufriedenheit und bestehenden Beziehungen. Ein Partner-Tarif kauft keine bessere Platzierung.', cat: 'Partner' },
  { q: 'Nimmt Einfach Hausen Provision vom Partner?', a: 'Nein. 0 % Auftragsprovision. Partnerumsatz entsteht über planbare Monatstarife.', cat: 'Partner' },
  { q: 'Kann ich einen vorgeschlagenen Partner ablehnen?', a: 'Ja, jederzeit und ohne Begründung. Dann schlagen wir einen anderen vor, sofern in deiner Region verfügbar.', cat: 'Partner' },
  { q: 'Was ist die digitale Hausakte?', a: 'Sie bündelt Anlagen, Arbeiten, Dokumente, Garantien, Wartungen und Ansprechpartner langfristig an deinem Haus. Unterlagen aus abgeschlossenen Vorgängen findest du beim jeweiligen Vorgang wieder.', cat: 'Hausakte' },
  { q: 'Was passiert bei einem Eigentümerwechsel?', a: 'Hausbezogene Geschichte kann kontrolliert weitergegeben werden. Private Nachrichten, Zahlungen und nicht freigegebene Daten werden nicht übertragen.', cat: 'Hausakte' },
  { q: 'Wem gehören meine Daten?', a: 'Dir. Du kannst die Hausakte exportieren und dein Konto jederzeit löschen. Wir verkaufen keine Daten und geben nichts ohne deine Freigabe weiter.', cat: 'Hausakte' },
] as const;

export default function Page() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Hilfe & FAQ"
        title="Klare Antworten, bevor du irgendetwas beauftragst."
        text="Ablauf, Kosten, Partner, Hausakte. Wenn deine Frage fehlt, beschreib sie einfach als Anliegen. Auch eine Frage ist ein guter Start."
        actions={
          <>
            <ButtonLink href="/#anliegen" size="lg" arrow>
              Frage als Anliegen stellen
            </ButtonLink>
            <ButtonLink href="/kontakt" variant="outline" size="lg">
              Kontaktwege
            </ButtonLink>
          </>
        }
        aside={
          <ExampleCard
            label="Am häufigsten gefragt"
            title="Die drei Antworten, die fast alle suchen."
            rows={[
              { title: 'Kostet das etwas?', text: 'Nein. Das Hauskonto ist für Eigentümer kostenlos.' },
              { title: 'Wird automatisch beauftragt?', text: 'Nein. Ohne deine Freigabe entsteht kein Auftrag.' },
              { title: 'Wem gehören die Daten?', text: 'Dir. Export und Löschung jederzeit möglich.' },
            ]}
          />
        }
      />

      <Section tone="cream" id="fragen">
        <Heading eyebrow="Häufige Fragen" title="Was du über Einfach Hausen wissen solltest." text="Wähle ein Thema, um die Liste einzugrenzen." />
        <FaqExplorer entries={faq} />
      </Section>

      <Section>
        <Heading
          eyebrow="Weiterführend"
          title="Wenn du tiefer einsteigen willst."
          text="Antworten, Sicherheit, Ratgeber und Kontakt bleiben bewusst getrennte Wege – damit du schnell dort landest, wo du hinwillst."
        />
        <LinkCards
          columns={4}
          items={[
            { icon: ShieldCheck, title: 'Sicherheit & Daten', text: 'Wie Partnerprüfung, Datenfreigaben und deine Entscheidungen geschützt werden.', href: '/sicherheit' },
            { icon: BookOpen, title: 'Ratgeber', text: 'Konkrete Themen rund um Wartung, Sanierung und Entscheidungen am Haus.', href: '/blog' },
            { icon: LibraryBig, title: 'Lexikon', text: 'Begriffe kurz und verständlich nachschlagen, ohne Fachchinesisch.', href: '/lexikon' },
            { icon: MessagesSquare, title: 'Kontakt', text: 'Wenn du lieber direkt mit uns klären möchtest, was als Nächstes sinnvoll ist.', href: '/kontakt' },
          ]}
        />
      </Section>

      <ClosingCta
        title="Deine konkrete Frage ist ein guter Startpunkt."
        text="Leg kostenlos ein Hauskonto an und beschreib dein Anliegen in normalen Worten. Ein Auftrag entsteht daraus nur, wenn du es willst."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/#anliegen', label: 'Anliegen beschreiben' }}
      />
    </SiteShell>
  );
}
