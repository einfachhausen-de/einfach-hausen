import type { Metadata } from 'next';
import { canonical } from '@/lib/seo';
import { MarketingShell } from '@/components/marketing/site-shell';
import { EHScope, EHSection, EHPageHero, EHPanel, EHButton, EHActions, EHEyebrow, EHHeading } from '@/design-system';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung von Einfach Hausen nach § 5 DDG.',
  alternates: { canonical: canonical('/impressum') }
};

export default function Page() {
  return (
    <MarketingShell>
      <EHScope>
      <EHPageHero
        eyebrow="Rechtliches"
        title={<>Impressum &amp; Anbieter<wbr />kennzeichnung</>}
        text="Angaben gemäß § 5 des Digitale-Dienste-Gesetzes (DDG)."
      />

      <EHSection compact>
        <EHEyebrow>Anbieter</EHEyebrow>
        <EHHeading>Verantwortliche Anbieterin der Plattform.</EHHeading>
        <EHPanel title="Einfach Hausen">
            <p>
              <strong>Inhaberin &amp; Geschäftsführerin:</strong> Gina Schulze<br />
              <strong>Developer / technische Entwicklung:</strong> Jeremy Schulze<br />
              <strong>Kontakt:</strong> info@einfachhausen.de<br />
              <strong>Plattform:</strong> Vermittlungs- und Organisationsportal für Eigenheimbesitzer &amp; regionale Handwerksbetriebe.
            </p>
        </EHPanel>
        <EHPanel title="Haftung für Inhalte und Links">
            <p>
              Als Diensteanbieter sind wir gemäß den allgemeinen Gesetzen für eigene Inhalte auf diesen Seiten verantwortlich. Für externe Links zu Webseiten Dritter übernehmen wir keine Gewähr, da auf deren Inhalte kein Einfluss besteht. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
        </EHPanel>
        <EHPanel title="Urheberrecht">
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
        </EHPanel>
      </EHSection>

      <EHSection compact>
        <EHEyebrow>Rechtliche Navigation</EHEyebrow>
        <EHHeading>Weitere Angaben</EHHeading>
        <EHActions>
          <EHButton href="/datenschutz">Datenschutzerklärung</EHButton>
          <EHButton href="/agb" variant="secondary">AGB</EHButton>
          <EHButton href="/kontakt" variant="secondary">Kontakt & Support</EHButton>
        </EHActions>
      </EHSection>
      </EHScope>
    </MarketingShell>
  );
}
