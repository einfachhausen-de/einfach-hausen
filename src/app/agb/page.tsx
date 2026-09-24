import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { AlertPanel, DocBlock, DocHero, DocLayout, LegalNav } from '@/components/site/page/blocks';
import { CheckList } from '@/design-system/site';

export const metadata: Metadata = {
  title: 'AGB',
  description: 'Vertragsmodell, Verbraucherinformationen und AGB-Veröffentlichungsstatus von Einfach Hausen.',
  alternates: { canonical: canonical('/agb') },
};

const TOC = [
  { id: 'stand', label: 'Veröffentlichungsstatus' },
  { id: 'produktwahrheiten', label: 'Produktwahrheiten' },
  { id: 'kunden', label: 'Kundenverhältnis' },
  { id: 'partner', label: 'Partnerverhältnis' },
] as const;

export default function Page() {
  return (
    <SiteShell>
      <DocHero
        eyebrow="Rechtliches"
        title="Allgemeine Geschäftsbedingungen"
        text="Diese Seite macht das Produkt- und Vertragsmodell nachvollziehbar. Die finalen AGB bilden Betreiber, Rollen sowie reale Zahlungs- und Leistungsabläufe verbindlich ab."
      />

      <DocLayout toc={TOC}>
        <section id="stand" aria-labelledby="stand-title" className="scroll-mt-28">
          <h2 id="stand-title" className="sr-only">
            Veröffentlichungsstatus
          </h2>
          <AlertPanel icon={Scale} title="Vertrags- und Verbraucherbedingungen in externer Freigabe">
            Vertragspartner, Plattformrolle, Vertragsschluss, Entgelte, Abonnements, Kündigung, Widerruf, Haftung, Gewährleistung, Partnerbedingungen und
            Streitbeilegung werden vor dem finalen Rollout juristisch auditiert.
          </AlertPanel>
        </section>

        <DocBlock id="produktwahrheiten" title="Was im Produkt bereits bewusst getrennt ist">
          <CheckList
            items={[
              'Eine normale Frage erzeugt niemals automatisch einen kostenpflichtigen Auftrag.',
              '„Ansprechpartner finden“ und „Auftrag organisieren“ sind zwei getrennte, bewusste Entscheidungen.',
              'Ausführende Partnerbetriebe sind eigenständige Meister- und Fachbetriebe, keine Angestellten.',
              'Das Plattformmodell sieht 0 % Vermittlungsprovision auf das Auftragsvolumen vor.',
              'Ein bezahlter Partnertarif beeinflusst nicht das fachliche Matching für Kunden.',
            ]}
          />
          <p>Diese Produktregeln bilden das Fundament für die finalen Vertragsbedingungen.</p>
        </DocBlock>

        <DocBlock id="kunden" title="Wesentliche Regelungspunkte für Eigentümer">
          <ul>
            <li>Rolle von Einfach Hausen als vermittelnde und organisierende Software-Plattform.</li>
            <li>Klarer Zeitpunkt des Vertragsschlusses bei Anfragen, Angeboten und Terminvereinbarungen.</li>
            <li>Kostenlose Nutzung für Eigentümer: keine Mitgliedschaft, kein Abo, keine kostenpflichtigen Pakete.</li>
            <li>Fristen für Kündigung, Stornierung und gesetzliche Widerrufsrechte.</li>
            <li>Haftungs- und Gewährleistungsabgrenzung zwischen Plattform und ausführendem Partnerbetrieb.</li>
          </ul>
        </DocBlock>

        <DocBlock id="partner" title="Verbindliche Standards für Handwerksbetriebe">
          <ul>
            <li>Verifizierungsanforderungen: Gewerbeanmeldung, Betriebshaftpflicht und Qualifikationsnachweise.</li>
            <li>Regionale Zuteilung, Kapazitätssteuerung und Reaktionszeiten.</li>
            <li>Transparente monatliche Partnertarife ohne Provisionsabzüge.</li>
            <li>Klare Regelungen bei Gewährleistung, Angebotserstellung und Rechnungsstellung.</li>
          </ul>
          <p>
            <strong>Operative Verifizierung:</strong> Jeder Betrieb im Netzwerk durchläuft vor der Freigabe eine Dokumenten- und Qualitätsprüfung.
          </p>
        </DocBlock>

        <LegalNav
          items={[
            { href: '/impressum', label: 'Impressum' },
            { href: '/datenschutz', label: 'Datenschutzerklärung' },
            { href: '/kontakt', label: 'Kontakt & Support' },
          ]}
        />
      </DocLayout>
    </SiteShell>
  );
}
