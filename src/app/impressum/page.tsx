import type { Metadata } from 'next';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { DocBlock, DocHero, DocLayout, LegalNav } from '@/components/site/page/blocks';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung von Einfach Hausen nach § 5 DDG.',
  alternates: { canonical: canonical('/impressum') },
};

export default function Page() {
  return (
    <SiteShell>
      <DocHero
        eyebrow="Rechtliches"
        title={
          <>
            Impressum &amp; Anbieter<wbr />kennzeichnung
          </>
        }
        text="Angaben gemäß § 5 des Digitale-Dienste-Gesetzes (DDG)."
      />

      <DocLayout>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <DocBlock title="Anbieterin der Plattform">
            <dl className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-x-8">
              <dt className="font-semibold text-ink">Inhaberin &amp; Geschäftsführerin</dt>
              <dd>Gina Schulze</dd>
              <dt className="font-semibold text-ink">Developer / technische Entwicklung</dt>
              <dd>Jeremy Schulze</dd>
              <dt className="font-semibold text-ink">Kontakt</dt>
              <dd>
                <a href="mailto:info@einfachhausen.de">info@einfachhausen.de</a>
              </dd>
              <dt className="font-semibold text-ink">Plattform</dt>
              <dd>Vermittlungs- und Organisationsportal für Eigenheimbesitzer &amp; regionale Handwerksbetriebe.</dd>
            </dl>
          </DocBlock>
          <div className="flex flex-col gap-6">
            <DocBlock title="Haftung für Inhalte und Links">
              <p>
                Als Diensteanbieter sind wir gemäß den allgemeinen Gesetzen für eigene Inhalte auf diesen Seiten verantwortlich. Für externe Links zu Webseiten
                Dritter übernehmen wir keine Gewähr, da auf deren Inhalte kein Einfluss besteht. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
                Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
            </DocBlock>
            <DocBlock title="Urheberrecht">
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung,
                Bearbeitung, Verbreitung und jede Art der Verwertung bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </DocBlock>
          </div>
        </div>
        <LegalNav
          items={[
            { href: '/datenschutz', label: 'Datenschutzerklärung' },
            { href: '/agb', label: 'AGB' },
            { href: '/kontakt', label: 'Kontakt & Support' },
          ]}
        />
      </DocLayout>
    </SiteShell>
  );
}
