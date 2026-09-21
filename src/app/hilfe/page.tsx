import type { Metadata } from 'next';
import { canonical, ogBlock } from '@/lib/seo';
import { MarketingShell } from '@/components/marketing/site-shell';
import { EHScope, EHSection, EHPageHero, EHServiceIndex, EHProse, EHClosing, EHButton, EHEyebrow, EHHeading, EHText } from '@/design-system';
import { MiniContact } from '@/components/marketing/app-frames';
import { FaqExplorer } from './faq-explorer';

export const metadata: Metadata = { title: 'Hilfe & FAQ', description: 'Antworten zu Ablauf, Kosten, Ansprechpartnern, Hausakte und Partnern. Ehrlich und ohne Kleingedrucktes.' , alternates: { canonical: canonical('/hilfe') }, openGraph: ogBlock({ url: '/hilfe', title: 'Hilfe & FAQ · Einfach Hausen', description: 'Antworten zu Ablauf, Kosten, Ansprechpartnern, Hausakte und Partnern.', motiv: 'hilfe' }) };

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
  { q: 'Was ist die digitale Hausakte?', a: 'Sie bündelt Anlagen, Arbeiten, Dokumente, Garantien, Wartungen und Ansprechpartner langfristig an deinem Haus. Nach jedem Vorgang füllt sie sich automatisch.', cat: 'Hausakte' },
  { q: 'Was passiert bei einem Eigentümerwechsel?', a: 'Hausbezogene Geschichte kann kontrolliert weitergegeben werden. Private Nachrichten, Zahlungen und nicht freigegebene Daten werden nicht übertragen.', cat: 'Hausakte' },
  { q: 'Wem gehören meine Daten?', a: 'Dir. Du kannst die Hausakte exportieren und dein Konto jederzeit löschen. Wir verkaufen keine Daten und geben nichts ohne deine Freigabe weiter.', cat: 'Hausakte' },
] as const;

export default function Page() {
  return (
    <MarketingShell>
      <EHScope>
        <EHPageHero
          eyebrow="Hilfe & FAQ"
          title="Klare Antworten, bevor du irgendetwas beauftragst."
          text="Ablauf, Kosten, Partner, Hausakte. Wenn deine Frage fehlt, beschreib sie einfach als Anliegen. Auch eine Frage ist ein guter Start."
          actions={<><EHButton href="/#anliegen" arrow>Frage als Anliegen stellen</EHButton><EHButton href="/kontakt" variant="secondary">Kontaktwege</EHButton></>}
          media={<MiniContact />}
        />
        <EHSection compact>
          <EHEyebrow>Häufige Fragen</EHEyebrow>
          <EHHeading>Was du über Einfach Hausen wissen solltest.</EHHeading>
          {/* Ausnahme 05-WEB-03: FaqExplorer mit Kategoriefilter bleibt Bestand (EHFAQ hat keine Filterfunktion). */}
          <FaqExplorer entries={faq} />
        </EHSection>
        <EHSection compact>
          <EHEyebrow>Weiterführend</EHEyebrow>
          <EHHeading>Wenn du tiefer einsteigen willst.</EHHeading>
          <EHText size="lead">Antworten, Sicherheit, Ratgeber und Kontakt bleiben bewusst getrennte Wege — damit du schnell dort landest, wo du hinwillst.</EHText>
          <EHServiceIndex items={[
            { title: 'Sicherheit & Daten', text: 'Wie Partnerprüfung, Datenfreigaben und deine Entscheidungen geschützt werden.', href: '/sicherheit' },
            { title: 'Ratgeber', text: 'Konkrete Themen rund um Wartung, Sanierung und Entscheidungen am Haus.', href: '/blog' },
            { title: 'Lexikon', text: 'Begriffe kurz und verständlich nachschlagen, ohne Fachchinesisch.', href: '/lexikon' },
            { title: 'Kontakt', text: 'Wenn du lieber direkt mit uns klären möchtest, was als Nächstes sinnvoll ist.', href: '/kontakt' },
          ]} />
        </EHSection>
        <EHSection compact>
          <EHProse>
            <p><strong>Unser Anspruch.</strong> Verständlich bleiben. <mark>Bei jeder Frage, in jedem Schritt.</mark></p>
          </EHProse>
        </EHSection>
        <EHClosing title="Deine konkrete Frage ist ein guter Startpunkt." text="Leg kostenlos ein Hauskonto an und beschreib dein Anliegen in normalen Worten. Ein Auftrag entsteht daraus nur, wenn du es willst." href="/register?role=homeowner" label="Hauskonto kostenlos anlegen" secondary={<EHButton href="/#anliegen" variant="secondary">Anliegen starten</EHButton>} />
      </EHScope>
    </MarketingShell>
  );
}
