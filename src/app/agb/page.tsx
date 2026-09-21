import type { Metadata } from 'next';
import { canonical } from '@/lib/seo';
import { MarketingShell } from '@/components/marketing/site-shell';
import { EHScope, EHSection, EHPageHero, EHList, EHPanel, EHButton, EHActions, EHEyebrow, EHHeading, EHText } from '@/design-system';
import { LegalNotice } from '@/components/marketing/ui';

export const metadata: Metadata = {
  title: 'AGB',
  description: 'Vertragsmodell, Verbraucherinformationen und AGB-Veröffentlichungsstatus von Einfach Hausen.',
  alternates: { canonical: canonical('/agb') },
};

export default function Page() {
  return (
    <MarketingShell>
      <EHScope>
      <EHPageHero
        eyebrow="Rechtliches"
        title="Allgemeine Geschäftsbedingungen"
        text="Diese Seite macht das Produkt- und Vertragsmodell nachvollziehbar. Die finalen AGB bilden Betreiber, Rollen sowie reale Zahlungs- und Leistungsabläufe verbindlich ab."
      />

      <EHSection compact>
        <EHEyebrow>Stand</EHEyebrow>
        <EHHeading>Rechtlicher Veröffentlichungsstatus.</EHHeading>
        <LegalNotice title="Vertrags- und Verbraucherbedingungen in externer Freigabe">
          <p>
            Vertragspartner, Plattformrolle, Vertragsschluss, Entgelte, Abonnements, Kündigung, Widerruf, Haftung, Gewährleistung, Partnerbedingungen und Streitbeilegung werden vor dem finalen Rollout juristisch auditiert.
          </p>
        </LegalNotice>
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Produktwahrheiten</EHEyebrow>
        <EHHeading>Was im Produkt bereits bewusst getrennt ist</EHHeading>
        <EHList label="Produktwahrheiten" items={[
          'Eine normale Frage erzeugt niemals automatisch einen kostenpflichtigen Auftrag.',
          '„Ansprechpartner finden“ und „Auftrag organisieren“ sind zwei getrennte, bewusste Entscheidungen.',
          'Ausführende Partnerbetriebe sind eigenständige Meister- und Fachbetriebe, keine Angestellten.',
          'Das Plattformmodell sieht 0 % Vermittlungsprovision auf das Auftragsvolumen vor.',
          'Ein bezahlter Partnertarif beeinflusst nicht das fachliche Matching für Kunden.',
        ].map((b, k) => ({ id: "agb-0-" + k, title: b }))} />
        <EHText>
          Diese Produktregeln bilden das Fundament für die finalen Vertragsbedingungen.
        </EHText>
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Kundenverhältnis</EHEyebrow>
        <EHHeading>Wesentliche Regelungspunkte für Eigentümer.</EHHeading>
        <EHList label="Kundenverhältnis" items={[
          'Rolle von Einfach Hausen als vermittelnde und organisierende Software-Plattform.',
          'Klarer Zeitpunkt des Vertragsschlusses bei Anfragen, Angeboten und Terminvereinbarungen.',
          'Kostenlose Nutzung für Eigentümer: keine Mitgliedschaft, kein Abo, keine kostenpflichtigen Pakete.',
          'Fristen für Kündigung, Stornierung und gesetzliche Widerrufsrechte.',
          'Haftungs- und Gewährleistungsabgrenzung zwischen Plattform und ausführendem Partnerbetrieb.',
        ].map((b, k) => ({ id: "agb-1-" + k, title: b }))} />
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Partnerverhältnis</EHEyebrow>
        <EHHeading>Verbindliche Standards für Handwerksbetriebe.</EHHeading>
        <EHList label="Partnerverhältnis" items={[
          'Verifizierungsanforderungen: Gewerbeanmeldung, Betriebshaftpflicht und Qualifikationsnachweise.',
          'Regionale Zuteilung, Kapazitätssteuerung und Reaktionszeiten.',
          'Transparente monatliche Partnertarife ohne Provisionsabzüge.',
          'Klare Regelungen bei Gewährleistung, Angebotserstellung und Rechnungsstellung.',
        ].map((b, k) => ({ id: "agb-2-" + k, title: b }))} />
        <EHPanel title="Operative Verifizierung">
          <p>
            Jeder Betrieb im Netzwerk durchläuft vor der Freigabe eine Dokumenten- und Qualitätsprüfung.
          </p>
        </EHPanel>
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Rechtliche Navigation</EHEyebrow>
        <EHHeading>Zugehörige Pflichtangaben und Dokumente.</EHHeading>
<EHActions>
          <EHButton href="/impressum">Impressum</EHButton>
          <EHButton href="/datenschutz" variant="secondary">Datenschutzerklärung</EHButton>
          <EHButton href="/kontakt" variant="secondary">Kontakt & Support</EHButton>
        </EHActions>
      </EHSection>
    </EHScope>
    </MarketingShell>
  );
}
