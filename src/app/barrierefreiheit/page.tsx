import type { Metadata } from 'next';
import { ClipboardList, Keyboard, MousePointer2, ScanText } from 'lucide-react';
import { canonical } from '@/lib/seo';
import { SiteShell } from '@/components/site/site-shell';
import { AlertPanel, DocHero, FeatureCards, Heading, LegalNav, Section } from '@/components/site/page/blocks';
import { Reveal } from '@/components/marketing/motion';

export const metadata: Metadata = {
  title: 'Barrierefreiheit',
  description: 'Zugänglichkeitsprinzipien der Einfach-Hausen-Oberflächen.',
  alternates: { canonical: canonical('/barrierefreiheit') },
};

export default function Page() {
  return (
    <SiteShell>
      <DocHero
        eyebrow="Zugänglichkeit"
        title="Einfach soll auch zugänglich bedeuten."
        text="Die Website wird mit semantischer Struktur, sichtbaren Fokuszuständen, ausreichenden Touch-Zielen und reduzierbarer Bewegung entwickelt. Wir behaupten hier keine noch nicht geprüfte formale Konformitätsstufe."
      />

      <Section>
        <Heading eyebrow="Gestaltungsprinzipien" title="Zugänglichkeit ist Teil des Designs, nicht ein Zusatz." />
        <FeatureCards
          items={[
            { icon: Keyboard, title: 'Tastatur', text: 'Navigation und interaktive Elemente sollen mit sichtbarem Fokus erreichbar und bedienbar sein.' },
            { icon: MousePointer2, title: 'Touch-Ziele', text: 'Wichtige Aktionen sind auf mobile Nutzung mit ausreichend großen Bedienflächen ausgelegt.' },
            { icon: ScanText, title: 'Semantik & Lesbarkeit', text: 'Klare Überschriftenhierarchie, verständliche Linktexte und ausreichender Kontrast gehören zum Designvertrag.' },
          ]}
        />
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Status" title="Formale Prüfung bleibt ein eigener Launch-Schritt." />
        <Reveal y={12}>
          <AlertPanel icon={ClipboardList} title="Keine ungeprüfte Konformitätsbehauptung">
            Vor einer formalen Erklärung zur Barrierefreiheit sind die produktiven Oberflächen, Inhalte und Interaktionen mit geeigneten Prüfverfahren zu
            bewerten. Diese Seite beschreibt deshalb nur die verbindlichen Design- und Entwicklungsziele. Hinweise auf Barrieren nehmen wir gern über die{' '}
            <a href="/kontakt" className="font-semibold text-brand underline underline-offset-4">
              Kontaktwege
            </a>{' '}
            entgegen.
          </AlertPanel>
        </Reveal>
        <LegalNav
          items={[
            { href: '/impressum', label: 'Impressum' },
            { href: '/datenschutz', label: 'Datenschutz' },
            { href: '/kontakt', label: 'Kontakt' },
          ]}
        />
      </Section>
    </SiteShell>
  );
}
